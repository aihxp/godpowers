#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const importer = require('../lib/evidence-import');
const evidence = require('../lib/evidence');
const state = require('../lib/state');
const { test, assert, mkProject, report } = require('./test-harness');

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function makeMythify(root) {
  const dir = path.join(root, '.mythify');
  writeFile(path.join(dir, 'verifications.jsonl'), [
    JSON.stringify({ kind: 'executed', command: 'npm test', exit_code: 0, verified: true, timestamp: '2026-06-15T10:00:00.000Z', plan: 'feature-arc', step_id: 'build', step_title: 'Build', step_status: 'in_progress' }),
    JSON.stringify({ kind: 'executed', command: 'npm run lint', exit_code: 1, verified: false, timestamp: '2026-06-15T10:05:00.000Z', plan: 'feature-arc', step_id: 'build', step_title: 'Build', step_status: 'in_progress' })
  ].join('\n') + '\n');
  writeFile(path.join(dir, 'reflections.jsonl'),
    JSON.stringify({ action: 'ran build', outcome: 'failure', next: 'fix lint', timestamp: '2026-06-15T10:06:00.000Z' }) + '\n');
  writeFile(path.join(dir, 'memory.json'), JSON.stringify({
    entries: [{ key: 'db', value: 'postgres', category: 'decision', updated: '2026-06-15T09:00:00.000Z' }],
    metadata: { total_entries: 1 }
  }));
  writeFile(path.join(dir, 'lessons', 'guard.json'), JSON.stringify({ lesson: 'guard inputs', tags: ['parsing'], scope: 'project', timestamp: '2026-06-15T09:30:00.000Z' }));
  writeFile(path.join(dir, 'outcomes', 'green-build', 'goal.json'), JSON.stringify({ slug: 'green-build', status: 'failed', budget: 2, iterations: 2 }));
  writeFile(path.join(dir, 'outcomes', 'green-build', 'iterations.jsonl'),
    JSON.stringify({ iteration: 1, verified: false }) + '\n' + JSON.stringify({ iteration: 2, verified: false }) + '\n');
  return dir;
}

test('rebindRecord maps plan/step to arc/substep and drops the old keys', () => {
  const out = importer.rebindRecord({ command: 'x', plan: 'feature-arc', step_id: 'build', step_title: 'Build', step_status: 'in_progress' });
  assert(out.arc === 'feature-arc' && out.substep === 'build' && out.substep_status === 'in_progress', 'rebind mapping wrong');
  assert(!('plan' in out) && !('step_id' in out) && !('step_title' in out) && !('step_status' in out), 'old keys not dropped');
  // A record already in Godpowers shape is unchanged.
  const passthrough = importer.rebindRecord({ command: 'y', substep: 'tier-2.build' });
  assert(passthrough.substep === 'tier-2.build', 'godpowers-shape record should pass through');
});

test('importMythify imports verifications, reflections, memory, lessons, and outcomes', () => {
  const project = mkProject('godpowers-import-');
  state.init(project, 'import-demo');
  makeMythify(project);

  const result = importer.importMythify({ projectRoot: project });
  assert(result.found === true, 'source should be found');
  assert(result.imported.verifications === 2, `verifications: ${result.imported.verifications}`);
  assert(result.imported.reflections === 1, `reflections: ${result.imported.reflections}`);
  assert(result.imported.memory === 1, `memory: ${result.imported.memory}`);
  assert(result.imported.lessons === 1, `lessons: ${result.imported.lessons}`);
  assert(result.imported.outcomes === 1, `outcomes: ${result.imported.outcomes}`);

  // Verifications were rebound to arc/substep in the Godpowers ledger.
  const ledger = evidence.read(project);
  assert(ledger.length === 2, `ledger count: ${ledger.length}`);
  assert(ledger[0].substep === 'build' && ledger[0].arc === 'feature-arc', 'verification not rebound');
  assert(!('step_id' in ledger[0]), 'step_id should be dropped on import');

  // Memory merged.
  const mem = evidence.memory.get('db', { projectRoot: project });
  assert(mem && mem.value === 'postgres', 'memory not imported');

  // Lessons appended.
  assert(evidence.lesson.list({ scope: 'project', projectRoot: project }).length === 1, 'lesson not imported');

  // Outcome copied.
  const status = evidence.outcome.status('green-build', { projectRoot: project });
  assert(status && status.goal.status === 'failed' && status.iterations.length === 2, 'outcome not copied');
});

test('importMythify reports a missing source without throwing', () => {
  const project = mkProject('godpowers-import-missing-');
  state.init(project, 'import-missing');
  const result = importer.importMythify({ projectRoot: project, source: path.join(project, 'nope') });
  assert(result.found === false && result.error === 'source-not-found', `result: ${JSON.stringify(result)}`);
});

test('importMythify does not mutate state.json', () => {
  const project = mkProject('godpowers-import-readonly-');
  state.init(project, 'import-readonly');
  makeMythify(project);
  const before = JSON.stringify(state.read(project));
  importer.importMythify({ projectRoot: project });
  assert(JSON.stringify(state.read(project)) === before, 'import must not mutate state.json');
});

report('Evidence import tests');
