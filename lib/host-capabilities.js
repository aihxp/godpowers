/**
 * Host capability detection.
 *
 * Reports what the current AI coding host can actually guarantee at runtime.
 * This keeps Godpowers honest when true fresh-context spawning or release
 * tools depend on the host environment.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

function exists(filePath) {
  return fs.existsSync(filePath);
}

function commandVersion(command, args, opts = {}) {
  try {
    const out = cp.execFileSync(command, args, {
      cwd: opts.cwd || process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: opts.timeout || 1500
    }).trim();
    return out.split(/\r?\n/)[0] || 'installed';
  } catch (err) {
    return null;
  }
}

function hostName(env) {
  if (env.CODEX_HOME || env.CODEX_SANDBOX || env.CODEX_ENV_PWD) return 'codex';
  if (env.CLAUDECODE || env.CLAUDE_CODE || env.CLAUDE_CONFIG_DIR) return 'claude';
  if (env.CURSOR_TRACE_ID || env.CURSOR_AGENT) return 'cursor';
  if (env.WINDSURF) return 'windsurf';
  return 'unknown';
}

function installedAgentSurfaces(homeDir) {
  const codexAgents = path.join(homeDir, '.codex', 'agents');
  const claudeAgents = path.join(homeDir, '.claude', 'agents');
  return {
    codex: exists(path.join(codexAgents, 'god-orchestrator.toml'))
      || exists(path.join(codexAgents, 'god-orchestrator.md')),
    claude: exists(path.join(claudeAgents, 'god-orchestrator.md'))
  };
}

function detect(projectRoot, opts = {}) {
  const env = opts.env || process.env;
  const homeDir = opts.homeDir || os.homedir();
  const root = projectRoot || process.cwd();
  const installedAgents = opts.installedAgents || installedAgentSurfaces(homeDir);
  const git = commandVersion('git', ['--version'], { cwd: root });
  const npm = commandVersion('npm', ['--version'], { cwd: root });
  const gh = commandVersion('gh', ['--version'], { cwd: root });
  const shell = Boolean(env.SHELL || env.ComSpec);
  const agentSpawn = Boolean(installedAgents.codex || installedAgents.claude || opts.agentSpawn);
  const extensionAuthoring = exists(path.join(root, 'lib', 'extension-authoring.js'))
    && exists(path.join(root, 'schema', 'extension-manifest.v1.json'));
  const suiteReleaseDryRun = exists(path.join(root, 'lib', 'suite-state.js'));

  const gaps = [];
  if (!shell) gaps.push('shell unavailable');
  if (!git) gaps.push('git unavailable');
  if (!npm) gaps.push('npm unavailable');
  if (!agentSpawn) gaps.push('fresh-context agent spawn not detected');
  if (!extensionAuthoring) gaps.push('extension authoring scaffold unavailable');
  if (!suiteReleaseDryRun) gaps.push('suite release dry-run unavailable');

  let level = 'unknown';
  if (shell && git && npm && agentSpawn) level = 'full';
  else if (shell && git && npm) level = 'degraded';

  return {
    host: opts.host || hostName(env),
    level,
    guarantees: {
      shell,
      fileEdit: true,
      node: process.version,
      git,
      npm,
      gh,
      agentSpawn,
      extensionAuthoring,
      suiteReleaseDryRun
    },
    installedAgents,
    gaps
  };
}

function summary(report) {
  if (!report) return 'unknown';
  if (report.level === 'full') return `full on ${report.host}`;
  const gap = report.gaps && report.gaps.length > 0 ? `, ${report.gaps[0]}` : '';
  return `${report.level} on ${report.host}${gap}`;
}

function render(report) {
  const lines = [];
  lines.push('Host capabilities:');
  lines.push(`  Host: ${report.host}`);
  lines.push(`  Guarantee level: ${report.level}`);
  lines.push(`  Agent spawn: ${report.guarantees.agentSpawn ? 'detected' : 'not detected'}`);
  lines.push(`  Shell: ${report.guarantees.shell ? 'detected' : 'not detected'}`);
  lines.push(`  Git: ${report.guarantees.git || 'not detected'}`);
  lines.push(`  npm: ${report.guarantees.npm || 'not detected'}`);
  lines.push(`  GitHub CLI: ${report.guarantees.gh || 'not detected'}`);
  lines.push(`  Gaps: ${report.gaps.length > 0 ? report.gaps.join('; ') : 'none'}`);
  return lines.join('\n');
}

module.exports = {
  detect,
  summary,
  render,
  _private: {
    commandVersion,
    hostName,
    installedAgentSurfaces
  }
};
