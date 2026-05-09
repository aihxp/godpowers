#!/usr/bin/env node

/**
 * Godpowers Installer
 *
 * Installs Godpowers globally for supported AI coding tools.
 * Usage: npx godpowers [options]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const VERSION = '0.1.0';

const BANNER = `
   ██████╗  ██████╗ ██████╗
  ██╔════╝ ██╔═══██╗██╔══██╗
  ██║  ███╗██║   ██║██║  ██║
  ██║   ██║██║   ██║██║  ██║
  ╚██████╔╝╚██████╔╝██████╔╝
   ╚═════╝  ╚═════╝ ╚═════╝
  GODPOWERS v${VERSION}
  Ship fast. Ship right. Ship everything.
`;

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg) {
  console.log(`  ${msg}`);
}

function success(msg) {
  console.log(`  \x1b[32m+\x1b[0m ${msg}`);
}

function warn(msg) {
  console.log(`  \x1b[33m!\x1b[0m ${msg}`);
}

function error(msg) {
  console.error(`  \x1b[31mx\x1b[0m ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyRecursive(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    runtimes: [],
    global: false,
    local: false,
    all: false,
    help: false,
    uninstall: false,
  };

  for (const arg of args) {
    switch (arg) {
      case '-g':
      case '--global':
        opts.global = true;
        break;
      case '-l':
      case '--local':
        opts.local = true;
        break;
      case '--all':
        opts.all = true;
        break;
      case '-h':
      case '--help':
        opts.help = true;
        break;
      case '-u':
      case '--uninstall':
        opts.uninstall = true;
        break;
      default:
        if (arg.startsWith('--') && RUNTIMES[arg.slice(2)]) {
          opts.runtimes.push(arg.slice(2));
        }
        break;
    }
  }

  return opts;
}

// ---------------------------------------------------------------------------
// Install
// ---------------------------------------------------------------------------

function installForRuntime(runtimeKey, srcDir) {
  const runtime = RUNTIMES[runtimeKey];
  if (!runtime) {
    error(`Unknown runtime: ${runtimeKey}`);
    return false;
  }

  log(`\n  Installing for \x1b[36m${runtime.name}\x1b[0m to \x1b[36m${runtime.configDir}\x1b[0m\n`);

  ensureDir(runtime.configDir);

  // 1. Install slash command skills to skills/
  // Each skill in skills/ becomes a slash command (e.g. /god-mode)
  const skillsSrc = path.join(srcDir, 'skills');
  const skillsDest = path.join(runtime.configDir, runtime.skillsDir);
  if (fs.existsSync(skillsSrc)) {
    ensureDir(skillsDest);
    let count = 0;
    for (const file of fs.readdirSync(skillsSrc)) {
      if (file.endsWith('.md')) {
        fs.copyFileSync(path.join(skillsSrc, file), path.join(skillsDest, file));
        count++;
      }
    }
    success(`Installed ${count} slash commands to skills/`);
  }

  // 2. Install specialist agents to agents/
  // Each agent is spawnable from a skill (e.g., god-pm, god-architect, god-executor)
  const agentsSrc = path.join(srcDir, 'agents');
  const agentsDest = path.join(runtime.configDir, 'agents');
  if (fs.existsSync(agentsSrc)) {
    ensureDir(agentsDest);
    let count = 0;
    for (const file of fs.readdirSync(agentsSrc)) {
      if (file.endsWith('.md')) {
        fs.copyFileSync(path.join(agentsSrc, file), path.join(agentsDest, file));
        count++;
      }
    }
    success(`Installed ${count} specialist agents to agents/`);
  }

  // 3. Install the master SKILL.md (always-on context)
  const masterSkill = path.join(srcDir, 'SKILL.md');
  if (fs.existsSync(masterSkill)) {
    const masterDest = path.join(skillsDest, 'godpowers.md');
    fs.copyFileSync(masterSkill, masterDest);
    success('Installed master SKILL.md as godpowers.md');
  }

  // 4. Install templates
  const templatesSrc = path.join(srcDir, 'templates');
  if (fs.existsSync(templatesSrc)) {
    const templatesDest = path.join(runtime.configDir, 'godpowers-templates');
    copyRecursive(templatesSrc, templatesDest);
    success('Installed templates/');
  }

  // 5. Install hooks (Claude Code only for now)
  if (runtimeKey === 'claude') {
    const hooksSrc = path.join(srcDir, 'hooks');
    const hooksDest = path.join(runtime.configDir, 'hooks');
    if (fs.existsSync(hooksSrc)) {
      ensureDir(hooksDest);
      for (const file of fs.readdirSync(hooksSrc)) {
        const src = path.join(hooksSrc, file);
        const dest = path.join(hooksDest, file);
        fs.copyFileSync(src, dest);
        try { fs.chmodSync(dest, 0o755); } catch (e) {}
      }
      success('Installed hooks/');
    }
  }

  // 6. Write VERSION
  fs.writeFileSync(path.join(runtime.configDir, 'GODPOWERS_VERSION'), VERSION);
  success(`Wrote GODPOWERS_VERSION (${VERSION})`);

  return true;
}

function showHelp() {
  console.log(BANNER);
  log('Usage: npx godpowers [options]\n');
  log('Options:');
  log('  -g, --global         Install globally (to config directory)');
  log('  -l, --local          Install locally (to current directory)');
  log('  --claude             Install for Claude Code');
  log('  --codex              Install for Codex');
  log('  --cursor             Install for Cursor');
  log('  --windsurf           Install for Windsurf');
  log('  --opencode           Install for OpenCode');
  log('  --gemini             Install for Gemini CLI');
  log('  --copilot            Install for GitHub Copilot');
  log('  --augment            Install for Augment');
  log('  --trae               Install for Trae');
  log('  --cline              Install for Cline');
  log('  --kilo               Install for Kilo');
  log('  --antigravity        Install for Antigravity');
  log('  --qwen               Install for Qwen Code');
  log('  --codebuddy          Install for CodeBuddy');
  log('  --pi                 Install for Pi');
  log('  --all                Install for all 15 runtimes');
  log('  -u, --uninstall      Uninstall Godpowers');
  log('  -h, --help           Show this help message');
  log('');
  log('Examples:');
  log('  npx godpowers --claude --global');
  log('  npx godpowers --all');
  log('  npx godpowers --codex --cursor');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    showHelp();
    process.exit(0);
  }

  console.log(BANNER);

  const srcDir = path.resolve(__dirname, '..');

  // Detect non-interactive and default to claude global
  if (opts.runtimes.length === 0 && !opts.all) {
    if (!process.stdin.isTTY) {
      warn('Non-interactive terminal detected, defaulting to Claude Code global install');
      opts.runtimes = ['claude'];
      opts.global = true;
    } else {
      // Interactive mode: default to claude
      opts.runtimes = ['claude'];
      opts.global = true;
    }
  }

  if (opts.all) {
    opts.runtimes = Object.keys(RUNTIMES);
  }

  let installed = 0;
  for (const runtime of opts.runtimes) {
    if (installForRuntime(runtime, srcDir)) {
      installed++;
    }
  }

  if (installed > 0) {
    log('');
    log(`\x1b[32mDone!\x1b[0m Installed Godpowers for ${installed} runtime(s).`);
    log('');
    log('Start a new session and type: \x1b[36mgod mode\x1b[0m');
    log('');
  } else {
    error('No runtimes installed. Run with --help for usage.');
    process.exit(1);
  }
}

main();
