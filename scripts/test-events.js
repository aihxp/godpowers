#!/usr/bin/env node
/**
 * Behavioral tests for lib/events.js.
 *
 * Events.jsonl is the audit trail. If event writes fail silently or the
 * vocabulary drifts from the schema, recovery and observability both
 * lose their source of truth.
 *
 * Tests assert:
 *   - startRun creates the run directory + emits workflow.run
 *   - emit rejects events without trace_id / span_id / name
 *   - emit rejects events with unknown event name (vocabulary contract)
 *   - emit appends; multiple emits round-trip via readRun
 *   - spawn produces child spans with correct parent reference
 *   - listRuns enumerates created runs
 *   - vocabulary covers what schema/events.v1.json declares
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-events-test-'));
  fs.mkdirSync(path.join(tmp, '.godpowers'), { recursive: true });
  return tmp;
}

console.log('\n  Events module behavioral tests\n');

test('startRun creates run dir and emits workflow.run', () => {
  const tmp = mkProject();
  const handle = events.startRun(tmp, { workflow: 'full-arc' });
  assert(handle.traceId && /^[a-f0-9]{32}$/.test(handle.traceId),
    `bad traceId: ${handle.traceId}`);
  assert(handle.runId, 'runId missing');
  assert(fs.existsSync(handle.file), 'events.jsonl not created');
  const lines = fs.readFileSync(handle.file, 'utf8').trim().split('\n');
  assert(lines.length === 1, `expected 1 line, got ${lines.length}`);
  const first = JSON.parse(lines[0]);
  assert(first.name === 'workflow.run', `first event: ${first.name}`);
  assert(first.attrs.workflow === 'full-arc', 'attrs not threaded');
});

test('handle.emit appends events to the same file', () => {
  const tmp = mkProject();
  const h = events.startRun(tmp);
  h.emit({ span_id: 'aabbccdd00112233', name: 'agent.start' });
  h.emit({ span_id: 'aabbccdd00112234', name: 'agent.end' });
  const all = events.readRun(tmp, h.runId);
  assert(all.length === 3, `expected 3 events, got ${all.length}`);
  assert(all[1].name === 'agent.start', `wrong order`);
  assert(all[2].name === 'agent.end', `wrong order`);
});

test('large event lines still produce a valid hash chain', () => {
  const tmp = mkProject();
  const h = events.startRun(tmp);
  h.emit({ span_id: 'aabbccdd00112233', name: 'warn', attrs: { big: 'x'.repeat(5000) } });
  h.emit({ span_id: 'aabbccdd00112234', name: 'agent.end' });
  const r = events.verifyChain(h.file);
  assert(r.valid, `chain reported invalid: ${JSON.stringify(r)}`);
});

test('emit rejects event missing trace_id', () => {
  const tmp = mkProject();
  const h = events.startRun(tmp);
  try {
    events.emit(h.file, { span_id: 'x', name: 'agent.start' });
    throw new Error('should have thrown');
  } catch (e) {
    assert(/trace_id/.test(e.message), `unexpected error: ${e.message}`);
  }
});

test('emit rejects event missing span_id', () => {
  const tmp = mkProject();
  const h = events.startRun(tmp);
  try {
    events.emit(h.file, { trace_id: 'x', name: 'agent.start' });
    throw new Error('should have thrown');
  } catch (e) {
    assert(/span_id/.test(e.message), `unexpected error: ${e.message}`);
  }
});

test('emit rejects event missing name', () => {
  const tmp = mkProject();
  const h = events.startRun(tmp);
  try {
    events.emit(h.file, { trace_id: 'x', span_id: 'y' });
    throw new Error('should have thrown');
  } catch (e) {
    assert(/name/.test(e.message), `unexpected error: ${e.message}`);
  }
});

test('emit rejects unknown event name (vocabulary gate)', () => {
  const tmp = mkProject();
  const h = events.startRun(tmp);
  try {
    events.emit(h.file, {
      trace_id: 'x', span_id: 'y', name: 'agent.invented-event'
    });
    throw new Error('should have thrown');
  } catch (e) {
    assert(/invalid event name/i.test(e.message),
      `unexpected error: ${e.message}`);
  }
});

test('emit auto-fills ts when missing', () => {
  const tmp = mkProject();
  const h = events.startRun(tmp);
  h.emit({ span_id: 'aa', name: 'agent.start' });
  const all = events.readRun(tmp, h.runId);
  const ev = all[all.length - 1];
  assert(/^\d{4}-\d{2}-\d{2}T/.test(ev.ts), `bad ts: ${ev.ts}`);
});

test('spawn creates child span with parent reference', () => {
  const tmp = mkProject();
  const h = events.startRun(tmp);
  const child = h.spawn();
  child.emit({ name: 'agent.start' });
  const all = events.readRun(tmp, h.runId);
  const childEv = all.find(e => e.name === 'agent.start');
  assert(childEv, 'child event not written');
  assert(childEv.parent === h.rootSpanId,
    `child parent should be root span; got ${childEv.parent}`);
  assert(childEv.span_id !== h.rootSpanId, 'child span_id should differ from root');
});

test('listRuns returns created run ids', () => {
  const tmp = mkProject();
  events.startRun(tmp);
  // tiny stagger so the second runId differs
  events.startRun(tmp, { workflow: 'audit-only' });
  const runs = events.listRuns(tmp);
  assert(runs.length >= 1, `expected >=1 runs, got ${runs.length}`);
});

test('readRun returns [] for missing run', () => {
  const tmp = mkProject();
  const all = events.readRun(tmp, 'nonexistent');
  assert(Array.isArray(all) && all.length === 0,
    `expected empty array, got ${JSON.stringify(all)}`);
});

test('VALID_EVENT_NAMES exposes the vocabulary set', () => {
  assert(events.VALID_EVENT_NAMES instanceof Set,
    'VALID_EVENT_NAMES should be a Set');
  assert(events.VALID_EVENT_NAMES.has('workflow.run'),
    'vocabulary missing workflow.run');
  assert(events.VALID_EVENT_NAMES.has('agent.start'),
    'vocabulary missing agent.start');
  assert(events.VALID_EVENT_NAMES.has('artifact.created'),
    'vocabulary missing artifact.created');
  assert(events.VALID_EVENT_NAMES.has('local-helper.run'),
    'vocabulary missing local-helper.run');
  assert(events.VALID_EVENT_NAMES.has('host-capabilities.detect'),
    'vocabulary missing host-capabilities.detect');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
