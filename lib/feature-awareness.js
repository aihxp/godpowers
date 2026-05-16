/**
 * Godpowers Feature Awareness
 *
 * Keeps existing Godpowers projects aware of capabilities added by newer
 * installed runtimes. This module is deliberately conservative: detect is
 * read-only, run applies only safe state and context refreshes, and ambiguous
 * migration cases are returned as spawn recommendations.
 */

const fs = require('fs');
const path = require('path');

const state = require('./state');
const contextWriter = require('./context-writer');
const planningSystems = require('./planning-systems');

const FEATURE_SET_VERSION = 1;

const FEATURES = [
  {
    id: 'planning-system-migration',
    since: '1.6.15',
    commands: ['/god-migrate', '/god-init'],
    description: 'Detect and import GSD, BMAD, and Superpowers planning artifacts.'
  },
  {
    id: 'source-system-sync-back',
    since: '1.6.15',
    commands: ['/god-sync', '/god-migrate'],
    description: 'Write managed Godpowers progress summaries back to detected source systems.'
  },
  {
    id: 'feature-awareness',
    since: '1.6.16',
    commands: ['/god-doctor', '/god-context', '/god-sync', '/god-mode'],
    description: 'Refresh existing Godpowers projects when the installed runtime gains new capabilities.'
  }
];

function packageVersion(projectRoot) {
  const candidates = [
    path.join(__dirname, '..', 'package.json'),
    path.join(projectRoot || process.cwd(), 'package.json')
  ];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      if (parsed && parsed.name === 'godpowers' && parsed.version) return parsed.version;
    } catch (err) {
      // Ignore malformed package metadata. Awareness can still run with unknown.
    }
  }
  return 'unknown';
}

function expectedFeatureIds() {
  return FEATURES.map((feature) => feature.id);
}

function existingFeatureIds(current) {
  const record = current && current['godpowers-features'];
  return Array.isArray(record && record.known) ? record.known : [];
}

function missingFeatureIds(current) {
  const known = new Set(existingFeatureIds(current));
  return expectedFeatureIds().filter((id) => !known.has(id));
}

function sourceSystemsNeedJudgment(current) {
  const systems = Array.isArray(current && current['source-systems'])
    ? current['source-systems']
    : [];
  return systems.filter((system) => {
    return system.confidence === 'low' || Number(system['conflict-count'] || 0) > 0;
  });
}

function missingContextTargets(projectRoot) {
  const status = contextWriter.status(projectRoot);
  const missing = [];
  if (!status.canonical.hasFence) missing.push('AGENTS.md');
  for (const pointer of status.pointers) {
    if (!pointer.hasFence) {
      missing.push(path.relative(projectRoot, pointer.path).split(path.sep).join('/'));
    }
  }
  return missing;
}

function detect(projectRoot, opts = {}) {
  const current = state.read(projectRoot);
  const runtimeVersion = opts.runtimeVersion || packageVersion(projectRoot);
  if (!current) {
    return {
      initialized: false,
      runtimeVersion,
      actions: [],
      missingFeatures: expectedFeatureIds(),
      missingContext: [],
      migrationCandidates: [],
      spawnRecommendation: null
    };
  }

  const record = current['godpowers-features'] || {};
  const missingFeatures = missingFeatureIds(current);
  const missingContext = missingContextTargets(projectRoot);
  const migrationCandidates = planningSystems.detect(projectRoot).systems
    .filter((system) => {
      const configured = Array.isArray(current['source-systems'])
        ? current['source-systems']
        : [];
      return !configured.some((entry) => entry.id === system.id);
    })
    .map((system) => ({
      id: system.id,
      name: system.name,
      confidence: system.confidence,
      files: system.files.length
    }));

  const actions = [];
  if (record['runtime-version'] !== runtimeVersion) actions.push('record-runtime-version');
  if (missingFeatures.length > 0) actions.push('record-feature-set');
  if (missingContext.length > 0) actions.push('refresh-context');
  if (migrationCandidates.length > 0) actions.push('suggest-god-migrate');

  const needsJudgment = sourceSystemsNeedJudgment(current);
  const lowConfidenceCandidates = migrationCandidates.filter((system) => system.confidence === 'low');
  const spawnRecommendation = needsJudgment.length > 0 || lowConfidenceCandidates.length > 0
    ? {
        agent: 'god-greenfieldifier',
        reason: 'Imported or detected planning-system context needs migration judgment.',
        systems: [...needsJudgment.map((system) => system.id), ...lowConfidenceCandidates.map((system) => system.id)]
      }
    : null;

  return {
    initialized: true,
    runtimeVersion,
    featureSetVersion: FEATURE_SET_VERSION,
    actions,
    currentFeatures: existingFeatureIds(current),
    expectedFeatures: FEATURES,
    missingFeatures,
    missingContext,
    migrationCandidates,
    spawnRecommendation
  };
}

function buildFeatureRecord(runtimeVersion, now) {
  return {
    'feature-set-version': FEATURE_SET_VERSION,
    'runtime-version': runtimeVersion,
    known: expectedFeatureIds(),
    'last-awareness-refresh-at': now
  };
}

function sameFeatureRecord(existing, next) {
  if (!existing) return false;
  return existing['feature-set-version'] === next['feature-set-version']
    && existing['runtime-version'] === next['runtime-version']
    && JSON.stringify(existing.known || []) === JSON.stringify(next.known || []);
}

function applyStateAwareness(projectRoot, current, runtimeVersion, now) {
  const nextRecord = buildFeatureRecord(runtimeVersion, now);
  if (sameFeatureRecord(current['godpowers-features'], nextRecord)) {
    return { written: false, record: current['godpowers-features'] };
  }
  const nextState = {
    ...current,
    'godpowers-features': nextRecord
  };
  state.write(projectRoot, nextState);
  return { written: true, record: nextRecord };
}

function run(projectRoot, opts = {}) {
  const before = detect(projectRoot, opts);
  if (!before.initialized) {
    return {
      ...before,
      applied: false,
      stateWritten: false,
      contextResults: [],
      reason: '.godpowers/state.json not found'
    };
  }

  const current = state.read(projectRoot);
  const now = opts.now || new Date().toISOString();
  const stateResult = applyStateAwareness(projectRoot, current, before.runtimeVersion, now);
  const refreshedState = state.read(projectRoot);
  const shouldRefreshContext = opts.refreshContext !== false;
  const contextResults = shouldRefreshContext
    ? contextWriter.apply(projectRoot, refreshedState, { projectRoot })
    : [];
  const after = detect(projectRoot, opts);

  return {
    ...after,
    applied: true,
    stateWritten: stateResult.written,
    contextResults,
    stateRecord: stateResult.record
  };
}

module.exports = {
  FEATURE_SET_VERSION,
  FEATURES,
  packageVersion,
  detect,
  run
};
