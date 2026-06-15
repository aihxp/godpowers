#!/usr/bin/env node

const fs = require('fs');

const evidence = require('../lib/evidence');
const state = require('../lib/state');
const { test, assert, mkProject, report } = require('./test-harness');

function proj(prefix) {
  const dir = mkProject(prefix);
  state.init(dir, prefix.replace(/[^a-z0-9]+/gi, '-'));
  return dir;
}

test('lesson.add appends a project lesson and lesson.list reads it', () => {
  const dir = proj('godpowers-lesson-add-');
  const record = evidence.lesson.add('guard inputs before parsing', { tags: ['parsing'], projectRoot: dir });
  assert(record.lesson === 'guard inputs before parsing', 'lesson text not recorded');
  assert(record.scope === 'project', `scope: ${record.scope}`);
  assert(record.tags.length === 1 && record.tags[0] === 'parsing', 'tags not recorded');
  assert(fs.existsSync(evidence.lessonsPath(dir, 'project')), 'project lessons.jsonl should be written');

  const list = evidence.lesson.list({ scope: 'project', projectRoot: dir });
  assert(list.length === 1 && list[0].lesson === 'guard inputs before parsing', 'lesson.list did not read the entry');
});

test('lesson.add requires non-empty text and recent limits the list', () => {
  const dir = proj('godpowers-lesson-guard-');
  let threw = false;
  try { evidence.lesson.add('   ', { projectRoot: dir }); } catch (_) { threw = true; }
  assert(threw, 'empty lesson should throw');

  evidence.lesson.add('a', { projectRoot: dir });
  evidence.lesson.add('b', { projectRoot: dir });
  const recent = evidence.lesson.list({ scope: 'project', recent: 1, projectRoot: dir });
  assert(recent.length === 1 && recent[0].lesson === 'b', 'recent should be the last lesson');
});

test('reflect auto-records a project lesson tagged auto-reflected', () => {
  const dir = proj('godpowers-lesson-reflect-');
  const result = evidence.reflect({
    action: 'ran the build',
    outcome: 'failure',
    lesson: 'add a null guard before parsing'
  }, { substep: 'tier-2.build', projectRoot: dir });
  assert(result.lesson && result.lesson.lesson === 'add a null guard before parsing', 'reflect did not return the auto lesson');
  assert(result.lesson.tags.includes('auto-reflected'), 'auto lesson should be tagged auto-reflected');

  const lessons = evidence.lesson.list({ scope: 'project', projectRoot: dir });
  assert(lessons.length === 1 && lessons[0].tags.includes('auto-reflected'), 'auto-reflected lesson not stored');
});

test('reflect without a lesson records no lesson', () => {
  const dir = proj('godpowers-lesson-noreflect-');
  const result = evidence.reflect({ action: 'thinking', outcome: 'partial' }, { projectRoot: dir });
  assert(result.lesson === null, 'no lesson should be recorded');
  assert(evidence.lesson.list({ scope: 'project', projectRoot: dir }).length === 0, 'no lessons should exist');
});

test('lesson.add does not mutate state.json', () => {
  const dir = proj('godpowers-lesson-isolation-');
  const before = JSON.stringify(state.read(dir));
  evidence.lesson.add('isolated lesson', { projectRoot: dir });
  assert(JSON.stringify(state.read(dir)) === before, 'lesson.add must not mutate state.json');
});

report('Lessons store tests');
