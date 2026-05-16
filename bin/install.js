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

const VERSION = require('../package.json').version;

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

function copyRuntimeBundle(srcDir, destDir) {
  ensureDir(destDir);
  for (const dir of ['lib', 'routing', 'workflows', 'schema', 'templates', 'references']) {
    const src = path.join(srcDir, dir);
    if (fs.existsSync(src)) {
      copyRecursive(src, path.join(destDir, dir));
    }
  }
  const packageJson = path.join(srcDir, 'package.json');
  if (fs.existsSync(packageJson)) {
    fs.copyFileSync(packageJson, path.join(destDir, 'package.json'));
  }
}

function installSkillFile(srcFile, skillsDest, runtimeKey, targetName = null) {
  const baseName = targetName || path.basename(srcFile, '.md');
  if (runtimeKey === 'codex') {
    const skillDir = path.join(skillsDest, baseName);
    if (fs.existsSync(skillDir)) {
      fs.rmSync(skillDir, { recursive: true, force: true });
    }
    ensureDir(skillDir);
    fs.copyFileSync(srcFile, path.join(skillDir, 'SKILL.md'));
    return;
  }
  fs.copyFileSync(srcFile, path.join(skillsDest, `${baseName}.md`));
}

function parseAgentFrontmatter(content) {
  const fallback = { name: null, description: null };
  if (!content.startsWith('---\n')) return fallback;

  const end = content.indexOf('\n---', 4);
  if (end === -1) return fallback;

  const lines = content.slice(4, end).split('\n');
  const parsed = { ...fallback };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nameMatch = line.match(/^name:\s*(.+)\s*$/);
    if (nameMatch) {
      parsed.name = nameMatch[1].replace(/^["']|["']$/g, '');
      continue;
    }

    if (line === 'description: |') {
      const desc = [];
      i++;
      while (i < lines.length && /^ {2}/.test(lines[i])) {
        desc.push(lines[i].slice(2));
        i++;
      }
      i--;
      parsed.description = desc.join('\n').trim();
      continue;
    }

    const descMatch = line.match(/^description:\s*(.+)\s*$/);
    if (descMatch) {
      parsed.description = descMatch[1].replace(/^["']|["']$/g, '');
    }
  }

  return parsed;
}

function stripFrontmatter(content) {
  if (!content.startsWith('---\n')) return content.trim();
  const end = content.indexOf('\n---', 4);
  if (end === -1) return content.trim();
  return content.slice(end + 4).trim();
}

function tomlString(value) {
  return JSON.stringify(value || '');
}

function tomlLiteral(value) {
  return `'''\n${(value || '').replace(/'''/g, "'''\\'''")}\n'''`;
}

function writeCodexAgentToml(srcFile, agentsDest) {
  const content = fs.readFileSync(srcFile, 'utf8');
  const frontmatter = parseAgentFrontmatter(content);
  const name = frontmatter.name || path.basename(srcFile, '.md');
  const description = frontmatter.description || `Godpowers specialist agent: ${name}.`;
  const instructions = stripFrontmatter(content);
  const toml = [
    `name = ${tomlString(name)}`,
    `description = ${tomlString(description)}`,
    'sandbox_mode = "workspace-write"',
    `developer_instructions = ${tomlLiteral(instructions)}`,
    ''
  ].join('\n');

  fs.writeFileSync(path.join(agentsDest, `${name}.toml`), toml);
}

function installAgentFile(srcFile, agentsDest, runtime) {
  fs.copyFileSync(srcFile, path.join(agentsDest, path.basename(srcFile)));
  if (runtime.agentMetadata === 'toml') {
    writeCodexAgentToml(srcFile, agentsDest);
  }
}

function removeSkillEntry(skillsDir, entry) {
  const entryPath = path.join(skillsDir, entry.name);
  if (entry.isDirectory()) {
    const skillFile = path.join(entryPath, 'SKILL.md');
    if (entry.name.startsWith('god-') || entry.name === 'god' || entry.name === 'godpowers') {
      if (fs.existsSync(skillFile)) {
        fs.rmSync(entryPath, { recursive: true, force: true });
        return true;
      }
    }
    return false;
  }
  if (entry.name.startsWith('god-') || entry.name === 'god.md' || entry.name === 'godpowers.md') {
    fs.unlinkSync(entryPath);
    return true;
  }
  return false;
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

function installForRuntime(runtimeKey, srcDir, opts = {}) {
  const runtime = resolveRuntime(runtimeKey, opts);
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
        installSkillFile(path.join(skillsSrc, file), skillsDest, runtimeKey);
        count++;
      }
    }
    const shape = runtimeKey === 'codex' ? 'Codex skill directories' : 'skills/';
    success(`Installed ${count} slash commands to ${shape}`);
  }

  // 2. Install specialist agents to agents/
  // Each agent is spawnable from a skill (e.g., god-pm, god-architect, god-executor)
  const agentsSrc = path.join(srcDir, 'agents');
  const agentsDest = path.join(runtime.configDir, 'agents');
  if (fs.existsSync(agentsSrc)) {
    ensureDir(agentsDest);
    let count = 0;
    for (const file of fs.readdirSync(agentsSrc)) {
      if (/^god-.*\.md$/.test(file)) {
        const srcFile = path.join(agentsSrc, file);
        installAgentFile(srcFile, agentsDest, runtime);
        count++;
      }
    }
    const shape = runtime.agentMetadata === 'toml' ? 'agents/ with Codex metadata' : 'agents/';
    success(`Installed ${count} specialist agents to ${shape}`);
  }

  // 3. Install the master SKILL.md (always-on context)
  const masterSkill = path.join(srcDir, 'SKILL.md');
  if (fs.existsSync(masterSkill)) {
    installSkillFile(masterSkill, skillsDest, runtimeKey, 'godpowers');
    success('Installed master SKILL.md as godpowers');
  }

  // 4. Install templates
  const templatesSrc = path.join(srcDir, 'templates');
  if (fs.existsSync(templatesSrc)) {
    const templatesDest = path.join(runtime.configDir, 'godpowers-templates');
    copyRecursive(templatesSrc, templatesDest);
    success('Installed templates/');
  }

  // 4b. Install references (HAVE-NOTS catalog and per-tier antipatterns)
  const referencesSrc = path.join(srcDir, 'references');
  if (fs.existsSync(referencesSrc)) {
    const referencesDest = path.join(runtime.configDir, 'godpowers-references');
    copyRecursive(referencesSrc, referencesDest);
    success('Installed references/');
  }

  // 4c. Install workflows (declarative YAML for /god-mode and friends)
  const workflowsSrc = path.join(srcDir, 'workflows');
  if (fs.existsSync(workflowsSrc)) {
    const workflowsDest = path.join(runtime.configDir, 'godpowers-workflows');
    copyRecursive(workflowsSrc, workflowsDest);
    success('Installed workflows/');
  }

  // 4d. Install schemas (for validation)
  const schemaSrc = path.join(srcDir, 'schema');
  if (fs.existsSync(schemaSrc)) {
    const schemaDest = path.join(runtime.configDir, 'godpowers-schema');
    copyRecursive(schemaSrc, schemaDest);
    success('Installed schema/');
  }

  // 4e. Install routing definitions (per-command prerequisites + next-suggestions)
  const routingSrc = path.join(srcDir, 'routing');
  if (fs.existsSync(routingSrc)) {
    const routingDest = path.join(runtime.configDir, 'godpowers-routing');
    copyRecursive(routingSrc, routingDest);
    success('Installed routing/');
  }

  // 4f. Install the executable runtime bundle with lib/ next to its data dirs.
  const runtimeBundleDest = path.join(runtime.configDir, 'godpowers-runtime');
  copyRuntimeBundle(srcDir, runtimeBundleDest);
  success('Installed runtime bundle/');

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

// ---------------------------------------------------------------------------
// Uninstall
// ---------------------------------------------------------------------------

function uninstallForRuntime(runtimeKey, opts = {}) {
  const runtime = resolveRuntime(runtimeKey, opts);
  if (!runtime) {
    error(`Unknown runtime: ${runtimeKey}`);
    return false;
  }

  log(`\n  Uninstalling from \x1b[36m${runtime.name}\x1b[0m at \x1b[36m${runtime.configDir}\x1b[0m\n`);

  const skillsDir = path.join(runtime.configDir, runtime.skillsDir);
  const agentsDir = path.join(runtime.configDir, 'agents');
  const templatesDir = path.join(runtime.configDir, 'godpowers-templates');
  const referencesDir = path.join(runtime.configDir, 'godpowers-references');
  const workflowsDir = path.join(runtime.configDir, 'godpowers-workflows');
  const schemaDir = path.join(runtime.configDir, 'godpowers-schema');
  const routingDir = path.join(runtime.configDir, 'godpowers-routing');
  const runtimeBundleDir = path.join(runtime.configDir, 'godpowers-runtime');
  const versionFile = path.join(runtime.configDir, 'GODPOWERS_VERSION');

  let removed = 0;

  // Remove all god-* skills
  if (fs.existsSync(skillsDir)) {
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (removeSkillEntry(skillsDir, entry)) {
        removed++;
      }
    }
    success(`Removed ${removed} god-* skill(s)`);
  }

  // Remove all god-* agents
  let agentsRemoved = 0;
  if (fs.existsSync(agentsDir)) {
    for (const file of fs.readdirSync(agentsDir)) {
      if (file.startsWith('god-')) {
        fs.unlinkSync(path.join(agentsDir, file));
        agentsRemoved++;
      }
    }
    success(`Removed ${agentsRemoved} god-* agent(s)`);
  }

  // Remove installed data and runtime directories
  for (const dir of [
    templatesDir,
    referencesDir,
    workflowsDir,
    schemaDir,
    routingDir,
    runtimeBundleDir
  ]) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      success(`Removed ${path.basename(dir)}/`);
    }
  }

  // Remove hooks (Claude Code only)
  if (runtimeKey === 'claude') {
    const hooksDir = path.join(runtime.configDir, 'hooks');
    for (const hook of ['session-start.sh', 'pre-tool-use.sh']) {
      const hookPath = path.join(hooksDir, hook);
      if (fs.existsSync(hookPath)) {
        fs.unlinkSync(hookPath);
        success(`Removed hooks/${hook}`);
      }
    }
  }

  if (fs.existsSync(versionFile)) {
    fs.unlinkSync(versionFile);
  }

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

  // Detect non-interactive and default to Claude Code.
  if (opts.runtimes.length === 0 && !opts.all) {
    if (!process.stdin.isTTY) {
      warn('Non-interactive terminal detected, defaulting to Claude Code install');
      opts.runtimes = ['claude'];
      if (!opts.local) opts.global = true;
    } else {
      // Interactive mode: default to claude
      opts.runtimes = ['claude'];
      if (!opts.local) opts.global = true;
    }
  }

  if (opts.all) {
    opts.runtimes = Object.keys(RUNTIMES);
  }

  // Handle uninstall
  if (opts.uninstall) {
    let removed = 0;
    for (const runtime of opts.runtimes) {
      if (uninstallForRuntime(runtime, opts)) {
        removed++;
      }
    }
    log('');
    if (removed > 0) {
      log(`\x1b[32mUninstalled\x1b[0m from ${removed} runtime(s).`);
    } else {
      warn('No runtimes uninstalled.');
    }
    log('');
    return;
  }

  let installed = 0;
  for (const runtime of opts.runtimes) {
    if (installForRuntime(runtime, srcDir, opts)) {
      installed++;
    }
  }

  if (installed > 0) {
    // Count slash commands for verification message
    const skillsCount = fs.readdirSync(path.join(srcDir, 'skills')).filter(f => f.endsWith('.md')).length;
    const agentsCount = fs.readdirSync(path.join(srcDir, 'agents')).filter(f => /^god-.*\.md$/.test(f)).length;

    log('');
    log(`\x1b[32mDone!\x1b[0m Installed Godpowers v${VERSION} for ${installed} runtime(s).`);
    log('');
    log(`\x1b[36mInstalled:\x1b[0m`);
    log(`  ${skillsCount} slash commands (try: /god-mode, /god-next, /god-status)`);
    log(`  ${agentsCount} specialist agents`);
    log(`  Templates and references for artifact discipline`);
    log('');
    log(`\x1b[36mNext steps:\x1b[0m`);
    log(`  1. Open your AI coding tool in any project directory`);
    log(`  2. Type: \x1b[36m/god-mode\x1b[0m for the full autonomous project run`);
    log(`     Or:   \x1b[36m/god-next\x1b[0m to see what to run next`);
    log(`     Or:   \x1b[36m/god-init\x1b[0m to start a new project`);
    log('');
    log(`\x1b[36mDocs:\x1b[0m https://github.com/godpowers/godpowers`);
    log('');
  } else {
    error('No runtimes installed. Run with --help for usage.');
    process.exit(1);
  }
}

main();
