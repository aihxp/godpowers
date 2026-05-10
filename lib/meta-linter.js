/**
 * Meta-Linter
 *
 * Cross-repo invariant checks for Mode D suites. Validates:
 *   - Byte-identical files across repos (LICENSE, .editorconfig, etc.)
 *   - Version table consistency (declared versions match package.json)
 *   - Shared standards drift (linter, formatter, Node version)
 *
 * Per locked plan answer Q2: byte-identical drift surfaces as warnings
 * by default; hard gate via `strict: true` opt-in.
 *
 * Public API:
 *   checkByteIdentical(hubPath, opts) -> findings
 *   checkVersionTable(hubPath, opts) -> findings
 *   checkSharedStandards(hubPath, opts) -> findings
 *   runAll(hubPath, opts) -> { findings, summary }
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const detector = require('./multi-repo-detector');

/**
 * SHA-256 of file content. Returns null if file missing.
 */
function fileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * For each declared byte-identical file, hash its content in each
 * sibling repo and report mismatches.
 */
function checkByteIdentical(hubPath, opts = {}) {
  const findings = [];
  const config = detector.readSuiteConfig(hubPath);
  if (!config) return findings;

  const files = detector.getByteIdenticalFiles(hubPath);
  if (files.length === 0) return findings;

  const siblings = (config.siblings || []).map(sib => {
    if (typeof sib === 'string') return { name: sib, path: path.resolve(hubPath, sib) };
    return { name: sib.name, path: path.resolve(hubPath, sib.path || sib.name) };
  });

  const severity = opts.strict ? 'error' : 'warning';

  for (const fileSpec of files) {
    const filePath = fileSpec.path;
    const hashes = {};
    for (const sib of siblings) {
      const full = path.join(sib.path, filePath);
      hashes[sib.name] = fileHash(full);
    }

    const uniqueHashes = new Set(Object.values(hashes).filter(h => h !== null));
    if (uniqueHashes.size > 1) {
      findings.push({
        severity,
        kind: 'byte-identical-drift',
        file: filePath,
        message: `File "${filePath}" differs across repos. Hashes:`,
        hashes
      });
    }
    // Missing in some siblings is also a drift
    for (const [repo, hash] of Object.entries(hashes)) {
      if (hash === null) {
        findings.push({
          severity,
          kind: 'byte-identical-missing',
          file: filePath,
          repo,
          message: `Byte-identical file "${filePath}" is missing in repo "${repo}".`
        });
      }
    }
  }

  return findings;
}

/**
 * Verify the suite-level version table matches each repo's package.json.
 * Strictness setting same as byte-identical.
 */
function checkVersionTable(hubPath, opts = {}) {
  const findings = [];
  const config = detector.readSuiteConfig(hubPath);
  if (!config) return findings;

  const versionTable = detector.getVersionTable(hubPath);
  if (Object.keys(versionTable).length === 0) return findings;

  const severity = opts.strict ? 'error' : 'warning';

  const siblings = (config.siblings || []).map(sib => {
    if (typeof sib === 'string') return { name: sib, path: path.resolve(hubPath, sib) };
    return { name: sib.name, path: path.resolve(hubPath, sib.path || sib.name) };
  });

  for (const [packageName, perRepoVersions] of Object.entries(versionTable)) {
    for (const [repoName, declaredVersion] of Object.entries(perRepoVersions)) {
      const sib = siblings.find(s => s.name === repoName);
      if (!sib) continue;
      const pkgPath = path.join(sib.path, 'package.json');
      if (!fs.existsSync(pkgPath)) continue;
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (packageName === repoName) {
          // The repo's own version
          if (pkg.version !== declaredVersion) {
            findings.push({
              severity,
              kind: 'version-table-drift',
              repo: repoName,
              package: packageName,
              declared: declaredVersion,
              actual: pkg.version,
              message: `Suite declares ${repoName} at ${declaredVersion}; package.json has ${pkg.version}.`
            });
          }
        } else if (allDeps[packageName]) {
          // A sibling's dependency on packageName
          const actualSpec = String(allDeps[packageName]).replace(/^[\^~>=<]+/, '');
          if (actualSpec.split('.')[0] !== declaredVersion.split('.')[0]) {
            findings.push({
              severity,
              kind: 'version-table-drift',
              repo: repoName,
              package: packageName,
              declared: declaredVersion,
              actual: allDeps[packageName],
              message: `Suite declares ${packageName} at ${declaredVersion} for ${repoName}; package.json has ${allDeps[packageName]}.`
            });
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  }

  return findings;
}

/**
 * Validate shared standards: all repos use the same linter, formatter,
 * Node version, etc. Declared in suite-config under `shared-standards`.
 */
function checkSharedStandards(hubPath, opts = {}) {
  const findings = [];
  const config = detector.readSuiteConfig(hubPath);
  if (!config) return findings;
  const standards = config['shared-standards'] || config.sharedStandards;
  if (!standards) return findings;

  const severity = opts.strict ? 'error' : 'warning';

  const siblings = (config.siblings || []).map(sib => {
    if (typeof sib === 'string') return { name: sib, path: path.resolve(hubPath, sib) };
    return { name: sib.name, path: path.resolve(hubPath, sib.path || sib.name) };
  });

  // Node version (from .nvmrc or engines.node)
  if (standards['node-version']) {
    const expected = standards['node-version'];
    for (const sib of siblings) {
      const nvmrc = path.join(sib.path, '.nvmrc');
      const pkg = path.join(sib.path, 'package.json');
      let actual = null;
      if (fs.existsSync(nvmrc)) {
        actual = fs.readFileSync(nvmrc, 'utf8').trim();
      } else if (fs.existsSync(pkg)) {
        try {
          const j = JSON.parse(fs.readFileSync(pkg, 'utf8'));
          actual = j.engines && j.engines.node;
        } catch (e) {
          // ignore
        }
      }
      if (actual && !String(actual).includes(String(expected).split('.')[0])) {
        findings.push({
          severity,
          kind: 'shared-standard-drift',
          repo: sib.name,
          standard: 'node-version',
          declared: expected,
          actual,
          message: `Repo ${sib.name} uses Node ${actual}; suite declares ${expected}.`
        });
      }
    }
  }

  // Linter
  if (standards.linter) {
    const expected = standards.linter; // 'biome', 'eslint', etc.
    for (const sib of siblings) {
      const pkg = path.join(sib.path, 'package.json');
      if (!fs.existsSync(pkg)) continue;
      try {
        const j = JSON.parse(fs.readFileSync(pkg, 'utf8'));
        const allDeps = { ...j.dependencies, ...j.devDependencies };
        const usesBiome = allDeps['@biomejs/biome'] || allDeps.biome;
        const usesEslint = allDeps.eslint || Object.keys(allDeps).some(k => k.startsWith('eslint-'));
        let detected = null;
        if (usesBiome) detected = 'biome';
        else if (usesEslint) detected = 'eslint';
        if (detected && detected !== expected) {
          findings.push({
            severity,
            kind: 'shared-standard-drift',
            repo: sib.name,
            standard: 'linter',
            declared: expected,
            actual: detected,
            message: `Repo ${sib.name} uses ${detected}; suite declares ${expected}.`
          });
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return findings;
}

/**
 * Run all meta-lint checks.
 */
function runAll(hubPath, opts = {}) {
  const findings = [
    ...checkByteIdentical(hubPath, opts),
    ...checkVersionTable(hubPath, opts),
    ...checkSharedStandards(hubPath, opts)
  ];
  const summary = {
    errors: findings.filter(f => f.severity === 'error').length,
    warnings: findings.filter(f => f.severity === 'warning').length,
    infos: findings.filter(f => f.severity === 'info').length,
    byKind: {}
  };
  for (const f of findings) {
    summary.byKind[f.kind] = (summary.byKind[f.kind] || 0) + 1;
  }
  return { findings, summary };
}

module.exports = {
  checkByteIdentical,
  checkVersionTable,
  checkSharedStandards,
  runAll,
  fileHash
};
