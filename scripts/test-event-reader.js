#!/usr/bin/env node
/**
 * Behavioral tests for lib/event-reader.js (v0.15 observability).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const events = require('../lib/events');
const reader = require('../lib/event-reader');

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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-evtreader-'));
  fs.mkdirSync(path.join(tmp, '.godpowers'), { recursive: true });
  return tmp;
}

function mkRun(tmp, sequence) {
  const h = events.startRun(tmp, { workflow: 'full-arc' });
  for (const ev of sequence) {
    h.emit(ev);
  }
  return h;
}

console.log('\n  Event reader behavioral tests\n');

test('timeline returns rows with parent durations on agent.end', () => {
  const tmp = mkProject();
  const h = mkRun(tmp, [
    { span_id: 'a1', name: 'agent.start', attrs: { tier: 'tier-1', agent: 'god-pm' } },
    { span_id: 'a1', name: 'agent.end',   attrs: { tier: 'tier-1', agent: 'god-pm' } }
  ]);
  const rows = reader.timeline(tmp, h.runId);
  const endRow = rows.find(r => r.name === 'agent.end');
  assert(endRow, 'no end row');
  assert(typeof endRow.durationMs === 'number',
    `no duration: ${JSON.stringify(endRow)}`);
});

test('timeline applies --filter', () => {
  const tmp = mkProject();
  const h = mkRun(tmp, [
    { span_id: 'a1', name: 'agent.start' },
    { span_id: 'a1', name: 'agent.end' },
    { span_id: 'b1', name: 'tool.call' }
  ]);
  const filtered = reader.timeline(tmp, h.runId, { filter: '^agent' });
  assert(filtered.every(r => /^agent/.test(r.name)),
    `filter leaked: ${JSON.stringify(filtered.map(r => r.name))}`);
});

test('timeline applies --limit', () => {
  const tmp = mkProject();
  const h = mkRun(tmp, Array.from({ length: 5 }, (_, i) => ({
    span_id: `s${i}`,
    name: 'agent.start'
  })));
  const rows = reader.timeline(tmp, h.runId, { limit: 3 });
  assert(rows.length === 3, `limit ignored: ${rows.length}`);
});

test('formatTimeline produces non-empty string', () => {
  const tmp = mkProject();
  const h = mkRun(tmp, [
    { span_id: 'a1', name: 'agent.start', attrs: { tier: 'tier-1', agent: 'god-pm' } }
  ]);
  const rows = reader.timeline(tmp, h.runId);
  const s = reader.formatTimeline(rows);
  assert(s.length > 0, 'formatted output empty');
  assert(/agent\.start/.test(s), 'agent.start not in output');
});

test('metrics counts agents per tier', () => {
  const tmp = mkProject();
  const h = mkRun(tmp, [
    { span_id: 'a1', name: 'agent.start', attrs: { tier: 'tier-1' } },
    { span_id: 'a1', name: 'agent.end',   attrs: { tier: 'tier-1' } },
    { span_id: 'b1', name: 'agent.start', attrs: { tier: 'tier-2' } },
    { span_id: 'b1', name: 'agent.end',   attrs: { tier: 'tier-2' } },
    { span_id: 'b2', name: 'agent.start', attrs: { tier: 'tier-2' } },
    { span_id: 'b2', name: 'agent.end',   attrs: { tier: 'tier-2' } }
  ]);
  const m = reader.metrics(tmp, [h.runId]);
  assert(m.perTier['tier-1'].count === 1, `tier-1 count: ${m.perTier['tier-1'].count}`);
  assert(m.perTier['tier-2'].count === 2, `tier-2 count: ${m.perTier['tier-2'].count}`);
});

test('metrics aggregates pauses + errors', () => {
  const tmp = mkProject();
  const h = mkRun(tmp, [
    { span_id: 'a1', name: 'agent.start', attrs: { tier: 'tier-1' } },
    { span_id: 'a1', name: 'agent.pause', attrs: { tier: 'tier-1' } },
    { span_id: 'a1', name: 'error',       attrs: { tier: 'tier-1' } }
  ]);
  const m = reader.metrics(tmp, [h.runId]);
  assert(m.totals.pauses === 1, `pauses: ${m.totals.pauses}`);
  assert(m.totals.errors === 1, `errors: ${m.totals.errors}`);
});

test('metrics across all runs when runIds is null', () => {
  const tmp = mkProject();
  mkRun(tmp, [
    { span_id: 'a', name: 'agent.start', attrs: { tier: 'tier-1' } },
    { span_id: 'a', name: 'agent.end',   attrs: { tier: 'tier-1' } }
  ]);
  // stagger so second runId differs
  mkRun(tmp, [
    { span_id: 'b', name: 'agent.start', attrs: { tier: 'tier-2' } },
    { span_id: 'b', name: 'agent.end',   attrs: { tier: 'tier-2' } }
  ]);
  const m = reader.metrics(tmp);
  assert(m.totals.agents >= 2, `agents: ${m.totals.agents}`);
  assert(m.totals.runs >= 2, `runs: ${m.totals.runs}`);
});

test('trace filters to one tier', () => {
  const tmp = mkProject();
  const h = mkRun(tmp, [
    { span_id: 'a1', name: 'agent.start', attrs: { tier: 'tier-1' } },
    { span_id: 'b1', name: 'agent.start', attrs: { tier: 'tier-2' } },
    { span_id: 'a1', name: 'agent.end',   attrs: { tier: 'tier-1' } }
  ]);
  const t1 = reader.trace(tmp, h.runId, 'tier-1');
  const t2 = reader.trace(tmp, h.runId, 'tier-2');
  assert(t1.length === 2, `tier-1: ${t1.length}`);
  assert(t2.length === 1, `tier-2: ${t2.length}`);
});

test('summarize computes agent/pause/error counts', () => {
  const tmp = mkProject();
  const h = mkRun(tmp, [
    { span_id: 'a', name: 'agent.start' },
    { span_id: 'a', name: 'agent.end' },
    { span_id: 'b', name: 'agent.pause' },
    { span_id: 'c', name: 'error' }
  ]);
  const all = reader.readAll(tmp, h.runId);
  const s = reader.summarize(all);
  assert(s.agentCount === 1, `agentCount: ${s.agentCount}`);
  assert(s.pauseCount === 1, `pauseCount: ${s.pauseCount}`);
  assert(s.errorCount === 1, `errorCount: ${s.errorCount}`);
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
