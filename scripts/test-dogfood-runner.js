#!/usr/bin/env node
/**
 * Behavioral tests for lib/dogfood-runner.js.
 */

const assert = require('assert');
const dogfood = require('../lib/dogfood-runner');

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

console.log('\n  Dogfood runner behavioral tests\n');

test('lists built-in messy-repo scenarios', () => {
  const scenarios = dogfood.listScenarios();
  const ids = scenarios.map((scenario) => scenario.id);
  assert(ids.includes('half-migrated-gsd'));
  assert(ids.includes('host-degraded'));
  assert(ids.includes('host-full'));
  assert(ids.includes('extension-authoring'));
  assert(ids.includes('suite-release-dry-run'));
});

test('runs all built-in scenarios successfully', () => {
  const report = dogfood.runAll();
  assert.equal(report.status, 'pass');
  assert.equal(report.failed, 0);
  assert(report.total >= 5);
});

test('renders a compact dogfood report', () => {
  const rendered = dogfood.render(dogfood.runAll());
  assert(rendered.includes('Godpowers Dogfood Report'));
  assert(rendered.includes('Status: pass'));
  assert(!/[\u2013\u2014]/.test(rendered), 'render contains banned dash');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
