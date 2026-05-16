#!/usr/bin/env node
/**
 * Behavioral tests for lib/state-lock.js (advisory locking).
 *
 * The concurrency contract:
 *   - acquire writes lock to state.json
 *   - release sets it to null
 *   - reentrant: same holder can re-acquire and refresh expires
 *   - conflict: different holder, overlapping scope, not stale -> reject
 *   - stale: silently reclaimed on acquire
 *   - scopesConflict: 'all' conflicts with everything; same scope conflicts
 *   - withLock: convenience wrapper acquires, runs, releases
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const state = require('../lib/state');
const lock = require('../lib/state-lock');

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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-lock-test-'));
  fs.mkdirSync(path.join(tmp, '.godpowers'), { recursive: true });
  state.init(tmp, 'lock-test');
  return tmp;
}

console.log('\n  State lock behavioral tests\n');

test('acquire on a fresh project succeeds', () => {
  const tmp = mkProject();
  const r = lock.acquire(tmp, { holder: 'alice', scope: 'all' });
  assert(r.acquired, `not acquired: ${JSON.stringify(r)}`);
  assert(r.lock.holder === 'alice', `holder: ${r.lock.holder}`);
  assert(r.lock.scope === 'all', `scope: ${r.lock.scope}`);
});

test('acquire writes lock to state.json', () => {
  const tmp = mkProject();
  lock.acquire(tmp, { holder: 'alice' });
  const peeked = lock.peek(tmp);
  assert(peeked && peeked.holder === 'alice',
    `peek wrong: ${JSON.stringify(peeked)}`);
});

test('reentrant acquire by same holder refreshes expires', () => {
  const tmp = mkProject();
  const a = lock.acquire(tmp, { holder: 'alice', ttlMs: 60_000 });
  const r = lock.acquire(tmp, { holder: 'alice', ttlMs: 120_000 });
  assert(r.acquired, 'reentrant acquire rejected');
  assert(r.reentrant, 'reentrant flag not set');
  assert(r.lock.expires !== a.lock.expires,
    'expires should have refreshed');
});

test('acquire by different holder on same scope conflicts', () => {
  const tmp = mkProject();
  lock.acquire(tmp, { holder: 'alice', scope: 'all' });
  const r = lock.acquire(tmp, { holder: 'bob', scope: 'all' });
  assert(!r.acquired, 'should have rejected');
  assert(r.reason === 'held', `reason: ${r.reason}`);
  assert(r.holder === 'alice', `holder: ${r.holder}`);
});

test('release by holder clears the lock', () => {
  const tmp = mkProject();
  lock.acquire(tmp, { holder: 'alice' });
  const r = lock.release(tmp, 'alice');
  assert(r.released, 'should have released');
  assert(lock.peek(tmp) === null, 'lock not cleared');
});

test('release by wrong holder rejects', () => {
  const tmp = mkProject();
  lock.acquire(tmp, { holder: 'alice' });
  const r = lock.release(tmp, 'bob');
  assert(!r.released, 'should have rejected');
  assert(r.reason === 'wrong-holder', `reason: ${r.reason}`);
});

test('release with no lock returns no-lock', () => {
  const tmp = mkProject();
  const r = lock.release(tmp, 'alice');
  assert(!r.released, 'should be false');
  assert(r.reason === 'no-lock', `reason: ${r.reason}`);
});

test('isStale true on past expires', () => {
  const past = { expires: new Date(Date.now() - 1000).toISOString() };
  assert(lock.isStale(past), 'should be stale');
});

test('isStale false on future expires', () => {
  const future = { expires: new Date(Date.now() + 1000).toISOString() };
  assert(!lock.isStale(future), 'should not be stale');
});

test('isStale true on null lock', () => {
  assert(lock.isStale(null), 'null should be stale');
});

test('acquire silently reclaims a stale lock', () => {
  const tmp = mkProject();
  // Inject a stale lock manually
  const s = state.read(tmp);
  s.lock = {
    holder: 'ghost',
    acquired: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expires: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    scope: 'all'
  };
  state.write(tmp, s);
  const r = lock.acquire(tmp, { holder: 'alice' });
  assert(r.acquired, 'should have acquired');
  assert(r.reclaimed, 'reclaimed flag missing');
  assert(r.reclaimedFrom === 'ghost', `reclaimedFrom: ${r.reclaimedFrom}`);
});

test('scopesConflict rules', () => {
  assert(lock.scopesConflict('all', 'tier-1.prd'), 'all should conflict');
  assert(lock.scopesConflict('tier-1.prd', 'all'), 'all should conflict (rev)');
  assert(lock.scopesConflict('tier-1.prd', 'tier-1.prd'), 'same should conflict');
  assert(!lock.scopesConflict('tier-1.prd', 'tier-2.arch'),
    'different tiers should not conflict');
});

test('force overrides an active lock', () => {
  const tmp = mkProject();
  lock.acquire(tmp, { holder: 'alice' });
  const r = lock.acquire(tmp, { holder: 'bob', force: true });
  assert(r.acquired, 'force should have succeeded');
  assert(r.lock.holder === 'bob', `holder: ${r.lock.holder}`);
});

test('reclaim returns reclaimed=false when lock is fresh', () => {
  const tmp = mkProject();
  lock.acquire(tmp, { holder: 'alice' });
  const r = lock.reclaim(tmp, 'bob');
  assert(!r.reclaimed, 'should not reclaim fresh');
  assert(r.reason === 'lock-not-stale', `reason: ${r.reason}`);
});

test('reclaim succeeds on stale lock', () => {
  const tmp = mkProject();
  const s = state.read(tmp);
  s.lock = {
    holder: 'ghost',
    acquired: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expires: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    scope: 'all'
  };
  state.write(tmp, s);
  const r = lock.reclaim(tmp, 'janitor');
  assert(r.reclaimed, 'should reclaim');
  assert(r.previousHolder === 'ghost', `previousHolder: ${r.previousHolder}`);
});

test('withLock acquires, runs callback, releases', async () => {
  const tmp = mkProject();
  let ran = false;
  const result = await lock.withLock(tmp, { holder: 'alice' }, async () => {
    ran = true;
    assert(lock.peek(tmp).holder === 'alice', 'lock not held during callback');
    return 42;
  });
  assert(ran, 'callback did not run');
  assert(result === 42, `wrong result: ${result}`);
  assert(lock.peek(tmp) === null, 'lock not released after withLock');
});

test('withLock releases even if callback throws', async () => {
  const tmp = mkProject();
  let threw = false;
  try {
    await lock.withLock(tmp, { holder: 'alice' }, async () => {
      throw new Error('boom');
    });
  } catch (e) {
    threw = true;
  }
  assert(threw, 'should have thrown');
  assert(lock.peek(tmp) === null, 'lock not released after error');
});

test('withLock throws LOCK_UNAVAILABLE on conflict', async () => {
  const tmp = mkProject();
  lock.acquire(tmp, { holder: 'alice' });
  let caught = null;
  try {
    await lock.withLock(tmp, { holder: 'bob' }, async () => 'ok');
  } catch (e) {
    caught = e;
  }
  assert(caught, 'should have thrown');
  assert(caught.code === 'LOCK_UNAVAILABLE', `code: ${caught.code}`);
});

// Checkpoint syncFromState

const checkpoint = require('../lib/checkpoint');
const events = require('../lib/events');

console.log('\n  Checkpoint syncFromState tests\n');

test('syncFromState produces CHECKPOINT.md from disk state', () => {
  const tmp = mkProject();
  state.updateSubStep(tmp, 'tier-0', 'orchestration', {
    status: 'done',
    updated: new Date().toISOString()
  });
  state.updateSubStep(tmp, 'tier-1', 'prd', {
    status: 'done',
    updated: new Date().toISOString()
  });
  const h = events.startRun(tmp);
  h.emit({ span_id: 's1', name: 'agent.end',
           attrs: { tier: 'tier-1', agent: 'god-pm' } });
  const file = checkpoint.syncFromState(tmp, {
    nextCommand: '/god-arch',
    nextReason: 'PRD is done'
  });
  assert(fs.existsSync(file), 'CHECKPOINT.md not written');
  const cp = checkpoint.read(tmp);
  assert(cp.frontmatter.project === 'lock-test', `project: ${cp.frontmatter.project}`);
  assert(cp.actions.length > 0, 'no actions captured from events');
  assert(/\/god-arch/.test(cp.body), 'next command not in body');
  assert(String(cp.frontmatter['progress-total']) === '13',
    `progress-total: ${cp.frontmatter['progress-total']}`);
  assert(/Progress:/.test(cp.body), 'progress line missing');
  assert(cp.frontmatter['current-substep'] === 'arch',
    `current-substep: ${cp.frontmatter['current-substep']}`);
});

test('syncFromState preserves prior facts', () => {
  const tmp = mkProject();
  checkpoint.recordFact(tmp, 'decided on Postgres');
  state.updateSubStep(tmp, 'tier-1', 'prd', { status: 'done' });
  checkpoint.syncFromState(tmp, {});
  const cp = checkpoint.read(tmp);
  assert(cp.facts.some(f => /Postgres/.test(f)),
    `Postgres fact lost: ${JSON.stringify(cp.facts)}`);
});

test('syncFromState prepends extraFacts', () => {
  const tmp = mkProject();
  state.updateSubStep(tmp, 'tier-1', 'prd', { status: 'done' });
  checkpoint.syncFromState(tmp, { extraFacts: ['new fact'] });
  const cp = checkpoint.read(tmp);
  assert(cp.facts[0] === 'new fact', `first fact: ${cp.facts[0]}`);
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
