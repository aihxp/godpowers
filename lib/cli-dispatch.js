/**
 * Installer CLI command dispatch.
 */

const gate = require('./gate');
const identity = require('./package-identity');

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

  console.log(dashboard.render(result, { brief: opts.brief }));
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

function runQuickProofCommand(opts) {
  const quickProof = require('./quick-proof');
  const result = quickProof.compute(opts.project);
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(quickProof.render(result, { brief: opts.brief }));
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

const COMMAND_RUNNERS = {
  status: runDashboardCommand,
  next: runDashboardCommand,
  'quick-proof': runQuickProofCommand,
  'mcp-info': runMcpInfoCommand,
  'automation-status': runAutomationCommand,
  'automation-setup': runAutomationCommand,
  dogfood: runDogfoodCommand,
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
  runQuickProofCommand,
  runMcpInfoCommand,
  runExtensionScaffoldCommand,
  runGateCommand
};
