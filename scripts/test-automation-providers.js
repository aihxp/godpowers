#!/usr/bin/env node
/**
 * Behavioral tests for lib/automation-providers.js.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const automation = require('../lib/automation-providers');
const dashboard = require('../lib/dashboard');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  + ${name}`);
    passed++;
  } catch (e) {
    console.error(`  x ${name}: ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function mkProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-automation-test-'));
  fs.mkdirSync(path.join(tmp, '.godpowers'), { recursive: true });
  return tmp;
}

function mkHomeWithRuntime(runtime) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-automation-home-'));
  fs.mkdirSync(path.join(home, `.${runtime}`), { recursive: true });
  fs.writeFileSync(path.join(home, `.${runtime}`, 'GODPOWERS_VERSION'), 'test');
  return home;
}

console.log('\n  Automation provider behavioral tests\n');

test('detect returns safe templates and providers', () => {
  const tmp = mkProject();
  const result = automation.detect(tmp, {
    home: fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-empty-home-')),
    commands: {},
    gitRemote: false
  });
  assert(result.providers.length >= 10, `providers: ${result.providers.length}`);
  assert(result.safeTemplates.some(template => template.id === 'daily-status'), 'missing daily status');
  assert(result.recommendedProvider === null, 'unexpected provider recommendation');
});

test('detect recommends installed native scheduler before scriptable providers', () => {
  const tmp = mkProject();
  const home = mkHomeWithRuntime('cline');
  const result = automation.detect(tmp, {
    home,
    commands: { gemini: true },
    gitRemote: true
  });
  assert(result.recommendedProvider.id === 'cline-schedule',
    `recommended: ${result.recommendedProvider && result.recommendedProvider.id}`);
});

test('readConfig marks active templates', () => {
  const tmp = mkProject();
  fs.writeFileSync(path.join(tmp, '.godpowers', 'automations.json'), JSON.stringify({
    automations: [
      { id: 'daily-status', provider: 'codex-app', status: 'active' }
    ]
  }));
  const result = automation.detect(tmp, {
    home: mkHomeWithRuntime('codex'),
    commands: {},
    gitRemote: false
  });
  assert(result.active.length === 1, `active: ${result.active.length}`);
  assert(result.safeTemplates.find(template => template.id === 'daily-status').active,
    'daily status should be active');
});

test('renderSetupPlan is opt-in and names approval requirement', () => {
  const tmp = mkProject();
  const plan = automation.setupPlan(tmp, {
    home: mkHomeWithRuntime('claude'),
    commands: {},
    gitRemote: false
  });
  const rendered = automation.renderSetupPlan(plan);
  assert(rendered.includes('Approval required:'), rendered);
  assert(rendered.includes('Claude Code routines'), rendered);
  assert(rendered.includes('Do not publish') || rendered.includes('report release readiness'), rendered);
});

test('setupPlan exposes host tool execution for simple Codex setup', () => {
  const tmp = mkProject();
  const plan = automation.setupPlan(tmp, {
    home: mkHomeWithRuntime('codex'),
    commands: {},
    gitRemote: false
  });
  assert(plan.execution.method === 'host-tool-calling', `method: ${plan.execution.method}`);
  assert(plan.execution.hostTool === 'codex_app.automation_update', `hostTool: ${plan.execution.hostTool}`);
  assert(plan.execution.directHostToolCalling === true, 'expected direct host tool calling');
  assert(plan.execution.specialistAgent === null, `agent: ${plan.execution.specialistAgent}`);
});

test('setupPlan routes complex setup to god-automation-engineer', () => {
  const tmp = mkProject();
  const plan = automation.setupPlan(tmp, {
    home: mkHomeWithRuntime('codex'),
    commands: {},
    gitRemote: false,
    templates: ['daily-status', 'review-queue']
  });
  assert(plan.execution.specialistAgent === 'god-automation-engineer',
    `agent: ${plan.execution.specialistAgent}`);
  assert(plan.execution.directHostToolCalling === false, 'complex setup should not be direct');
});

test('recordAutomation requires confirmed host success', () => {
  const tmp = mkProject();
  const record = automation.buildAutomationRecord('codex-app', 'daily-status', {
    createdAt: '2026-05-16T00:00:00.000Z'
  });
  let threw = false;
  try {
    automation.recordAutomation(tmp, record);
  } catch (e) {
    threw = /confirmedHostSuccess/.test(e.message);
  }
  assert(threw, 'recordAutomation should require confirmedHostSuccess');
  const written = automation.recordAutomation(tmp, record, { confirmedHostSuccess: true });
  assert(written.automations.length === 1, `automations: ${written.automations.length}`);
  const parsed = JSON.parse(fs.readFileSync(path.join(tmp, '.godpowers', 'automations.json'), 'utf8'));
  assert(parsed.automations[0].id === 'daily-status', 'record not written');
});

test('dashboard includes automation proactive status', () => {
  const tmp = mkProject();
  const summary = dashboard.automationSummary(tmp);
  assert(typeof summary === 'string' && summary.length > 0, `summary: ${summary}`);
});

test('CLI automation-status emits JSON provider report', () => {
  const tmp = mkProject();
  const out = cp.execFileSync(process.execPath,
    [path.join(__dirname, '..', 'bin', 'install.js'), 'automation-status', '--project', tmp, '--json'],
    { encoding: 'utf8' });
  const parsed = JSON.parse(out);
  assert(Array.isArray(parsed.providers), 'providers should be an array');
  assert(Array.isArray(parsed.safeTemplates), 'safeTemplates should be an array');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
