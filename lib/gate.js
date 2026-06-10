/**
 * Executable Godpowers tier gates.
 *
 * Phase 1 gates verify required artifacts on disk, run the shared artifact
 * linter, and apply only narrow tier-specific checks for repo, build, and
 * harden evidence.
 */

const fs = require('fs');
const path = require('path');

const artifactMap = require('./artifact-map');
const linter = require('./artifact-linter');

function evaluate(opts = {}) {
  const projectRoot = path.resolve(opts.projectRoot || opts.project || process.cwd());
  const tier = artifactMap.normalizeTier(opts.tier);
  const definitions = artifactMap.tierArtifacts(tier);
  const artifacts = [];
  const checks = [];
  const findings = [];

  if (!tier || definitions.length === 0) {
    addCheck(checks, 'tier.known', 'fail', null, `Unknown gate tier: ${opts.tier || ''}`);
    findings.push(makeFinding('G-TIER', 'error', null, `Unknown gate tier: ${opts.tier || ''}`));
    return finish(projectRoot, tier || String(opts.tier || ''), artifacts, checks, findings);
  }

  for (const def of definitions) {
    const resolved = resolveArtifact(projectRoot, def);
    const artifact = {
      id: def.id,
      path: resolved.relPath,
      required: def.required === true,
      present: resolved.present,
      linted: false
    };
    artifacts.push(artifact);

    addCheck(
      checks,
      `artifact.${def.id}.exists`,
      resolved.present || !def.required ? 'pass' : 'fail',
      resolved.relPath,
      resolved.present
        ? `${def.id} artifact exists.`
        : `${def.id} artifact is required for the ${tier} gate.`
    );

    if (!resolved.present) {
      if (def.required) {
        findings.push(makeFinding('G-MISSING-ARTIFACT', 'error', resolved.relPath, `${def.id} artifact is missing.`));
      }
      continue;
    }

    if (def.lint !== false) {
      const lintResult = linter.lintFile(resolved.fullPath, { projectRoot, today: opts.today });
      artifact.linted = true;
      artifact.type = lintResult.type;
      const status = lintResult.summary.errors > 0 ? 'fail' : 'pass';
      addCheck(
        checks,
        `lint.${def.id}`,
        status,
        resolved.relPath,
        `Artifact linter reported ${lintResult.summary.errors} error(s) and ${lintResult.summary.warnings} warning(s).`
      );
      for (const finding of lintResult.findings) {
        findings.push({
          ...finding,
          artifact: def.id,
          path: resolved.relPath
        });
      }
    }
  }

  if (tier === 'build') {
    checkBuildEvidence(projectRoot, artifacts, checks, findings);
  }
  if (tier === 'harden') {
    checkHardenFindings(projectRoot, artifacts, checks, findings);
  }

  return finish(projectRoot, tier, artifacts, checks, findings);
}

async function evaluateAsync(opts = {}) {
  return evaluate(opts);
}

function resolveArtifact(projectRoot, def) {
  const candidates = def.paths || [def.path];
  for (const relPath of candidates) {
    const fullPath = path.join(projectRoot, relPath);
    if (fs.existsSync(fullPath)) {
      return { relPath, fullPath, present: true };
    }
  }
  const relPath = candidates[0];
  return { relPath, fullPath: path.join(projectRoot, relPath), present: false };
}

function checkBuildEvidence(projectRoot, artifacts, checks, findings) {
  const artifact = artifacts.find((item) => item.id === 'build-state' && item.present);
  if (!artifact) {
    addCheck(checks, 'build.verification-evidence', 'fail', '.godpowers/build/STATE.md', 'Build state artifact is missing.');
    return;
  }

  const text = fs.readFileSync(path.join(projectRoot, artifact.path), 'utf8');
  const commands = extractPassedCommands(text);
  const status = commands.length > 0 ? 'pass' : 'fail';
  addCheck(
    checks,
    'build.verification-evidence',
    status,
    artifact.path,
    status === 'pass'
      ? `Build state records passed verification command(s): ${commands.join(', ')}.`
      : 'Build state must record exact project verification commands that passed.'
  );
  if (status === 'fail') {
    findings.push(makeFinding(
      'G-BUILD-EVIDENCE',
      'error',
      artifact.path,
      'Build state is missing passed verification command evidence.'
    ));
  }
}

function extractPassedCommands(text) {
  const commands = [];
  for (const line of text.split(/\r?\n/)) {
    if (!/(pass|passed|green|succeeded)/i.test(line)) continue;
    const matches = [...line.matchAll(/`([^`]+)`/g)].map((match) => match[1].trim()).filter(Boolean);
    commands.push(...matches);
  }
  return [...new Set(commands)];
}

function checkHardenFindings(projectRoot, artifacts, checks, findings) {
  const artifact = artifacts.find((item) => item.id === 'harden-findings' && item.present);
  if (!artifact) {
    addCheck(checks, 'harden.critical-findings', 'fail', '.godpowers/harden/FINDINGS.md', 'Harden findings artifact is missing.');
    return;
  }

  const text = fs.readFileSync(path.join(projectRoot, artifact.path), 'utf8');
  const critical = criticalVerdict(text);
  addCheck(
    checks,
    'harden.critical-findings',
    critical.ok ? 'pass' : 'fail',
    artifact.path,
    critical.reason
  );
  if (!critical.ok) {
    findings.push(makeFinding('G-HARDEN-CRITICAL', 'error', artifact.path, critical.reason));
  }
}

function criticalVerdict(text) {
  if (/\*\*Launch gate\*\*:\s*BLOCKED/i.test(text) || /Launch gate:\s*BLOCKED/i.test(text)) {
    return { ok: false, reason: 'Launch gate is blocked by harden findings.' };
  }
  if (/\*\*Launch gate\*\*:\s*PASSED/i.test(text) || /Launch gate:\s*PASSED/i.test(text)) {
    return { ok: true, reason: 'Launch gate is passed.' };
  }

  const criticalCount = text.match(/\|\s*Critical\s*\|\s*(\d+)\s*\|/i);
  if (criticalCount && Number(criticalCount[1]) > 0) {
    return { ok: false, reason: `${Number(criticalCount[1])} Critical harden finding(s) remain unresolved.` };
  }

  const criticalSections = text.match(/^###\s+\[CRITICAL-[^\n]+(?:\n(?!###\s+\[).*)*/gim) || [];
  const unresolved = criticalSections.filter(section => !(
    /\*\*Status\*\*:\s*(Fixed|Accepted-Risk)/i.test(section)
    || /Status:\s*(Fixed|Accepted-Risk)/i.test(section)
  ));
  if (unresolved.length > 0) {
    return { ok: false, reason: `${unresolved.length} unresolved Critical harden finding(s) remain.` };
  }

  return { ok: true, reason: 'No unresolved Critical harden findings detected.' };
}

function addCheck(checks, id, status, relPath, reason) {
  checks.push({ id, status, path: relPath, reason });
}

function makeFinding(code, severity, relPath, message) {
  return {
    code,
    severity,
    line: 1,
    column: 1,
    message,
    suggestion: null,
    path: relPath,
    artifact: null
  };
}

function finish(projectRoot, tier, artifacts, checks, findings) {
  const failedChecks = checks.filter((check) => check.status === 'fail').length;
  const errors = findings.filter((finding) => finding.severity === 'error').length;
  const warnings = findings.filter((finding) => finding.severity === 'warning').length;
  const verdict = failedChecks > 0 || errors > 0 ? 'fail' : 'pass';
  return {
    tier,
    verdict,
    artifacts,
    checks,
    findings,
    summary: {
      projectRoot,
      checks: checks.length,
      failedChecks,
      errors,
      warnings
    }
  };
}

function runCli(opts = {}) {
  const result = evaluate(opts);
  console.log(JSON.stringify(result, null, 2));
  if (result.verdict !== 'pass') process.exitCode = 1;
  return result;
}

module.exports = {
  evaluate,
  evaluateAsync,
  check: evaluate,
  checkAsync: evaluateAsync,
  runCli,
  criticalVerdict,
  extractPassedCommands
};
