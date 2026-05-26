const path = require('path');
const os = require('os');

const RUNTIMES = {
  claude: {
    name: 'Claude Code',
    configDir: path.join(os.homedir(), '.claude'),
    skillsDir: 'skills',
    configFile: null,
  },
  codex: {
    name: 'Codex',
    configDir: path.join(os.homedir(), '.codex'),
    skillsDir: 'skills',
    configFile: 'config.toml',
    agentMetadata: 'toml',
  },
  cursor: {
    name: 'Cursor',
    configDir: path.join(os.homedir(), '.cursor'),
    skillsDir: 'rules',
    configFile: null,
  },
  windsurf: {
    name: 'Windsurf',
    configDir: path.join(os.homedir(), '.windsurf'),
    skillsDir: 'rules',
    configFile: null,
  },
  opencode: {
    name: 'OpenCode',
    configDir: path.join(os.homedir(), '.opencode'),
    skillsDir: 'skills',
    configFile: null,
  },
  gemini: {
    name: 'Gemini CLI',
    configDir: path.join(os.homedir(), '.gemini'),
    skillsDir: 'skills',
    configFile: null,
  },
  copilot: {
    name: 'GitHub Copilot',
    configDir: path.join(os.homedir(), '.copilot'),
    skillsDir: 'skills',
    configFile: null,
  },
  augment: {
    name: 'Augment',
    configDir: path.join(os.homedir(), '.augment'),
    skillsDir: 'skills',
    configFile: null,
  },
  trae: {
    name: 'Trae',
    configDir: path.join(os.homedir(), '.trae'),
    skillsDir: 'skills',
    configFile: null,
  },
  cline: {
    name: 'Cline',
    configDir: path.join(os.homedir(), '.cline'),
    skillsDir: 'skills',
    configFile: null,
  },
  kilo: {
    name: 'Kilo',
    configDir: path.join(os.homedir(), '.kilo'),
    skillsDir: 'skills',
    configFile: null,
  },
  antigravity: {
    name: 'Antigravity',
    configDir: path.join(os.homedir(), '.antigravity'),
    skillsDir: 'skills',
    configFile: null,
  },
  qwen: {
    name: 'Qwen Code',
    configDir: path.join(os.homedir(), '.qwen'),
    skillsDir: 'skills',
    configFile: null,
  },
  codebuddy: {
    name: 'CodeBuddy',
    configDir: path.join(os.homedir(), '.codebuddy'),
    skillsDir: 'skills',
    configFile: null,
  },
  pi: {
    name: 'Pi',
    configDir: path.join(os.homedir(), '.pi'),
    skillsDir: 'skills',
    configFile: null,
  },
};

function resolveRuntime(runtimeKey, opts = {}) {
  const runtime = RUNTIMES[runtimeKey];
  if (!runtime) return null;
  const resolved = { ...runtime };
  if (opts.local && !opts.global) {
    resolved.configDir = path.join(process.cwd(), path.basename(runtime.configDir));
  }
  return resolved;
}

module.exports = {
  RUNTIMES,
  resolveRuntime,
  runtimeKeys: () => Object.keys(RUNTIMES)
};
