#!/usr/bin/env node
/**
 * Behavioral tests for lib/checkpoint.js (context-rot protection).
 *
 * The checkpoint module backs /god-locate and /god-context-scan. Its
 * job is to be the disk-authoritative "where you are" pin that any
 * new chat session or new AI tool can read to orient.
 *
 * Tests assert:
 *   - write produces a parseable CHECKPOINT.md with frontmatter + body
 *   - read parses what write produced
 *   - frontmatter holds id, project, mode, lifecycle, current-tier,
 *     current-substep, last-action, last-actor, last-update, facts-hash
 *   - recordAction prepends and trims to MAX_ACTIONS
 *   - recordFact deduplicates and trims to MAX_FACTS
 *   - diff catches drift between an AI's claim and the disk truth
 *   - mode-d-suite roundtrips as boolean
 *   - hash chain in events.jsonl: emit + verifyChain
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const checkpoint = require('../lib/checkpoint');
const events = require('../lib/events');

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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-cp-test-'));
  fs.mkdirSync(path.join(tmp, '.godpowers'), { recursive: true });
  return tmp;
}

console.log('\n  Checkpoint + event-chain tests\n');

test('write creates CHECKPOINT.md with frontmatter and body', () => {
  const tmp = mkProject();
  const file = checkpoint.write(tmp, {
    project: 'test',
    mode: 'A',
    lifecycle: 'in-arc',
    currentTier: 'tier-1',
    currentSubstep: 'prd',
    lastAction: 'init',
    lastActor: 'god-orchestrator',
    actions: ['t1 act', 't2 act'],
    facts: ['fact one', 'fact two'],
    nextCommand: '/god-prd',
    nextReason: 'PRD is pending'
  });
  assert(fs.existsSync(file), 'CHECKPOINT.md not written');
  const raw = fs.readFileSync(file, 'utf8');
  assert(raw.startsWith('---'), 'no frontmatter');
  assert(/^## Where you are/m.test(raw), 'missing Where-you-are');
  assert(/^## Next suggested command/m.test(raw), 'missing Next-suggested');
  assert(/^## Last actions/m.test(raw), 'missing Last-actions');
  assert(/^## Held facts/m.test(raw), 'missing Held-facts');
});

test('read parses what write produced', () => {
  const tmp = mkProject();
  checkpoint.write(tmp, {
    project: 'parse',
    mode: 'B',
    lifecycle: 'in-arc',
    currentTier: 'tier-1',
    currentSubstep: 'arch',
    lastAction: 'wrote-arch',
    lastActor: 'god-architect',
    actions: ['arch written'],
    facts: ['decided on AWS']
  });
  const got = checkpoint.read(tmp);
  assert(got, 'read returned null');
  assert(got.frontmatter.project === 'parse', `project: ${got.frontmatter.project}`);
  assert(got.frontmatter.mode === 'B', `mode: ${got.frontmatter.mode}`);
  assert(got.actions.length === 1, `actions: ${got.actions.length}`);
  assert(got.facts.length === 1, `facts: ${got.facts.length}`);
  assert(got.facts[0].includes('AWS'), `fact: ${got.facts[0]}`);
});

test('read returns null when CHECKPOINT.md missing', () => {
  const tmp = mkProject();
  assert(checkpoint.read(tmp) === null, 'expected null');
});

test('frontmatter has facts-hash that changes when facts change', () => {
  const tmp = mkProject();
  checkpoint.write(tmp, { project: 'h', facts: ['a', 'b'] });
  const a = checkpoint.read(tmp).frontmatter['facts-hash'];
  checkpoint.write(tmp, { project: 'h', facts: ['a', 'c'] });
  const b = checkpoint.read(tmp).frontmatter['facts-hash'];
  assert(a !== b, `facts-hash should change: ${a} vs ${b}`);
});

test('mode-d-suite roundtrips as boolean', () => {
  const tmp = mkProject();
  checkpoint.write(tmp, { project: 'suite', modeDSuite: true });
  const got = checkpoint.read(tmp);
  assert(got.frontmatter['mode-d-suite'] === true ||
         got.frontmatter['mode-d-suite'] === 'true',
    `mode-d-suite: ${got.frontmatter['mode-d-suite']}`);
});

test('recordAction prepends and trims to MAX_ACTIONS', () => {
  const tmp = mkProject();
  checkpoint.write(tmp, { project: 'a', actions: [] });
  for (let i = 0; i < checkpoint.MAX_ACTIONS + 5; i++) {
    checkpoint.recordAction(tmp, {
      ts: new Date(2026, 0, i + 1).toISOString(),
      actor: 'tester', name: `action-${i}`
    });
  }
  const got = checkpoint.read(tmp);
  assert(got.actions.length === checkpoint.MAX_ACTIONS,
    `actions: ${got.actions.length}, expected ${checkpoint.MAX_ACTIONS}`);
  // Most recent should be first
  assert(got.actions[0].includes(`action-${checkpoint.MAX_ACTIONS + 4}`),
    `first action wrong: ${got.actions[0]}`);
});

test('recordFact dedups and reorders to most-recent-first', () => {
  const tmp = mkProject();
  checkpoint.recordFact(tmp, 'fact alpha');
  checkpoint.recordFact(tmp, 'fact beta');
  checkpoint.recordFact(tmp, 'fact alpha');  // duplicate
  const got = checkpoint.read(tmp);
  assert(got.facts.length === 2, `facts: ${got.facts.length}`);
  assert(got.facts[0] === 'fact alpha', `first: ${got.facts[0]}`);
  assert(got.facts[1] === 'fact beta', `second: ${got.facts[1]}`);
});

test('recordFact preserves existing actions', () => {
  const tmp = mkProject();
  checkpoint.write(tmp, {
    project: 'preserve',
    actions: ['[2026-01-01T00:00:00.000Z] tester: first action'],
    facts: ['old fact']
  });
  checkpoint.recordFact(tmp, 'new fact');
  const got = checkpoint.read(tmp);
  assert(got.actions.length === 1, `actions: ${got.actions.length}`);
  assert(got.actions[0].includes('first action'), `action lost: ${got.actions[0]}`);
});

test('recordFact trims to MAX_FACTS', () => {
  const tmp = mkProject();
  for (let i = 0; i < checkpoint.MAX_FACTS + 5; i++) {
    checkpoint.recordFact(tmp, `fact ${i}`);
  }
  const got = checkpoint.read(tmp);
  assert(got.facts.length === checkpoint.MAX_FACTS,
    `facts: ${got.facts.length}, expected ${checkpoint.MAX_FACTS}`);
});

test('diff returns matches when claim agrees with checkpoint', () => {
  const tmp = mkProject();
  checkpoint.write(tmp, {
    project: 'demo', mode: 'A', lifecycle: 'in-arc',
    currentTier: 'tier-1', currentSubstep: 'arch',
    lastAction: 'ok'
  });
  const r = checkpoint.diff(tmp, {
    project: 'demo', mode: 'A', currentTier: 'tier-1'
  });
  assert(r.drifts.length === 0, `unexpected drifts: ${JSON.stringify(r.drifts)}`);
  assert(r.matches.length === 3, `matches: ${r.matches.length}`);
});

test('diff catches drifts when claim disagrees with checkpoint', () => {
  const tmp = mkProject();
  checkpoint.write(tmp, {
    project: 'demo', mode: 'A', lifecycle: 'in-arc',
    currentTier: 'tier-1', currentSubstep: 'arch',
    lastAction: 'wrote-arch'
  });
  const r = checkpoint.diff(tmp, {
    project: 'demo', mode: 'B', currentTier: 'tier-2'
  });
  const fields = r.drifts.map(d => d.field).sort();
  assert(fields.includes('mode'), `missing mode drift: ${JSON.stringify(r.drifts)}`);
  assert(fields.includes('currentTier'), `missing tier drift`);
  assert(r.matches.length === 1, `should have 1 match (project)`);
});

test('diff returns checkpoint-missing drift when no file exists', () => {
  const tmp = mkProject();
  const r = checkpoint.diff(tmp, { project: 'x' });
  assert(r.drifts.length === 1 && r.drifts[0].field === 'checkpoint',
    `expected checkpoint drift; got ${JSON.stringify(r.drifts)}`);
});

// --- Event hash chain ---

test('emit produces chain with prev=genesis on first event', () => {
  const tmp = mkProject();
  const h = events.startRun(tmp);
  const all = events.readRun(tmp, h.runId);
  assert(all[0].prev === 'genesis', `first prev: ${all[0].prev}`);
});

test('subsequent events chain to previous line hash', () => {
  const tmp = mkProject();
  const h = events.startRun(tmp);
  h.emit({ span_id: 'aa00bb11', name: 'agent.start' });
  h.emit({ span_id: 'aa00bb12', name: 'agent.end' });
  const all = events.readRun(tmp, h.runId);
  assert(all.length === 3, `expected 3, got ${all.length}`);
  assert(all[1].prev.startsWith('sha256:'),
    `second prev format: ${all[1].prev}`);
  assert(all[2].prev.startsWith('sha256:'),
    `third prev format: ${all[2].prev}`);
  assert(all[1].prev !== all[2].prev, 'chain prev should differ each line');
});

test('verifyChain reports valid on a normal write sequence', () => {
  const tmp = mkProject();
  const h = events.startRun(tmp);
  h.emit({ span_id: 'a1', name: 'agent.start' });
  h.emit({ span_id: 'a2', name: 'agent.end' });
  const r = events.verifyChain(h.file);
  assert(r.valid, `chain reported invalid: ${JSON.stringify(r)}`);
  assert(r.lines === 3, `expected 3 lines, got ${r.lines}`);
});

test('verifyChain reports break when a middle line is tampered', () => {
  const tmp = mkProject();
  const h = events.startRun(tmp);
  h.emit({ span_id: 'a1', name: 'agent.start' });
  h.emit({ span_id: 'a2', name: 'agent.end' });
  // Tamper line 1 (the agent.start)
  let raw = fs.readFileSync(h.file, 'utf8').split('\n');
  const obj = JSON.parse(raw[1]);
  obj.attrs = { tampered: true };
  raw[1] = JSON.stringify(obj);
  fs.writeFileSync(h.file, raw.join('\n'));
  const r = events.verifyChain(h.file);
  assert(!r.valid, 'expected chain to break');
  assert(r.breakAt === 2, `expected break at index 2 (the event after tampered), got ${r.breakAt}`);
});

test('verifyChain reports break when a line is deleted', () => {
  const tmp = mkProject();
  const h = events.startRun(tmp);
  h.emit({ span_id: 'a1', name: 'agent.start' });
  h.emit({ span_id: 'a2', name: 'agent.end' });
  // Delete the middle line
  let raw = fs.readFileSync(h.file, 'utf8').split('\n').filter(Boolean);
  raw.splice(1, 1);
  fs.writeFileSync(h.file, raw.join('\n') + '\n');
  const r = events.verifyChain(h.file);
  assert(!r.valid, 'expected chain to break after deletion');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
