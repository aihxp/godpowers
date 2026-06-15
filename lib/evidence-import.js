/**
 * One-time importer for existing Mythify .mythify/ ledgers.
 *
 * Optional, best-effort, additive: it copies an existing Mythify state dir into
 * the Godpowers ledger, rebinding the Mythify plan/step context to Godpowers'
 * arc/substep on each record. It appends to the ledger and does NOT roll up into
 * state.json or emit gate events; this is a historical import, not a re-run.
 *
 * See docs/FUSION-ARCHITECTURE.md (Phase 3, optional importer).
 */

const fs = require('fs');
const path = require('path');

const atomic = require('./atomic-write');
const evidence = require('./evidence');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return null;
  }
}

/**
 * Rebind a Mythify record's plan/step context to Godpowers' arc/substep.
 * Records that already carry arc/substep pass through unchanged.
 */
function rebindRecord(record) {
  if (!record || typeof record !== 'object') return record;
  const hasMythifyContext = 'plan' in record || 'step_id' in record
    || 'step_title' in record || 'step_status' in record;
  if (!hasMythifyContext) return { ...record };
  const out = { ...record };
  out.arc = record.arc !== undefined ? record.arc : (record.plan !== undefined ? record.plan : null);
  out.substep = record.substep !== undefined ? record.substep : (record.step_id !== undefined ? record.step_id : null);
  out.substep_status = record.substep_status !== undefined
    ? record.substep_status
    : (record.step_status !== undefined ? record.step_status : null);
  delete out.plan;
  delete out.step_id;
  delete out.step_title;
  delete out.step_status;
  return out;
}

/**
 * Import an existing .mythify/ ledger into the Godpowers ledger.
 *
 * @param {{ source?: string, projectRoot?: string }} [opts]
 * @returns {{ source: string, projectRoot: string, found: boolean,
 *   imported: { verifications: number, reflections: number, memory: number, lessons: number, outcomes: number },
 *   error?: string }}
 */
function importMythify(opts = {}) {
  const projectRoot = path.resolve(opts.projectRoot || process.cwd());
  const source = path.resolve(opts.source || path.join(projectRoot, '.mythify'));
  const result = {
    source,
    projectRoot,
    found: false,
    imported: { verifications: 0, reflections: 0, memory: 0, lessons: 0, outcomes: 0 }
  };
  if (!fs.existsSync(source)) {
    result.error = 'source-not-found';
    return result;
  }
  result.found = true;

  // Verifications (rebind plan/step -> arc/substep).
  for (const record of evidence.readJsonl(path.join(source, 'verifications.jsonl'))) {
    evidence.appendJsonlAtomic(evidence.verificationsPath(projectRoot), rebindRecord(record));
    result.imported.verifications += 1;
  }

  // Reflections (rebind for any bound context; mostly pass-through).
  for (const record of evidence.readJsonl(path.join(source, 'reflections.jsonl'))) {
    evidence.appendJsonlAtomic(evidence.reflectionsPath(projectRoot), rebindRecord(record));
    result.imported.reflections += 1;
  }

  // Memory (merge entries by key).
  const sourceMemory = readJson(path.join(source, 'memory.json'));
  if (sourceMemory && Array.isArray(sourceMemory.entries) && sourceMemory.entries.length > 0) {
    const dest = readJson(evidence.memoryPath(projectRoot)) || { entries: [], metadata: {} };
    if (!Array.isArray(dest.entries)) dest.entries = [];
    for (const entry of sourceMemory.entries) {
      if (!entry || typeof entry.key !== 'string') continue;
      const idx = dest.entries.findIndex((existing) => existing && existing.key === entry.key);
      if (idx >= 0) dest.entries[idx] = entry;
      else dest.entries.push(entry);
      result.imported.memory += 1;
    }
    dest.metadata = dest.metadata || {};
    dest.metadata.total_entries = dest.entries.length;
    fs.mkdirSync(evidence.ledgerDir(projectRoot), { recursive: true });
    atomic.writeJsonAtomic(evidence.memoryPath(projectRoot), dest);
  }

  // Lessons (Mythify lessons/*.json -> our lessons.jsonl).
  const lessonsDir = path.join(source, 'lessons');
  if (fs.existsSync(lessonsDir)) {
    for (const name of fs.readdirSync(lessonsDir).filter((n) => n.endsWith('.json'))) {
      const lesson = readJson(path.join(lessonsDir, name));
      if (lesson) {
        evidence.appendJsonlAtomic(evidence.lessonsPath(projectRoot, 'project'), lesson);
        result.imported.lessons += 1;
      }
    }
  }

  // Outcomes (copy goal.json + iterations.jsonl per slug).
  const outcomesDir = path.join(source, 'outcomes');
  if (fs.existsSync(outcomesDir)) {
    for (const slug of fs.readdirSync(outcomesDir)) {
      const srcGoal = path.join(outcomesDir, slug, 'goal.json');
      if (!fs.existsSync(srcGoal)) continue;
      const destDir = path.join(evidence.ledgerDir(projectRoot), 'outcomes', slug);
      fs.mkdirSync(destDir, { recursive: true });
      atomic.writeFileAtomic(path.join(destDir, 'goal.json'), fs.readFileSync(srcGoal, 'utf8'));
      const srcIters = path.join(outcomesDir, slug, 'iterations.jsonl');
      if (fs.existsSync(srcIters)) {
        atomic.writeFileAtomic(path.join(destDir, 'iterations.jsonl'), fs.readFileSync(srcIters, 'utf8'));
      }
      result.imported.outcomes += 1;
    }
  }

  return result;
}

function render(result) {
  const lines = ['Godpowers Ledger Import', ''];
  lines.push(`Source: ${result.source}`);
  if (!result.found) {
    lines.push('');
    lines.push('No .mythify/ ledger found at the source. Pass --from <path>.');
    return lines.join('\n');
  }
  const i = result.imported;
  lines.push(`Imported: ${i.verifications} verification(s), ${i.reflections} reflection(s), ${i.memory} memory entr(ies), ${i.lessons} lesson(s), ${i.outcomes} outcome(s)`);
  lines.push('Records were appended to the Godpowers ledger (no state rollup, no gate events).');
  return lines.join('\n');
}

module.exports = { importMythify, rebindRecord, render };
