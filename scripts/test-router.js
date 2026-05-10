#!/usr/bin/env node
/**
 * Tests for lib/router.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const router = require('../lib/router');
const state = require('../lib/state');

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

console.log('\n  Router tests\n');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-router-test-'));

test('loadAll returns at least 30 routing definitions', () => {
  router.clearCache();
  const all = router.loadAll();
  const count = Object.keys(all).length;
  if (count < 30) throw new Error(`expected 30+, got ${count}`);
});

test('getRouting finds /god-prd', () => {
  router.clearCache();
  const r = router.getRouting('/god-prd');
  if (!r) throw new Error('not found');
  if (r.metadata.command !== '/god-prd') throw new Error('wrong command');
});

test('getRouting finds /god-mode', () => {
  router.clearCache();
  const r = router.getRouting('/god-mode');
  if (!r) throw new Error('not found');
});

test('getRouting returns null for unknown command', () => {
  router.clearCache();
  const r = router.getRouting('/god-nonexistent');
  if (r !== null) throw new Error('should be null');
});

test('getNextCommand returns next for /god-prd', () => {
  router.clearCache();
  const next = router.getNextCommand('/god-prd');
  if (next !== '/god-arch') throw new Error(`expected /god-arch, got ${next}`);
});

test('getStandards returns checks for /god-prd', () => {
  router.clearCache();
  const s = router.getStandards('/god-prd');
  if (!s) throw new Error('no standards');
  if (s['substitution-test'] !== true) throw new Error('substitution-test should be true');
  if (!s['have-nots']) throw new Error('no have-nots');
});

test('getSpawnedAgents includes primary for /god-prd', () => {
  router.clearCache();
  const agents = router.getSpawnedAgents('/god-prd');
  if (!agents.includes('god-pm')) throw new Error('should include god-pm');
});

test('getSpawnedAgents includes secondary spawns for /god-build', () => {
  router.clearCache();
  const agents = router.getSpawnedAgents('/god-build');
  if (!agents.includes('god-planner')) throw new Error('should include god-planner');
  if (!agents.includes('god-executor')) throw new Error('should include god-executor');
});

test('checkPrerequisites: /god-init has no prereqs', () => {
  router.clearCache();
  const result = router.checkPrerequisites('/god-init', tmp);
  if (!result.satisfied) throw new Error('should be satisfied');
});

test('checkPrerequisites: /god-prd needs PROGRESS.md', () => {
  router.clearCache();
  // tmp has no .godpowers/, so prereq fails
  const result = router.checkPrerequisites('/god-prd', tmp);
  if (result.satisfied) throw new Error('should not be satisfied');
  if (result.missing.length === 0) throw new Error('should have missing');
  if (result.autoCompletable.length === 0) throw new Error('should have auto-completable');
  if (result.autoCompletable[0].autoCompleteCommand !== '/god-init') {
    throw new Error('auto-complete should be /god-init');
  }
});

test('suggestNext: empty project suggests /god-init', () => {
  router.clearCache();
  const s = router.suggestNext(tmp);
  if (s.command !== '/god-init') throw new Error(`expected /god-init, got ${s.command}`);
});

test('suggestNext: with PRD pending, suggests /god-prd', () => {
  router.clearCache();
  state.init(tmp, 'router-test');
  const s = router.suggestNext(tmp);
  if (s.command !== '/god-prd') throw new Error(`expected /god-prd, got ${s.command}`);
});

test('suggestNext: with PRD done, suggests /god-arch', () => {
  router.clearCache();
  state.updateSubStep(tmp, 'tier-1', 'prd', { status: 'done' });
  const s = router.suggestNext(tmp);
  if (s.command !== '/god-arch') throw new Error(`expected /god-arch, got ${s.command}`);
});

test('evaluateCheck: file:path returns false for missing', () => {
  router.clearCache();
  if (router.evaluateCheck('file:nonexistent.txt', tmp) !== false) {
    throw new Error('should be false');
  }
});

test('evaluateCheck: state:tier-1.prd.status == done', () => {
  router.clearCache();
  // PRD was set to done in earlier test
  if (router.evaluateCheck('state:tier-1.prd.status == done', tmp) !== true) {
    throw new Error('should be true');
  }
});

test('routing files all have apiVersion: godpowers/v1', () => {
  router.clearCache();
  const all = router.loadAll();
  for (const [cmd, r] of Object.entries(all)) {
    if (r.apiVersion !== 'godpowers/v1') {
      throw new Error(`${cmd} has wrong apiVersion: ${r.apiVersion}`);
    }
  }
});

test('routing files all have execution.spawns', () => {
  router.clearCache();
  const all = router.loadAll();
  for (const [cmd, r] of Object.entries(all)) {
    if (!r.execution || !r.execution.spawns) {
      throw new Error(`${cmd} missing execution.spawns`);
    }
  }
});

// Cleanup
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
