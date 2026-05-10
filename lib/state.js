/**
 * State Manager
 *
 * Read/write .godpowers/state.json with schema validation.
 * Source of truth for tier statuses and artifact hashes.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STATE_VERSION = '1.0.0';

function statePath(projectRoot) {
  return path.join(projectRoot, '.godpowers', 'state.json');
}

/**
 * Read state.json from a project. Returns null if not initialized.
 */
function read(projectRoot) {
  const file = statePath(projectRoot);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Write state.json to a project. Validates basic structure.
 */
function write(projectRoot, state) {
  if (!state || typeof state !== 'object') {
    throw new Error('state must be an object');
  }
  if (!state.version) state.version = STATE_VERSION;
  if (!state.$schema) state.$schema = 'https://godpowers.dev/schema/state.v1.json';
  if (!state.project || !state.project.name) {
    throw new Error('state.project.name is required');
  }
  if (!state.tiers) state.tiers = {};

  const file = statePath(projectRoot);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2) + '\n');
  return state;
}

/**
 * Initialize a new state.json for a project.
 */
function init(projectRoot, projectName, opts = {}) {
  const state = {
    $schema: 'https://godpowers.dev/schema/state.v1.json',
    version: STATE_VERSION,
    project: {
      name: projectName,
      started: new Date().toISOString()
    },
    'active-workstream': 'main',
    tiers: {
      'tier-0': { orchestration: { status: 'in-flight', updated: new Date().toISOString() } },
      'tier-1': {
        prd: { status: 'pending' },
        arch: { status: 'pending' },
        roadmap: { status: 'pending' },
        stack: { status: 'pending' }
      },
      'tier-2': {
        repo: { status: 'pending' },
        build: { status: 'pending' }
      },
      'tier-3': {
        deploy: { status: 'pending' },
        observe: { status: 'pending' },
        launch: { status: 'pending' },
        harden: { status: 'pending' }
      }
    },
    'lifecycle-phase': 'in-arc',
    ...opts
  };
  return write(projectRoot, state);
}

/**
 * Update a single sub-step's status.
 */
function updateSubStep(projectRoot, tierKey, subStepKey, updates) {
  const state = read(projectRoot);
  if (!state) throw new Error('state.json not found');
  if (!state.tiers[tierKey]) throw new Error(`Tier not found: ${tierKey}`);
  state.tiers[tierKey][subStepKey] = {
    ...(state.tiers[tierKey][subStepKey] || {}),
    ...updates,
    updated: new Date().toISOString()
  };
  write(projectRoot, state);
  return state.tiers[tierKey][subStepKey];
}

/**
 * Hash a file. Used for artifact-hash tracking.
 */
function hashFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Detect drift: for each sub-step with an artifact, rehash and compare.
 * Returns a list of drift entries.
 */
function detectDrift(projectRoot) {
  const state = read(projectRoot);
  if (!state) return [];
  const drift = [];
  for (const [tierKey, tier] of Object.entries(state.tiers)) {
    for (const [subStepKey, subStep] of Object.entries(tier)) {
      if (!subStep.artifact || !subStep['artifact-hash']) continue;
      const fullPath = path.join(projectRoot, '.godpowers', subStep.artifact);
      const currentHash = hashFile(fullPath);
      if (currentHash === null) {
        drift.push({ tierKey, subStepKey, kind: 'missing', recorded: subStep['artifact-hash'] });
      } else if (currentHash !== subStep['artifact-hash']) {
        drift.push({ tierKey, subStepKey, kind: 'modified', recorded: subStep['artifact-hash'], current: currentHash });
      }
    }
  }
  return drift;
}

module.exports = { read, write, init, updateSubStep, hashFile, detectDrift, statePath };
