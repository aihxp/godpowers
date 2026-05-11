#!/usr/bin/env node
/**
 * Behavioral tests for lib/otel-exporter.js.
 *
 * Verifies the events.jsonl -> OTLP/JSON mapping and exercises the
 * HTTP POST path against an in-process collector.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const events = require('../lib/events');
const cost = require('../lib/cost-tracker');
const otel = require('../lib/otel-exporter');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  + ${name}`); passed++; }
  catch (e) { console.error(`  x ${name}: ${e.message}`); failed++; }
}

async function asyncTest(name, fn) {
  try { await fn(); console.log(`  + ${name}`); passed++; }
  catch (e) { console.error(`  x ${name}: ${e.message}`); failed++; }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function mkProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-otel-'));
  fs.mkdirSync(path.join(tmp, '.godpowers'), { recursive: true });
  return tmp;
}

function buildRun(tmp) {
  const h = events.startRun(tmp, { name: 'demo-arc' });
  const agent = h.spawn(h.rootSpanId);
  agent.emit({ name: 'agent.start', attrs: { agent: 'god-pm', tier: 'tier-1' } });
  cost.recordModelCall(
    { emit: (e) => events.emit(h.file, { trace_id: h.traceId, span_id: agent.spanId, ...e }),
      rootSpanId: agent.spanId },
    { model: 'claude-3-5-sonnet', tokens_in: 1000, tokens_out: 500,
      agent: 'god-pm', tier: 'tier-1' });
  agent.emit({ name: 'agent.end', attrs: { agent: 'god-pm', tier: 'tier-1' } });
  h.emit({ span_id: h.rootSpanId, name: 'workflow.complete', attrs: { status: 'ok' } });
  return h;
}

(async () => {
  console.log('\n  OTel exporter behavioral tests\n');

  test('convertRun returns [] for empty event list', () => {
    const rs = otel.convertRun([]);
    assert(Array.isArray(rs) && rs.length === 0, 'expected []');
  });

  test('isoToNanos converts ISO to nanos string', () => {
    const n = otel.isoToNanos('2026-05-10T12:00:00.000Z');
    assert(typeof n === 'string', 'must be string');
    assert(/^\d+$/.test(n), `not numeric: ${n}`);
    assert(n.endsWith('000000'), `bad nanos suffix: ${n}`);
  });

  test('anyValue encodes strings / bools / ints / floats / objects', () => {
    assert(otel.anyValue('x').stringValue === 'x');
    assert(otel.anyValue(true).boolValue === true);
    assert(otel.anyValue(42).intValue === '42');
    assert(otel.anyValue(1.5).doubleValue === 1.5);
    assert(otel.anyValue({a: 1}).stringValue === '{"a":1}');
    assert(otel.anyValue(null).stringValue === '');
  });

  test('convertRun produces a workflow root + agent child span', () => {
    const tmp = mkProject();
    const h = buildRun(tmp);
    const eventList = events.readRun(tmp, h.runId);
    const rs = otel.convertRun(eventList, { runId: h.runId });
    assert(rs.length === 1, `resourceSpans: ${rs.length}`);
    const spans = rs[0].scopeSpans[0].spans;
    assert(spans.length >= 2, `spans: ${spans.length}`);
    const root = spans.find(s => s.name.startsWith('workflow.'));
    const agentSpan = spans.find(s => s.name.startsWith('agent.'));
    assert(root, 'no workflow root');
    assert(agentSpan, 'no agent span');
    assert(agentSpan.parentSpanId === root.spanId, 'agent span not parented to root');
  });

  test('cost.recorded attaches as a span event on the agent span', () => {
    const tmp = mkProject();
    const h = buildRun(tmp);
    const eventList = events.readRun(tmp, h.runId);
    const rs = otel.convertRun(eventList, { runId: h.runId });
    const agentSpan = rs[0].scopeSpans[0].spans.find(s => s.name.startsWith('agent.'));
    const costEv = agentSpan.events.find(e => e.name === 'cost.recorded');
    assert(costEv, 'cost.recorded not attached');
    assert(costEv.attributes.find(a => a.key === 'model'), 'model attr missing');
    assert(costEv.attributes.find(a => a.key === 'source'), 'source attr missing');
  });

  test('every span carries traceId + spanId + start/end + status', () => {
    const tmp = mkProject();
    const h = buildRun(tmp);
    const rs = otel.convertRun(events.readRun(tmp, h.runId), { runId: h.runId });
    for (const span of rs[0].scopeSpans[0].spans) {
      assert(span.traceId, 'traceId missing');
      assert(span.spanId, 'spanId missing');
      assert(span.startTimeUnixNano, 'start missing');
      assert(span.endTimeUnixNano, 'end missing');
      assert(span.status && [1, 2].includes(span.status.code), 'status code invalid');
    }
  });

  test('error event flips span status to ERROR (2)', () => {
    const tmp = mkProject();
    const h = events.startRun(tmp, { name: 'demo' });
    const agent = h.spawn(h.rootSpanId);
    agent.emit({ name: 'agent.start', attrs: { agent: 'god-pm' } });
    agent.emit({ name: 'error', attrs: { message: 'oops' } });
    agent.emit({ name: 'agent.end', attrs: { agent: 'god-pm' } });
    const rs = otel.convertRun(events.readRun(tmp, h.runId), { runId: h.runId });
    const agentSpan = rs[0].scopeSpans[0].spans.find(s => s.name.startsWith('agent.'));
    assert(agentSpan.status.code === 2, `status: ${agentSpan.status.code}`);
  });

  test('resource carries service.name + service.instance.id', () => {
    const tmp = mkProject();
    const h = buildRun(tmp);
    const rs = otel.convertRun(events.readRun(tmp, h.runId), { runId: h.runId });
    const attrs = rs[0].resource.attributes;
    const name = attrs.find(a => a.key === 'service.name');
    const inst = attrs.find(a => a.key === 'service.instance.id');
    assert(name && name.value.stringValue === 'godpowers', 'service.name wrong');
    assert(inst && inst.value.stringValue === h.runId, 'instance.id wrong');
  });

  test('serviceName override propagates to resource', () => {
    const tmp = mkProject();
    const h = buildRun(tmp);
    const rs = otel.convertRun(events.readRun(tmp, h.runId),
      { runId: h.runId, serviceName: 'my-app' });
    const name = rs[0].resource.attributes.find(a => a.key === 'service.name');
    assert(name.value.stringValue === 'my-app', `serviceName: ${name.value.stringValue}`);
  });

  test('resolveEndpoint appends /v1/traces when missing', () => {
    assert(otel.resolveEndpoint('http://collector:4318') === 'http://collector:4318/v1/traces');
    assert(otel.resolveEndpoint('http://collector:4318/') === 'http://collector:4318/v1/traces');
    assert(otel.resolveEndpoint('http://collector:4318/v1/traces') === 'http://collector:4318/v1/traces');
    assert(otel.resolveEndpoint('https://api.honeycomb.io') === 'https://api.honeycomb.io/v1/traces');
  });

  test('resolveEndpoint returns null for falsy input', () => {
    assert(otel.resolveEndpoint(null) === null);
    assert(otel.resolveEndpoint('') === null);
  });

  await asyncTest('exportRun stdout mode returns payload without posting', async () => {
    const tmp = mkProject();
    const h = buildRun(tmp);
    const res = await otel.exportRun(tmp, h.runId, { stdout: true });
    assert(res.posted === false, 'should not POST in stdout mode');
    assert(res.spans >= 2, `spans: ${res.spans}`);
    assert(res.payload.resourceSpans, 'resourceSpans missing');
  });

  await asyncTest('exportRun POSTs OTLP JSON to a collector', async () => {
    const tmp = mkProject();
    const h = buildRun(tmp);
    let received = null;
    const server = http.createServer((req, res) => {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => {
        received = {
          method: req.method,
          path: req.url,
          contentType: req.headers['content-type'],
          body: JSON.parse(Buffer.concat(chunks).toString('utf8'))
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{}');
      });
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const port = server.address().port;
    try {
      const result = await otel.exportRun(tmp, h.runId,
        { endpoint: `http://127.0.0.1:${port}` });
      assert(result.posted === true, 'should have posted');
      assert(result.status === 200, `status: ${result.status}`);
      assert(received.method === 'POST', `method: ${received.method}`);
      assert(received.path === '/v1/traces', `path: ${received.path}`);
      assert(received.contentType === 'application/json', 'content-type wrong');
      assert(Array.isArray(received.body.resourceSpans), 'no resourceSpans in body');
      assert(received.body.resourceSpans[0].scopeSpans[0].spans.length >= 2,
        'no spans in body');
    } finally {
      server.close();
    }
  });

  await asyncTest('exportRun honors OTEL_EXPORTER_OTLP_HEADERS for auth', async () => {
    const tmp = mkProject();
    const h = buildRun(tmp);
    let received = null;
    const server = http.createServer((req, res) => {
      received = { auth: req.headers['x-honeycomb-team'] };
      req.resume();
      req.on('end', () => { res.writeHead(200); res.end('{}'); });
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const port = server.address().port;
    const old = process.env.OTEL_EXPORTER_OTLP_HEADERS;
    process.env.OTEL_EXPORTER_OTLP_HEADERS = 'x-honeycomb-team=secret-key';
    try {
      await otel.exportRun(tmp, h.runId,
        { endpoint: `http://127.0.0.1:${port}` });
      assert(received.auth === 'secret-key', `auth header: ${received.auth}`);
    } finally {
      if (old === undefined) delete process.env.OTEL_EXPORTER_OTLP_HEADERS;
      else process.env.OTEL_EXPORTER_OTLP_HEADERS = old;
      server.close();
    }
  });

  await asyncTest('exportRun falls back to stdout when no endpoint set', async () => {
    const tmp = mkProject();
    const h = buildRun(tmp);
    const old = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    const oldT = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
    try {
      const res = await otel.exportRun(tmp, h.runId);
      assert(res.posted === false, 'should not have posted');
      assert(res.spans >= 2, `spans: ${res.spans}`);
    } finally {
      if (old !== undefined) process.env.OTEL_EXPORTER_OTLP_ENDPOINT = old;
      if (oldT !== undefined) process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = oldT;
    }
  });

  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
