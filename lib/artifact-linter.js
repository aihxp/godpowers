/**
 * Artifact Linter
 *
 * Orchestrator for per-artifact lint runs. Detects artifact type from path,
 * loads the file, runs the right have-nots checks, returns structured
 * findings.
 *
 * Public API:
 *   detectType(filePath) -> 'prd'|'arch'|'roadmap'|'stack'|'design'|'product'|'domain'|null
 *   lintFile(filePath, opts) -> { type, findings, summary }
 *   lintAll(projectRoot, opts) -> [{ path, type, findings, summary }, ...]
 *
 * Findings structure:
 *   { code, severity, line, column, message, suggestion }
 */

const fs = require('fs');
const path = require('path');
const validator = require('./have-nots-validator');

/**
 * Detect artifact type from path. Returns null for unknown.
 */
function detectType(filePath) {
  const lower = filePath.toLowerCase();
  const basename = path.basename(lower);
  if (lower.includes('/prd/') || basename === 'prd.md') return 'prd';
  if (lower.includes('/arch/') || basename === 'arch.md') return 'arch';
  if (lower.includes('/roadmap/') || basename === 'roadmap.md') return 'roadmap';
  if (lower.includes('/stack/') || basename === 'stack-decision.md' || basename === 'decision.md') return 'stack';
  if (lower.includes('/domain/') || basename === 'domain-glossary.md' || basename === 'glossary.md') return 'domain';
  if (basename === 'design.md') return 'design';
  if (basename === 'product.md') return 'product';
  if (basename === 'postmortem.md') return 'postmortem';
  if (basename === 'spike.md') return 'spike';
  if (basename === 'migration.md') return 'migration';
  return null;
}

/**
 * Lint a single file. Returns { type, findings, summary }.
 */
function lintFile(filePath, opts = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const type = detectType(filePath);
  const ctx = {
    projectRoot: opts.projectRoot || process.cwd(),
    docDir: path.dirname(filePath),
    today: opts.today,
    prdContent: opts.prdContent,
    ...opts
  };

  // For ARCH, auto-load PRD if not provided
  if (type === 'arch' && !ctx.prdContent) {
    const prdPath = path.join(ctx.projectRoot, '.godpowers', 'prd', 'PRD.md');
    if (fs.existsSync(prdPath)) {
      ctx.prdContent = fs.readFileSync(prdPath, 'utf8');
    }
  }

  const findings = validator.runChecks(content, type, ctx);
  const summary = validator.summarize(findings);

  return {
    path: filePath,
    type: type || 'unknown',
    findings,
    summary
  };
}

/**
 * Lint all known artifacts in a project.
 */
function lintAll(projectRoot, opts = {}) {
  const root = projectRoot || process.cwd();
  const candidates = [
    '.godpowers/prd/PRD.md',
    '.godpowers/arch/ARCH.md',
    '.godpowers/roadmap/ROADMAP.md',
    '.godpowers/stack/DECISION.md',
    '.godpowers/domain/GLOSSARY.md',
    '.godpowers/design/DESIGN.md',
    'DESIGN.md',
    'PRODUCT.md'
  ];
  const results = [];
  for (const rel of candidates) {
    const full = path.join(root, rel);
    if (fs.existsSync(full)) {
      results.push(lintFile(full, { projectRoot: root, ...opts }));
    }
  }
  return results;
}

/**
 * Format findings as a human-readable report string.
 */
function formatReport(result) {
  const lines = [];
  lines.push(`\n${result.path}`);
  lines.push(`  Type: ${result.type}`);
  lines.push(`  Errors: ${result.summary.errors}, Warnings: ${result.summary.warnings}, Info: ${result.summary.infos}`);
  if (result.findings.length === 0) {
    lines.push('  Clean: no findings.');
    return lines.join('\n');
  }
  for (const f of result.findings) {
    lines.push(`  [${f.code}] ${f.severity.toUpperCase()} line ${f.line}: ${f.message}`);
    if (f.suggestion) {
      lines.push(`         -> ${f.suggestion}`);
    }
  }
  return lines.join('\n');
}

/**
 * Aggregate summary across multiple lint results.
 */
function aggregate(results) {
  const totals = { errors: 0, warnings: 0, infos: 0, byCode: {}, files: results.length };
  for (const r of results) {
    totals.errors += r.summary.errors;
    totals.warnings += r.summary.warnings;
    totals.infos += r.summary.infos;
    for (const code of Object.keys(r.summary.byCode)) {
      totals.byCode[code] = (totals.byCode[code] || 0) + r.summary.byCode[code];
    }
  }
  return totals;
}

module.exports = {
  detectType,
  lintFile,
  lintAll,
  formatReport,
  aggregate
};
