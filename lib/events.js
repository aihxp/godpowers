/**
 * Events Manager
 *
 * Append OpenTelemetry-shape events to .godpowers/runs/<run-id>/events.jsonl.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VALID_EVENT_NAMES = new Set([
  'workflow.run', 'workflow.complete',
  'agent.start', 'agent.end', 'agent.pause', 'agent.yolo-resolve',
  'user.resolve',
  'tool.call', 'tool.result',
  'model.call',
  'decision.route',
  'artifact.created', 'artifact.updated', 'artifact.hash',
  'have-nots.check',
  'gate.fail', 'gate.pass',
  'tier.skip',
  'state.repair', 'state.rollback',
  'extension.install', 'extension.activate',
  'error', 'warn'
]);

function generateTraceId() {
  return crypto.randomBytes(16).toString('hex');
}

function generateSpanId() {
  return crypto.randomBytes(8).toString('hex');
}

function eventsPath(projectRoot, runId) {
  return path.join(projectRoot, '.godpowers', 'runs', runId, 'events.jsonl');
}

/**
 * Start a new run. Returns a run handle with trace_id and write functions.
 */
function startRun(projectRoot, attrs = {}) {
  const traceId = generateTraceId();
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${traceId.slice(0, 8)}`;
  const spanId = generateSpanId();

  const file = eventsPath(projectRoot, runId);
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const handle = {
    traceId,
    runId,
    rootSpanId: spanId,
    file,
    emit: (event) => emit(file, { trace_id: traceId, ...event }),
    spawn: (parentSpanId) => spawnSpan(traceId, parentSpanId || spanId, file)
  };

  handle.emit({
    span_id: spanId,
    ts: new Date().toISOString(),
    name: 'workflow.run',
    attrs
  });

  return handle;
}

function spawnSpan(traceId, parentSpanId, file) {
  const spanId = generateSpanId();
  return {
    traceId,
    spanId,
    parentSpanId,
    emit: (event) =>
      emit(file, {
        trace_id: traceId,
        span_id: spanId,
        parent: parentSpanId,
        ...event
      })
  };
}

/**
 * Append a single event to the events.jsonl file.
 */
function emit(file, event) {
  if (!event.trace_id) throw new Error('event.trace_id required');
  if (!event.span_id) throw new Error('event.span_id required');
  if (!event.ts) event.ts = new Date().toISOString();
  if (!event.name) throw new Error('event.name required');
  if (!VALID_EVENT_NAMES.has(event.name)) {
    throw new Error(`Invalid event name: ${event.name}`);
  }

  fs.appendFileSync(file, JSON.stringify(event) + '\n');
}

/**
 * Read all events for a run.
 */
function readRun(projectRoot, runId) {
  const file = eventsPath(projectRoot, runId);
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

/**
 * List all runs in a project.
 */
function listRuns(projectRoot) {
  const runsDir = path.join(projectRoot, '.godpowers', 'runs');
  if (!fs.existsSync(runsDir)) return [];
  return fs.readdirSync(runsDir).sort();
}

module.exports = {
  startRun,
  emit,
  readRun,
  listRuns,
  generateTraceId,
  generateSpanId,
  eventsPath,
  VALID_EVENT_NAMES
};
