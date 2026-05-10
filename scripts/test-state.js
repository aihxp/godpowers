#!/usr/bin/env node
/**
 * Behavioral tests for lib/state.js.
 *
 * The state module is load-bearing: it's the source of truth for tier
 * progress, artifact hashes, and mode storage. Tests assert:
 *   - init produces a shape that conforms to schema/state.v1.json
 *   - read/write round-trips preserve data
 *   - updateSubStep doesn't clobber peer sub-steps
 *   - hashFile is stable for identical content
 *   - detectDrift catches missing artifacts + hash mismatches
 *   - mode fields (added in v0.12 audit) survive round-trip
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const state = require('../lib/state');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  + ${name}`); passed++; }
  catch (e) { console.error(`  x ${name}: ${e.message}`); failed++; }
}

function mkProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-state-test-'));
  fs.mkdirSync(path.join(tmp, '.godpowers'), { recursive: true });
  return tmp;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

console.log('\n  State module behavioral tests\n');

test('init produces a state with $schema, version, project, tiers', () => {
  const tmp = mkProject();
  const s = state.init(tmp, 'demo');
  assert(s.$schema === 'https://godpowers.dev/schema/state.v1.json',
    `unexpected $schema: ${s.$schema}`);
  assert(s.version && /^\d+\.\d+\.\d+$/.test(s.version),
    `bad version: ${s.version}`);
  assert(s.project && s.project.name === 'demo', 'project.name missing');
  assert(s.project.started, 'project.started missing');
  assert(s.tiers && s.tiers['tier-0'], 'tier-0 missing');
});

test('init persists to .godpowers/state.json', () => {
  const tmp = mkProject();
  state.init(tmp, 'demo');
  const f = path.join(tmp, '.godpowers', 'state.json');
  assert(fs.existsSync(f), 'state.json not written');
  const parsed = JSON.parse(fs.readFileSync(f, 'utf8'));
  assert(parsed.project.name === 'demo', 'persisted shape wrong');
});

test('read returns null on uninitialized project', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-state-empty-'));
  const s = state.read(tmp);
  assert(s === null, `expected null, got: ${JSON.stringify(s)}`);
});

test('read round-trips written state', () => {
  const tmp = mkProject();
  const original = state.init(tmp, 'roundtrip');
  const got = state.read(tmp);
  assert(got.project.name === 'roundtrip', 'roundtrip name mismatch');
  assert(got.$schema === original.$schema, 'roundtrip schema mismatch');
});

test('write rejects state without project.name', () => {
  const tmp = mkProject();
  try {
    state.write(tmp, { project: {}, tiers: {} });
    throw new Error('write should have thrown');
  } catch (e) {
    assert(/project\.name/.test(e.message),
      `unexpected error: ${e.message}`);
  }
});

test('updateSubStep updates one sub-step without touching peers', () => {
  const tmp = mkProject();
  state.init(tmp, 'sub');
  state.updateSubStep(tmp, 'tier-1', 'prd', { status: 'done' });
  const s = state.read(tmp);
  assert(s.tiers['tier-1'].prd.status === 'done', 'prd not updated');
  assert(s.tiers['tier-1'].arch.status === 'pending',
    `arch was clobbered: ${s.tiers['tier-1'].arch.status}`);
});

test('updateSubStep throws on unknown tier', () => {
  const tmp = mkProject();
  state.init(tmp, 'badtier');
  try {
    state.updateSubStep(tmp, 'tier-99', 'x', { status: 'done' });
    throw new Error('should have thrown');
  } catch (e) {
    assert(/tier/i.test(e.message), `unexpected error: ${e.message}`);
  }
});

test('hashFile produces sha256: prefix and is stable', () => {
  const tmp = mkProject();
  const f = path.join(tmp, 'test.md');
  fs.writeFileSync(f, 'hello world');
  const h1 = state.hashFile(f);
  const h2 = state.hashFile(f);
  assert(h1 === h2, `hash not stable: ${h1} vs ${h2}`);
  assert(/^sha256:[a-f0-9]{64}$/.test(h1), `bad hash format: ${h1}`);
});

test('hashFile detects content change', () => {
  const tmp = mkProject();
  const f = path.join(tmp, 'test.md');
  fs.writeFileSync(f, 'hello world');
  const h1 = state.hashFile(f);
  fs.writeFileSync(f, 'hello WORLD');
  const h2 = state.hashFile(f);
  assert(h1 !== h2, 'hash did not change');
});

test('detectDrift reports missing artifact', () => {
  const tmp = mkProject();
  state.init(tmp, 'drift');
  state.updateSubStep(tmp, 'tier-1', 'prd', {
    status: 'done',
    artifact: 'prd/PRD.md',
    'artifact-hash': 'sha256:' + 'a'.repeat(64)
  });
  const drift = state.detectDrift(tmp);
  assert(Array.isArray(drift), 'drift should be an array');
  const missing = drift.find(d => d.kind === 'missing');
  assert(missing, `expected missing in drift; got ${JSON.stringify(drift)}`);
});

test('detectDrift reports hash mismatch when file changes', () => {
  const tmp = mkProject();
  state.init(tmp, 'driftmod');
  const f = path.join(tmp, '.godpowers', 'prd', 'PRD.md');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, 'original');
  const originalHash = state.hashFile(f);
  state.updateSubStep(tmp, 'tier-1', 'prd', {
    status: 'done',
    artifact: 'prd/PRD.md',
    'artifact-hash': originalHash
  });
  fs.writeFileSync(f, 'modified');
  const drift = state.detectDrift(tmp);
  const mismatch = drift.find(d => d.kind === 'modified');
  assert(mismatch, `expected modified in drift; got ${JSON.stringify(drift)}`);
});

test('mode + mode-d-suite fields survive round-trip', () => {
  const tmp = mkProject();
  const s = state.init(tmp, 'mode-test');
  s.mode = 'A';
  s['mode-d-suite'] = false;
  s['mode-detected-from'] = ['no-package-json-found'];
  s['mode-announced-as'] = 'greenfield';
  state.write(tmp, s);
  const got = state.read(tmp);
  assert(got.mode === 'A', `mode lost: ${got.mode}`);
  assert(got['mode-d-suite'] === false, `mode-d-suite lost`);
  assert(Array.isArray(got['mode-detected-from']), `detected-from lost`);
  assert(got['mode-announced-as'] === 'greenfield',
    `announced-as lost: ${got['mode-announced-as']}`);
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
