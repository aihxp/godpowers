/**
 * Optional code intelligence capability detection.
 *
 * These tools sharpen refactors and reviews when present, but Godpowers must
 * keep working through grep-backed workflows when they are absent.
 */

const cp = require('child_process');

const AST_GREP_CANDIDATES = [
  { id: 'ast-grep', command: 'ast-grep', args: ['--version'], match: /ast-grep/i },
  { id: 'sg', command: 'sg', args: ['--version'], match: /\b(ast-grep|sg\s+\d)/i }
];

const LSP_CANDIDATES = [
  { id: 'omo-lsp', command: 'omo-lsp', args: ['--version'], languages: ['multi'] },
  { id: 'typescript-language-server', command: 'typescript-language-server', args: ['--version'], languages: ['javascript', 'typescript'] },
  { id: 'vscode-json-language-server', command: 'vscode-json-language-server', args: ['--version'], languages: ['json'] },
  { id: 'yaml-language-server', command: 'yaml-language-server', args: ['--version'], languages: ['yaml'] },
  { id: 'pyright-langserver', command: 'pyright-langserver', args: ['--version'], languages: ['python'] },
  { id: 'pylsp', command: 'pylsp', args: ['--version'], languages: ['python'] },
  { id: 'gopls', command: 'gopls', args: ['version'], languages: ['go'] },
  { id: 'rust-analyzer', command: 'rust-analyzer', args: ['--version'], languages: ['rust'] },
  { id: 'clangd', command: 'clangd', args: ['--version'], languages: ['c', 'cpp'] },
  { id: 'jdtls', command: 'jdtls', args: ['--version'], languages: ['java'] },
  { id: 'ruby-lsp', command: 'ruby-lsp', args: ['--version'], languages: ['ruby'] },
  { id: 'solargraph', command: 'solargraph', args: ['--version'], languages: ['ruby'] },
  { id: 'terraform-ls', command: 'terraform-ls', args: ['version'], languages: ['terraform'] }
];

function firstLine(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.split(/\r?\n/)[0] || 'installed';
}

function commandVersion(command, args, opts = {}) {
  try {
    const out = cp.execFileSync(command, args, {
      cwd: opts.cwd || process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: opts.timeout || 800
    });
    return firstLine(out) || 'installed';
  } catch (err) {
    return null;
  }
}

function checkCandidate(candidate, opts) {
  const version = firstLine(opts.commandVersion(candidate.command, candidate.args, {
    cwd: opts.cwd,
    timeout: opts.timeout
  }));
  if (!version) return null;
  if (candidate.match && !candidate.match.test(version)) return null;
  return {
    id: candidate.id,
    command: candidate.command,
    version,
    languages: candidate.languages || []
  };
}

function detectFirst(candidates, opts) {
  for (const candidate of candidates) {
    const found = checkCandidate(candidate, opts);
    if (found) return found;
  }
  return null;
}

function detectAll(candidates, opts) {
  const found = [];
  const limit = opts.maxTools || 5;
  for (const candidate of candidates) {
    const result = checkCandidate(candidate, opts);
    if (result) found.push(result);
    if (found.length >= limit) break;
  }
  return found;
}

function detect(projectRoot, opts = {}) {
  const root = projectRoot || process.cwd();
  const probe = opts.commandVersion || commandVersion;
  const probeOpts = {
    cwd: root,
    commandVersion: probe,
    timeout: opts.timeout || 800,
    maxTools: opts.maxTools || 5
  };

  const astGrep = detectFirst(opts.astGrepCandidates || AST_GREP_CANDIDATES, probeOpts);
  const lspTools = detectAll(opts.lspCandidates || LSP_CANDIDATES, probeOpts);
  const gaps = [];
  if (!astGrep) gaps.push('ast-grep not detected');
  if (lspTools.length === 0) gaps.push('LSP tools not detected');

  return {
    level: astGrep || lspTools.length > 0 ? 'available' : 'not-detected',
    astGrep: astGrep
      ? { available: true, command: astGrep.command, version: astGrep.version }
      : { available: false, command: null, version: null },
    lsp: {
      available: lspTools.length > 0,
      primary: lspTools[0] || null,
      tools: lspTools
    },
    gaps
  };
}

function lspSummary(lsp) {
  if (!lsp || !lsp.available) return 'not detected';
  return lsp.tools.map(tool => tool.command).join(', ');
}

function summary(report) {
  if (!report) return 'not detected';
  const parts = [];
  if (report.astGrep && report.astGrep.available) {
    parts.push(`ast-grep via ${report.astGrep.command}`);
  }
  if (report.lsp && report.lsp.available) {
    parts.push(`LSP via ${lspSummary(report.lsp)}`);
  }
  return parts.length > 0 ? parts.join('; ') : 'not detected';
}

function render(report) {
  const ast = report && report.astGrep && report.astGrep.available
    ? `${report.astGrep.command} (${report.astGrep.version})`
    : 'not detected';
  const lsp = report && report.lsp && report.lsp.available
    ? lspSummary(report.lsp)
    : 'not detected';
  const gaps = report && report.gaps && report.gaps.length > 0
    ? report.gaps.join('; ')
    : 'none';
  return [
    'Code intelligence:',
    `  Structural search: ${ast}`,
    `  LSP tools: ${lsp}`,
    `  Gaps: ${gaps}`
  ].join('\n');
}

module.exports = {
  detect,
  summary,
  render,
  _private: {
    AST_GREP_CANDIDATES,
    LSP_CANDIDATES,
    commandVersion,
    firstLine
  }
};
