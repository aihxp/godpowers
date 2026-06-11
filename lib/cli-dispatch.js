/**
 * Installer CLI command dispatch.
 */

const gate = require('./gate');
const identity = require('./package-identity');
const stateAdvance = require('./state-advance');

const VERSION = identity.PACKAGE_VERSION;

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

function runAutomationCommand(opts) {
  const automation = require('./automation-providers');
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
  const dashboard = require('./dashboard');
  const result = dashboard.compute(opts.project);
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(dashboard.render(result, { brief: opts.brief || !opts.full }));
  if (opts.command === 'next') {
    console.log('');
    console.log('Suggested next command:');
    console.log(`  ${result.next && result.next.command ? result.next.command : 'describe the next intent'}`);
  }
}

function runDogfoodCommand(opts) {
  const dogfood = require('./dogfood-runner');
  const result = dogfood.runAll();
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(dogfood.render(result));
  }
  if (result.status !== 'pass') process.exit(1);
}

function runDemoCommand(opts) {
  return runQuickProofCommand({ ...opts, brief: opts.full ? false : true });
}

function runQuickProofCommand(opts) {
  const quickProof = require('./quick-proof');
  const result = quickProof.compute(opts.project);
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(quickProof.render(result, { brief: opts.brief }));
  }
}

function runSurfaceCommand(opts) {
  const path = require('path');
  const surfaceProfile = require('./surface-profile');
  const srcDir = path.resolve(__dirname, '..');
  let applied = [];

  if (opts.apply) {
    if (opts.json) {
      const originalLog = console.log;
      const originalError = console.error;
      console.log = () => {};
      console.error = () => {};
      try {
        applied = surfaceProfile.apply(srcDir, opts);
      } finally {
        console.log = originalLog;
        console.error = originalError;
      }
    } else {
      applied = surfaceProfile.apply(srcDir, opts);
    }
  }

  const result = surfaceProfile.plan(srcDir, opts);
  if (opts.json) {
    console.log(JSON.stringify({ ...result, applied }, null, 2));
  } else {
    console.log(surfaceProfile.render(result));
  }
}

function runMcpInfoCommand(opts) {
  const mcpInfo = require('./mcp-info');
  const result = mcpInfo.info(opts.project);
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(mcpInfo.render(result));
  }
}

function runExtensionScaffoldCommand(opts) {
  const authoring = require('./extension-authoring');
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

function runGateCommand(opts) {
  if (!opts.tier) {
    const result = {
      tier: null,
      verdict: 'fail',
      artifacts: [],
      checks: [{ id: 'tier-required', status: 'fail', artifact: null, reason: 'gate requires --tier=<name>' }],
      findings: [{ id: 'tier-required', severity: 'error', artifact: null, reason: 'gate requires --tier=<name>' }],
      summary: { errors: 1, warnings: 0, infos: 0, missing: 0, checkedArtifacts: 0 }
    };
    if (opts.json) console.log(JSON.stringify(result, null, 2));
    else console.log(gate.render(result));
    process.exitCode = 1;
    return;
  }

  const result = gate.check({ tier: opts.tier, projectRoot: opts.project });
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(gate.render(result));
  }
  if (gate.exitCode(result) !== 0) {
    process.exitCode = 1;
  }
}

function runStateCommand(opts) {
  if (opts.stateAction !== 'advance') {
    const result = {
      command: 'state',
      verdict: 'fail',
      project: opts.project,
      step: opts.step || null,
      status: opts.status || null,
      previousStatus: null,
      updated: null,
      warnings: [],
      checks: [{ id: 'state-action-required', status: 'fail', artifact: '.godpowers/state.json', reason: 'state requires subcommand advance' }],
      findings: [{ id: 'state-action-required', severity: 'error', artifact: '.godpowers/state.json', reason: 'state requires subcommand advance' }],
      summary: { updated: false, state: '.godpowers/state.json', views: ['.godpowers/PROGRESS.md'] }
    };
    if (opts.json) console.log(JSON.stringify(result, null, 2));
    else console.log(stateAdvance.render(result));
    process.exitCode = 1;
    return;
  }

  const result = stateAdvance.advance(opts.project, {
    step: opts.step,
    status: opts.status
  });
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(stateAdvance.render(result));
  }
  if (stateAdvance.exitCode(result) !== 0) {
    process.exitCode = 1;
  }
}

const COMMAND_RUNNERS = {
  status: runDashboardCommand,
  next: runDashboardCommand,
  state: runStateCommand,
  'quick-proof': runQuickProofCommand,
  'mcp-info': runMcpInfoCommand,
  'automation-status': runAutomationCommand,
  'automation-setup': runAutomationCommand,
  dogfood: runDogfoodCommand,
  demo: runDemoCommand,
  surface: runSurfaceCommand,
  'extension-scaffold': runExtensionScaffoldCommand,
  gate: runGateCommand
};

function runCommand(opts) {
  const runner = COMMAND_RUNNERS[opts.command];
  if (runner) {
    runner(opts);
    return true;
  }
  return false;
}

module.exports = {
  COMMAND_RUNNERS,
  runCommand,
  runAutomationCommand,
  runDashboardCommand,
  runDogfoodCommand,
  runDemoCommand,
  runQuickProofCommand,
  runSurfaceCommand,
  runMcpInfoCommand,
  runExtensionScaffoldCommand,
  runGateCommand,
  runStateCommand
};
