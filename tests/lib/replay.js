/**
 * Record/replay layer for deterministic LLM tests.
 *
 * Status: SCAFFOLD (v0.4). Full implementation in v0.5 alongside the
 * workflow runtime.
 *
 * The pattern: record real LLM responses once, replay forever in tests.
 * Mock the model layer at the SDK boundary; let everything else run real.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RECORDINGS_DIR = path.join(__dirname, '..', 'replay', 'recordings');
const RECORD_MODE = process.env.RECORD === '1';

/**
 * Compute a stable hash for an LLM request.
 * Used as the key for stored recordings.
 */
function requestHash(request) {
  const stable = JSON.stringify({
    model: request.model,
    messages: request.messages,
    tools: request.tools || [],
    system: request.system || ''
  });
  return crypto.createHash('sha256').update(stable).digest('hex').slice(0, 16);
}

/**
 * Look up a recorded response for a given request.
 * Returns null if no recording exists.
 */
function lookup(request) {
  const hash = requestHash(request);
  const recordingPath = path.join(RECORDINGS_DIR, `${hash}.json`);
  if (!fs.existsSync(recordingPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(recordingPath, 'utf8'));
}

/**
 * Save a real LLM response as a recording.
 * Only used when RECORD=1.
 */
function record(request, response) {
  if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
  }
  const hash = requestHash(request);
  const recordingPath = path.join(RECORDINGS_DIR, `${hash}.json`);
  fs.writeFileSync(
    recordingPath,
    JSON.stringify({ request, response, recorded_at: new Date().toISOString() }, null, 2)
  );
  return hash;
}

/**
 * Wrap an LLM call with replay.
 * In test mode: returns recorded response if available, throws if not.
 * In RECORD mode: calls real LLM, records, returns.
 */
async function replay(request, realCall) {
  if (RECORD_MODE) {
    const response = await realCall(request);
    record(request, response);
    return response;
  }
  const recording = lookup(request);
  if (!recording) {
    throw new Error(
      `No recording for request hash ${requestHash(request)}.\n` +
      `Run with RECORD=1 to record, or check that you're testing the right thing.`
    );
  }
  return recording.response;
}

module.exports = { requestHash, lookup, record, replay };
