#!/usr/bin/env node
/**
 * Tests for lib/budget.js (the on-off shortcut for /god-budget).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const budget = require('../lib/budget');
const intent = require('../lib/intent');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  + ${name}`); passed++; }
  catch (e) { console.error(`  x ${name}: ${e.message}`); failed++; }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function mkProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-budget-'));
  fs.mkdirSync(path.join(tmp, '.godpowers'), { recursive: true });
  return tmp;
}

function writeBaselineIntent(tmp) {
  fs.writeFileSync(path.join(tmp, '.godpowers', 'intent.yaml'),
    'apiVersion: godpowers/v1\nkind: Project\nmetadata:\n  name: t\nmode: A\nscale: small\n');
}

console.log('\n  Budget on/off shortcut tests\n');

test('defaults returns canonical values', () => {
  const d = budget.defaults();
  assert(d['default-max-tokens'] === 80000, `cap: ${d['default-max-tokens']}`);
  assert(d['model-profile'] === 'standard', `profile: ${d['model-profile']}`);
  assert(d.cache === true, `cache: ${d.cache}`);
  assert(d['cache-ttl-hours'] === 24, `ttl: ${d['cache-ttl-hours']}`);
});

test('read returns null when intent.yaml missing', () => {
  const tmp = mkProject();
  assert(budget.read(tmp) === null);
});

test('read returns empty object when intent.yaml has no budgets', () => {
  const tmp = mkProject();
  writeBaselineIntent(tmp);
  const b = budget.read(tmp);
  assert(b !== null, 'should not be null');
  assert(Object.keys(b).length === 0, `expected empty: ${JSON.stringify(b)}`);
});

test('applyOn writes the recommended defaults', () => {
  const tmp = mkProject();
  writeBaselineIntent(tmp);
  const r = budget.applyOn(tmp);
  assert(r.applied, 'not applied');
  assert(r.budgets.cache === true, 'cache not on');
  const reread = budget.read(tmp);
  assert(reread['default-max-tokens'] === 80000, `cap: ${reread['default-max-tokens']}`);
  assert(reread['model-profile'] === 'standard', `profile: ${reread['model-profile']}`);
  assert(reread.cache === true, `cache: ${reread.cache}`);
  assert(reread['cache-ttl-hours'] === 24, `ttl: ${reread['cache-ttl-hours']}`);
});

test('applyOn is idempotent', () => {
  const tmp = mkProject();
  writeBaselineIntent(tmp);
  budget.applyOn(tmp);
  const before = fs.readFileSync(path.join(tmp, '.godpowers', 'intent.yaml'), 'utf8');
  budget.applyOn(tmp);
  const after = fs.readFileSync(path.join(tmp, '.godpowers', 'intent.yaml'), 'utf8');
  assert(before === after, 'second applyOn should be a no-op');
});

test('applyOn preserves a user-customized cap', () => {
  const tmp = mkProject();
  writeBaselineIntent(tmp);
  budget.set(tmp, { 'default-max-tokens': 50000 });
  budget.applyOn(tmp);
  const b = budget.read(tmp);
  // applyOn should merge defaults onto existing, preserving the higher-priority custom 50000? No, our impl picks user value via `...current` after `...defaults`
  // Confirm spec: applyOn = defaults merged with current, current wins, except cache forced on.
  assert(b['default-max-tokens'] === 50000, `cap should be preserved at 50000, got ${b['default-max-tokens']}`);
  assert(b.cache === true, 'cache forced on');
});

test('applyOff removes the budgets block entirely', () => {
  const tmp = mkProject();
  writeBaselineIntent(tmp);
  budget.applyOn(tmp);
  assert(Object.keys(budget.read(tmp)).length > 0, 'block missing before off');
  const r = budget.applyOff(tmp);
  assert(r.applied, 'not applied');
  assert(r.hadBudgets, 'should have reported hadBudgets');
  const after = budget.read(tmp);
  assert(after !== null && Object.keys(after).length === 0,
    `after off: ${JSON.stringify(after)}`);
});

test('applyOff reports hadBudgets=false on a virgin project', () => {
  const tmp = mkProject();
  writeBaselineIntent(tmp);
  const r = budget.applyOff(tmp);
  assert(r.applied, 'applied');
  assert(r.hadBudgets === false, 'should be false');
});

test('applyOff preserves non-budgets content', () => {
  const tmp = mkProject();
  writeBaselineIntent(tmp);
  budget.applyOn(tmp);
  budget.applyOff(tmp);
  const i = intent.read(tmp);
  assert(i.metadata && i.metadata.name === 't', 'lost metadata');
  assert(i.mode === 'A', `lost mode: ${i.mode}`);
  assert(i.scale === 'small', `lost scale: ${i.scale}`);
});

test('set merges per-agent overrides under agents key', () => {
  const tmp = mkProject();
  writeBaselineIntent(tmp);
  budget.applyOn(tmp);
  budget.set(tmp, { agents: { 'god-pm': { 'max-tokens': 120000 } } });
  const b = budget.read(tmp);
  assert(b.agents && b.agents['god-pm'], `agents missing: ${JSON.stringify(b.agents)}`);
  assert(b.agents['god-pm']['max-tokens'] === 120000,
    `max-tokens: ${b.agents['god-pm']['max-tokens']}`);
});

test('summary handles empty / unconfigured state', () => {
  const s = budget.summary({});
  assert(/not configured/i.test(s), `summary: ${s}`);
  assert(/--on/.test(s), 'should mention --on');
});

test('summary renders set values', () => {
  const s = budget.summary({
    'default-max-tokens': 80000,
    'model-profile': 'cheap',
    cache: true,
    'cache-ttl-hours': 12
  });
  assert(/80000/.test(s), `cap missing: ${s}`);
  assert(/cheap/.test(s), 'profile missing');
  assert(/on/.test(s), 'cache state missing');
  assert(/12 hours/.test(s), 'ttl missing');
});

test('writeBlock bootstraps intent.yaml when missing', () => {
  const tmp = mkProject();
  // No baseline intent.yaml
  budget.applyOn(tmp);
  const i = intent.read(tmp);
  assert(i !== null, 'intent not bootstrapped');
  assert(i.apiVersion === 'godpowers/v1', `apiVersion: ${i.apiVersion}`);
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
