/**
 * OTel Exporter
 *
 * Convert godpowers events.jsonl runs to OTLP/JSON ResourceSpans and
 * (optionally) POST them to an OTLP HTTP collector. Lets users pipe
 * godpowers telemetry into Honeycomb, Datadog, Jaeger, Tempo, or any
 * OTLP-compatible backend.
 *
 * Public API:
 *   convertRun(events, opts) -> ResourceSpans[]
 *   exportRun(projectRoot, runId, opts) -> { spans, json, posted?, status? }
 *   resolveEndpoint(endpoint) -> string  (appends /v1/traces if needed)
 *
 * Event -> span mapping:
 *   - workflow.run + workflow.complete become the root span.
 *   - agent.start + agent.end pairs (matched by span_id) become child spans.
 *   - Other named events (cost.recorded, gate.fail, error, decision.route, ...)
 *     attach as span events on the span sharing their span_id.
 *   - An event with a span_id that has no start/end becomes a
 *     zero-duration span so the data is never lost.
 *
 * Timestamps: events.jsonl ISO strings -> nanoseconds-since-epoch
 * strings (per OTLP/JSON spec - JS numbers cannot hold full 64-bit
 * nanos so they ship as strings).
 *
 * No external deps. HTTP POST uses Node's built-in http / https.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const events = require('./events');

const SCOPE_NAME = 'godpowers';

function packageVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(
      path.join(__dirname, '..', 'package.json'), 'utf8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function isoToNanos(iso) {
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '0';
  // Nanoseconds = milliseconds * 1_000_000. Use string concat to
  // sidestep JS number precision; OTLP/JSON expects a numeric string.
  return String(ms) + '000000';
}

/**
 * Encode a JS value as an OTLP AnyValue.
 */
function anyValue(v) {
  if (v == null) return { stringValue: '' };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { boolValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v)
      ? { intValue: String(v) }
      : { doubleValue: v };
  }
  return { stringValue: JSON.stringify(v) };
}

function attrEntries(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([key, value]) => ({
    key,
    value: anyValue(value)
  }));
}

/**
 * Convert a run's events into an OTLP ResourceSpans array.
 *
 * opts.serviceName overrides the default 'godpowers' resource name.
 * opts.runId is included in service.instance.id when supplied.
 */
function convertRun(eventList, opts = {}) {
  if (!Array.isArray(eventList) || eventList.length === 0) {
    return [];
  }

  const traceId = eventList[0].trace_id;
  const runId = opts.runId || '';
  const serviceName = opts.serviceName || 'godpowers';

  // Pass 1: group by span_id. Each bucket gathers its start/end/extras.
  const bySpan = new Map();
  let rootSpanId = null;
  let workflowName = 'workflow';

  for (const ev of eventList) {
    if (!ev.span_id) continue;
    if (!bySpan.has(ev.span_id)) {
      bySpan.set(ev.span_id, {
        spanId: ev.span_id,
        parent: ev.parent || null,
        startEvent: null,
        endEvent: null,
        extras: [],
        name: null,
        kind: 'internal',
        attrs: {}
      });
    }
    const bucket = bySpan.get(ev.span_id);
    if (ev.name === 'workflow.run') {
      bucket.startEvent = ev;
      bucket.name = `workflow.${(ev.attrs && ev.attrs.name) || 'run'}`;
      bucket.kind = 'root';
      rootSpanId = ev.span_id;
      workflowName = (ev.attrs && ev.attrs.name) || workflowName;
      Object.assign(bucket.attrs, ev.attrs || {});
    } else if (ev.name === 'workflow.complete') {
      bucket.endEvent = ev;
      Object.assign(bucket.attrs, ev.attrs || {});
    } else if (ev.name === 'agent.start') {
      bucket.startEvent = ev;
      bucket.name = `agent.${(ev.attrs && ev.attrs.agent) || 'unknown'}`;
      Object.assign(bucket.attrs, ev.attrs || {});
    } else if (ev.name === 'agent.end') {
      bucket.endEvent = ev;
      Object.assign(bucket.attrs, ev.attrs || {});
    } else {
      bucket.extras.push(ev);
    }
  }

  // Pass 2: emit spans. For buckets without a start, synthesize one
  // using the first extra event's timestamp; same for end.
  const spans = [];
  for (const bucket of bySpan.values()) {
    const start = bucket.startEvent
      || bucket.extras[0]
      || bucket.endEvent;
    const end = bucket.endEvent
      || bucket.extras[bucket.extras.length - 1]
      || bucket.startEvent;
    if (!start || !end) continue;

    const span = {
      traceId,
      spanId: bucket.spanId,
      name: bucket.name || (bucket.extras[0] && bucket.extras[0].name) || 'span',
      kind: 1, // SPAN_KIND_INTERNAL
      startTimeUnixNano: isoToNanos(start.ts),
      endTimeUnixNano: isoToNanos(end.ts),
      attributes: attrEntries(bucket.attrs),
      events: bucket.extras.map(ev => ({
        timeUnixNano: isoToNanos(ev.ts),
        name: ev.name,
        attributes: attrEntries(ev.attrs)
      })),
      status: { code: hasError(bucket) ? 2 : 1 } // 2=ERROR, 1=OK
    };

    if (bucket.parent) span.parentSpanId = bucket.parent;
    else if (rootSpanId && bucket.spanId !== rootSpanId) {
      span.parentSpanId = rootSpanId;
    }

    spans.push(span);
  }

  const resourceAttrs = [
    { key: 'service.name', value: { stringValue: serviceName } }
  ];
  if (runId) {
    resourceAttrs.push({
      key: 'service.instance.id',
      value: { stringValue: runId }
    });
  }
  if (workflowName) {
    resourceAttrs.push({
      key: 'godpowers.workflow',
      value: { stringValue: workflowName }
    });
  }

  return [{
    resource: { attributes: resourceAttrs },
    scopeSpans: [{
      scope: { name: SCOPE_NAME, version: packageVersion() },
      spans
    }]
  }];
}

function hasError(bucket) {
  if (bucket.extras.some(e => e.name === 'error' || e.name === 'gate.fail')) return true;
  if (bucket.endEvent && bucket.endEvent.attrs && bucket.endEvent.attrs.status === 'error') return true;
  return false;
}

/**
 * Normalize an OTLP HTTP endpoint. The OTel spec says:
 *   - If OTEL_EXPORTER_OTLP_TRACES_ENDPOINT is set, use it verbatim.
 *   - If OTEL_EXPORTER_OTLP_ENDPOINT is set, append /v1/traces.
 *
 * This helper accepts either: if the path already ends in /v1/traces
 * we leave it alone, otherwise we append.
 */
function resolveEndpoint(endpoint) {
  if (!endpoint) return null;
  const u = new URL(endpoint);
  if (!/\/v1\/traces\/?$/.test(u.pathname)) {
    u.pathname = u.pathname.replace(/\/$/, '') + '/v1/traces';
  }
  return u.toString();
}

/**
 * POST OTLP JSON to a collector. Returns a promise that resolves to
 * { ok, status, body }. Honors OTEL_EXPORTER_OTLP_HEADERS env var
 * (comma-separated key=value pairs) for auth.
 */
function postJson(endpoint, body) {
  const url = new URL(endpoint);
  const client = url.protocol === 'https:' ? https : http;
  const payload = JSON.stringify(body);
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  };
  const raw = process.env.OTEL_EXPORTER_OTLP_HEADERS;
  if (raw) {
    for (const pair of raw.split(',')) {
      const [k, v] = pair.split('=').map(s => s && s.trim());
      if (k && v) headers[k] = v;
    }
  }
  return new Promise((resolve, reject) => {
    const req = client.request({
      method: 'POST',
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        body: Buffer.concat(chunks).toString('utf8')
      }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Export one run.
 *
 * opts:
 *   endpoint   - OTLP HTTP endpoint (else falls back to OTEL_EXPORTER_OTLP_ENDPOINT)
 *   stdout     - if true, return JSON without POSTing
 *   serviceName - override 'godpowers'
 *
 * Return: { spans, payload, posted, status?, body? }
 */
async function exportRun(projectRoot, runId, opts = {}) {
  const eventList = events.readRun(projectRoot, runId);
  const resourceSpans = convertRun(eventList, { runId, serviceName: opts.serviceName });
  const payload = { resourceSpans };
  const result = {
    spans: resourceSpans[0] ? resourceSpans[0].scopeSpans[0].spans.length : 0,
    payload,
    posted: false
  };

  const endpoint = opts.endpoint
    || process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
    || process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  if (opts.stdout || !endpoint) {
    return result;
  }

  const resolved = resolveEndpoint(endpoint);
  const res = await postJson(resolved, payload);
  result.posted = true;
  result.status = res.status;
  result.body = res.body;
  result.endpoint = resolved;
  return result;
}

module.exports = {
  convertRun,
  exportRun,
  resolveEndpoint,
  isoToNanos,
  anyValue,
  attrEntries,
  postJson
};
