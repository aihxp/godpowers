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
  // Cost / cache / budget (v0.14 token cost saver)
  'cost.recorded', 'cache.hit', 'cache.miss', 'budget.exceeded',
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
 * Append a single event to the events.jsonl file. Includes a hash chain:
 * each event carries `prev` = sha256 of the previous event line (or
 * 'genesis' for the first). Any truncation, reordering, or tampering
 * breaks the chain at that point and is detectable by
 * verifyChain(file).
 */
function emit(file, event) {
  if (!event.trace_id) throw new Error('event.trace_id required');
  if (!event.span_id) throw new Error('event.span_id required');
  if (!event.ts) event.ts = new Date().toISOString();
  if (!event.name) throw new Error('event.name required');
  if (!VALID_EVENT_NAMES.has(event.name)) {
    throw new Error(`Invalid event name: ${event.name}`);
  }

  // Compute prev hash from the last line of the file, if any.
  let prev = 'genesis';
  if (fs.existsSync(file)) {
    const stat = fs.statSync(file);
    if (stat.size > 0) {
      // Read just the last 4KB to find the last full line.
      const fd = fs.openSync(file, 'r');
      const chunkSize = Math.min(4096, stat.size);
      const buf = Buffer.alloc(chunkSize);
      fs.readSync(fd, buf, 0, chunkSize, stat.size - chunkSize);
      fs.closeSync(fd);
      const tail = buf.toString('utf8');
      const lines = tail.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        prev = 'sha256:' + crypto.createHash('sha256')
          .update(lines[lines.length - 1])
          .digest('hex');
      }
    }
  }
  event.prev = prev;

  fs.appendFileSync(file, JSON.stringify(event) + '\n');
}

/**
 * Verify the hash chain in an events.jsonl file. Returns
 * { valid: bool, breakAt: number | null, expected, actual }.
 *
 * The chain is broken if any event's `prev` doesn't match the sha256
 * of the previous line's exact bytes. Genesis line must have
 * prev === 'genesis'.
 */
function verifyChain(file) {
  if (!fs.existsSync(file)) return { valid: true, lines: 0 };
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(l => l.trim());
  let prev = 'genesis';
  for (let i = 0; i < lines.length; i++) {
    let ev;
    try { ev = JSON.parse(lines[i]); }
    catch (e) { return { valid: false, breakAt: i, error: 'parse-error' }; }
    if (ev.prev !== prev) {
      return { valid: false, breakAt: i, expected: prev, actual: ev.prev };
    }
    prev = 'sha256:' + crypto.createHash('sha256').update(lines[i]).digest('hex');
  }
  return { valid: true, lines: lines.length };
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
  verifyChain,
  generateTraceId,
  generateSpanId,
  eventsPath,
  VALID_EVENT_NAMES
};
