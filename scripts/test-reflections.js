#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const evidence = require('../lib/evidence');
const state = require('../lib/state');
const events = require('../lib/events');
const { test, assert, mkProject, report } = require('./test-harness');

function proj(prefix) {
  const dir = mkProject(prefix);
  state.init(dir, prefix.replace(/[^a-z0-9]+/gi, '-'));
  return dir;
}

function reflectionLines(dir) {
  const file = path.join(dir, '.godpowers', 'ledger', 'reflections.jsonl');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
}

test('reflect records a structured reflection with substep context', () => {
  const dir = proj('godpowers-reflect-basic-');
  const result = evidence.reflect({
    action: 'ran the build',
    outcome: 'failure',
    observation: 'two tests failed',
    rootCause: 'null pointer in parser',
    next: 'fix the parser guard',
    lesson: 'guard inputs before parsing'
  }, { substep: 'tier-2.build', projectRoot: dir });

  assert(result.record.action === 'ran the build', 'action not recorded');
  assert(result.record.outcome === 'failure', `outcome: ${result.record.outcome}`);
  assert(result.record.root_cause === 'null pointer in parser', 'root_cause mapping wrong');
  assert(result.record.next === 'fix the parser guard', 'next not recorded');
  assert(result.record.lesson === 'guard inputs before parsing', 'lesson not recorded');
  assert(result.record.substep === 'tier-2.build', `substep: ${result.record.substep}`);

  const lines = reflectionLines(dir);
  assert(lines.length === 1 && lines[0].action === 'ran the build', 'reflection not appended to jsonl');
});

test('reflect defaults an unknown outcome to partial and requires an action', () => {
  const dir = proj('godpowers-reflect-defaults-');
  const result = evidence.reflect({ action: 'tried something', outcome: 'banana' }, { projectRoot: dir });
  assert(result.record.outcome === 'partial', `outcome default: ${result.record.outcome}`);
  assert(result.record.observation === null && result.record.next === null, 'optional fields should be null');

  let threw = false;
  try { evidence.reflect({ action: '   ' }, { projectRoot: dir }); } catch (_) { threw = true; }
  assert(threw, 'empty action should throw');
});

test('reflections filters by substep and limits to recent', () => {
  const dir = proj('godpowers-reflect-list-');
  evidence.reflect({ action: 'a', outcome: 'success' }, { substep: 'tier-2.build', projectRoot: dir });
  evidence.reflect({ action: 'b', outcome: 'partial' }, { substep: 'tier-2.build', projectRoot: dir });
  evidence.reflect({ action: 'c', outcome: 'failure' }, { substep: 'tier-1.prd', projectRoot: dir });

  assert(evidence.reflections({ projectRoot: dir }).length === 3, 'all reflections');
  const build = evidence.reflections({ substep: 'tier-2.build', projectRoot: dir });
  assert(build.length === 2, `build reflections: ${build.length}`);
  const recent = evidence.reflections({ substep: 'tier-2.build', recent: 1, projectRoot: dir });
  assert(recent.length === 1 && recent[0].action === 'b', 'recent should be the last build reflection');
});

test('reflect does not touch state.json, verifications, or the event stream', () => {
  const dir = proj('godpowers-reflect-isolation-');
  const before = JSON.stringify(state.read(dir));
  evidence.reflect({ action: 'thinking', outcome: 'partial' }, { substep: 'tier-2.build', projectRoot: dir });
  assert(JSON.stringify(state.read(dir)) === before, 'reflect must not mutate state.json');
  assert(evidence.read(dir).length === 0, 'reflect must not write the verifications ledger');
  assert(events.listRuns(dir).length === 0, 'reflect must not emit a gate event');
});

report('Reflections tests');
