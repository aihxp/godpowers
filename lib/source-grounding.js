const fs = require('fs');
const path = require('path');

const DEFAULT_IGNORE_DIRS = new Set([
  '.git',
  '.godpowers',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo'
]);

function normalizeRel(filePath) {
  return String(filePath || '').split(path.sep).join('/');
}

function listFiles(root, opts = {}) {
  const ignoreDirs = opts.ignoreDirs || DEFAULT_IGNORE_DIRS;
  const out = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (ignoreDirs.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        const rel = normalizeRel(path.relative(root, path.join(dir, entry.name)));
        out.push(rel);
      }
    }
  }
  if (fs.existsSync(root)) walk(root);
  return out.sort();
}

function parseSectionLists(planText) {
  const result = {
    existingFiles: [],
    existingSymbols: [],
    newArtifacts: [],
    unchecked: []
  };
  let section = null;
  const lines = String(planText || '').split(/\r?\n/);
  for (const raw of lines) {
    const heading = raw.match(/^#{2,4}\s+(.+)$/);
    if (heading) {
      const title = heading[1].toLowerCase();
      if (/existing (files|references)/.test(title)) section = 'existingFiles';
      else if (/existing symbols/.test(title)) section = 'existingSymbols';
      else if (/new artifacts|files to create/.test(title)) section = 'newArtifacts';
      else if (/unchecked references|unknown references/.test(title)) section = 'unchecked';
      else section = null;
      continue;
    }
    if (!section) continue;
    const item = raw.match(/^\s*[-*]\s+(.*)$/);
    if (!item) continue;
    const value = item[1]
      .replace(/^(file|symbol|new|unchecked)\s*:\s*/i, '')
      .replace(/^`|`$/g, '')
      .trim();
    if (value) result[section].push(value);
  }
  return result;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function findSymbolInFiles(root, symbol, files) {
  const needle = String(symbol || '').trim();
  if (!needle) return [];
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`);
  const hits = [];
  for (const rel of files) {
    const full = path.join(root, rel);
    let text;
    try {
      text = fs.readFileSync(full, 'utf8');
    } catch (_) {
      continue;
    }
    if (re.test(text)) hits.push(rel);
  }
  return hits;
}

function checkPlan(projectRoot, planText, opts = {}) {
  const parsed = parseSectionLists(planText);
  const existingFiles = unique([...(opts.existingFiles || []), ...parsed.existingFiles]);
  const existingSymbols = unique([...(opts.existingSymbols || []), ...parsed.existingSymbols]);
  const newArtifacts = unique([...(opts.newArtifacts || []), ...parsed.newArtifacts]);
  const unchecked = unique([...(opts.unchecked || []), ...parsed.unchecked]);
  const files = listFiles(projectRoot, opts);
  const fileSet = new Set(files);

  const fileChecks = existingFiles.map(file => ({
    type: 'file',
    value: normalizeRel(file),
    status: fileSet.has(normalizeRel(file)) ? 'pass' : 'fail'
  }));

  const symbolChecks = existingSymbols.map(symbol => {
    const hits = findSymbolInFiles(projectRoot, symbol, files);
    return {
      type: 'symbol',
      value: symbol,
      status: hits.length > 0 ? 'pass' : 'fail',
      files: hits
    };
  });

  const checks = [...fileChecks, ...symbolChecks];
  const failures = checks.filter(check => check.status === 'fail');
  const warnings = unchecked.map(value => ({
    type: 'unchecked',
    value,
    status: 'warn'
  }));
  const newArtifactSet = new Set(newArtifacts.map(normalizeRel));
  const declaredNew = newArtifacts.map(file => ({
    type: 'new-artifact',
    value: normalizeRel(file),
    status: fileSet.has(normalizeRel(file)) ? 'exists' : 'declared-new'
  }));

  return {
    ok: failures.length === 0,
    checks,
    failures,
    warnings,
    declaredNew,
    newArtifacts: [...newArtifactSet],
    summary: {
      pass: checks.filter(check => check.status === 'pass').length,
      fail: failures.length,
      warn: warnings.length,
      declaredNew: declaredNew.length
    }
  };
}

function renderReport(result) {
  const lines = [];
  lines.push(`Source grounding: ${result.ok ? 'PASS' : 'FAIL'}`);
  lines.push(`  passed: ${result.summary.pass}`);
  lines.push(`  failed: ${result.summary.fail}`);
  lines.push(`  unchecked: ${result.summary.warn}`);
  if (result.failures.length > 0) {
    lines.push('');
    lines.push('Failures:');
    for (const failure of result.failures) {
      lines.push(`  - ${failure.type}: ${failure.value}`);
    }
  }
  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('Unchecked references:');
    for (const warning of result.warnings) {
      lines.push(`  - ${warning.value}`);
    }
  }
  return lines.join('\n');
}

module.exports = {
  DEFAULT_IGNORE_DIRS,
  listFiles,
  parseSectionLists,
  checkPlan,
  renderReport,
  findSymbolInFiles
};
