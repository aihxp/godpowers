#!/usr/bin/env node

/**
 * Godpowers installer and local CLI helpers.
 *
 * The executable stays intentionally thin. Runtime definitions, argument
 * parsing, and install/uninstall file operations live in lib/ so they can be
 * tested and reused without shelling through the binary.
 */

const path = require('path');

const { parseArgs } = require('../lib/installer-args');
const { RUNTIMES, runtimeKeys } = require('../lib/installer-runtimes');
const {
  installForRuntime,
  uninstallForRuntime,
  countInstalledSurface
} = require('../lib/installer-core');

const VERSION = require('../package.json').version;

const BANNER = `
  GODPOWERS v${VERSION}
  Ship fast. Ship right. Ship everything.
`;

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

function showHelp() {
  console.log(BANNER);
  log('Usage: npx godpowers [command] [options]\n');
  log('Commands:');
  log('  status               Show the Godpowers Dashboard for a project');
  log('  next                 Show the dashboard and recommended next command');
  log('  quick-proof          Show a runnable proof from the shipped fixture');
  log('  automation-status    Show host automation provider support');
  log('  automation-setup     Show an opt-in automation setup plan');
  log('  dogfood              Run built-in messy-repo dogfood scenarios');
  log('  extension-scaffold   Create a publishable extension pack skeleton');
  log('');
  log('Options:');
  log('  --project=<path>     Project root for status, next, proof, or automation commands');
  log('  --json               Emit JSON for status, next, proof, or automation commands');
  log('  --brief              Render compact output for status, next, or proof');
  log('  --name=<scope/name>  Extension package name for extension-scaffold');
  log('  --output=<path>      Extension output root for extension-scaffold');
  log('  --skill=<name>       Extension skill name for extension-scaffold');
  log('  --agent=<name>       Extension agent name for extension-scaffold');
  log('  --workflow=<name>    Extension workflow name for extension-scaffold');
  log('  -g, --global         Install globally to the config directory');
  log('  -l, --local          Install locally to the current directory');
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
  log('  npx godpowers status --project=.');
  log('  npx godpowers next --project=.');
  log('  npx godpowers quick-proof --project=.');
  log('  npx godpowers automation-status --project=.');
  log('  npx godpowers automation-setup --project=.');
  log('  npx godpowers dogfood');
  log('  npx godpowers extension-scaffold --name=@godpowers/my-pack --output=.');
  log('  npx godpowers --claude --global');
  log('  npx godpowers --all');
  log('  npx godpowers --codex --cursor');
}

function runAutomationCommand(opts) {
  const automation = require('../lib/automation-providers');
  const result = opts.command === 'automation-setup'
    ? automation.setupPlan(opts.project)
    : automation.detect(opts.project);
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (opts.command === 'automation-setup') {
    console.log(automation.renderSetupPlan(result));
  } else {
    console.log(automation.render(result));
  }
}

function runDashboardCommand(opts) {
  const dashboard = require('../lib/dashboard');
  const result = dashboard.compute(opts.project);
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(dashboard.render(result, { brief: opts.brief }));
  if (opts.command === 'next') {
    console.log('');
    console.log('Suggested next command:');
    console.log(`  ${result.next && result.next.command ? result.next.command : 'describe the next intent'}`);
  }
}

function runDogfoodCommand(opts) {
  const dogfood = require('../lib/dogfood-runner');
  const result = dogfood.runAll();
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(dogfood.render(result));
  }
  if (result.status !== 'pass') process.exit(1);
}

function runQuickProofCommand(opts) {
  const quickProof = require('../lib/quick-proof');
  const result = quickProof.compute(opts.project);
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(quickProof.render(result, { brief: opts.brief }));
  }
}

function runExtensionScaffoldCommand(opts) {
  const authoring = require('../lib/extension-authoring');
  if (!opts.extensionName) {
    error('extension-scaffold requires --name=@scope/package');
    process.exit(1);
  }
  const result = authoring.scaffold(opts.extensionOutput, {
    name: opts.extensionName,
    skill: opts.extensionSkill || undefined,
    agent: opts.extensionAgent || undefined,
    workflow: opts.extensionWorkflow || undefined,
    runtimeVersion: VERSION
  });
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  success(`Scaffolded ${result.name} at ${result.path}`);
  if (result.written.length > 0) {
    log(`Wrote ${result.written.length} file(s): ${result.written.join(', ')}`);
  }
  if (result.validation.length > 0) {
    warn(`Validation warnings: ${result.validation.join('; ')}`);
  } else {
    success('Extension manifest validates');
  }
}

function runCommand(opts) {
  if (opts.command === 'status' || opts.command === 'next') {
    runDashboardCommand(opts);
    return true;
  }
  if (opts.command === 'quick-proof') {
    runQuickProofCommand(opts);
    return true;
  }
  if (opts.command === 'automation-status' || opts.command === 'automation-setup') {
    runAutomationCommand(opts);
    return true;
  }
  if (opts.command === 'dogfood') {
    runDogfoodCommand(opts);
    return true;
  }
  if (opts.command === 'extension-scaffold') {
    runExtensionScaffoldCommand(opts);
    return true;
  }
  return false;
}

function applyDefaultRuntimeSelection(opts) {
  if (opts.runtimes.length > 0 || opts.all) return;
  if (!process.stdin.isTTY) {
    // Refuse to perform a silent global install when there is no human to
    // confirm and no explicit target was given (CI, piped, some npx contexts).
    warn('No runtime selected and stdin is not a TTY.');
    warn('Refusing a silent global install. Re-run with an explicit target,');
    warn('for example:  npx godpowers --claude --global   (or --all).');
    process.exit(1);
  }
  opts.runtimes = ['claude'];
  if (!opts.local) opts.global = true;
}

function runUninstall(opts) {
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
}

function runInstall(opts, srcDir) {
  let installed = 0;
  for (const runtime of opts.runtimes) {
    if (installForRuntime(runtime, srcDir, opts)) {
      installed++;
    }
  }

  if (installed === 0) {
    error('No runtimes installed. Run with --help for usage.');
    process.exit(1);
  }

  const surface = countInstalledSurface(srcDir);
  log('');
  log(`\x1b[32mDone!\x1b[0m Installed Godpowers v${VERSION} for ${installed} runtime(s).`);
  log('');
  log(`\x1b[36mInstalled:\x1b[0m`);
  log(`  ${surface.skills} slash commands (try: /god-mode, /god-next, /god-status)`);
  log(`  ${surface.agents} specialist agents`);
  log('  Templates and references for artifact discipline');
  log('');
  log(`\x1b[36mNext steps:\x1b[0m`);
  log('  1. Open your AI coding tool in any project directory');
  log(`  2. Type: \x1b[36m/god-mode\x1b[0m for the full autonomous project run`);
  log(`     Or:   \x1b[36m/god-next\x1b[0m to see what to run next`);
  log(`     Or:   \x1b[36m/god-init\x1b[0m to start a new project`);
  log('');
  log(`\x1b[36mDocs:\x1b[0m https://github.com/godpowers/godpowers`);
  log('');
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    showHelp();
    process.exit(0);
  }

  if (runCommand(opts)) return;

  console.log(BANNER);
  const srcDir = path.resolve(__dirname, '..');

  applyDefaultRuntimeSelection(opts);
  if (opts.all) {
    opts.runtimes = runtimeKeys();
  }

  if (opts.uninstall) {
    runUninstall(opts);
  } else {
    runInstall(opts, srcDir);
  }
}

main();

module.exports = {
  showHelp,
  runCommand,
  applyDefaultRuntimeSelection,
  runInstall,
  runUninstall,
  RUNTIMES
};
