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

test('memory.set stores and get retrieves an entry', () => {
  const dir = proj('godpowers-memory-set-');
  const entry = evidence.memory.set('db', 'postgres', { category: 'decision', projectRoot: dir });
  assert(entry.key === 'db' && entry.value === 'postgres', 'set returned wrong entry');
  assert(entry.category === 'decision', `category: ${entry.category}`);
  assert(fs.existsSync(evidence.memoryPath(dir)), 'memory.json should be written');

  const got = evidence.memory.get('db', { projectRoot: dir });
  assert(got && got.value === 'postgres', 'get did not return the value');
  assert(evidence.memory.get('missing', { projectRoot: dir }) === null, 'missing key should be null');
});

test('memory.set upserts an existing key and defaults the category', () => {
  const dir = proj('godpowers-memory-upsert-');
  evidence.memory.set('db', 'postgres', { projectRoot: dir });
  evidence.memory.set('db', 'sqlite', { projectRoot: dir });
  const list = evidence.memory.list({ projectRoot: dir });
  assert(list.length === 1, `upsert should not duplicate: ${list.length}`);
  assert(list[0].value === 'sqlite', 'upsert should replace the value');
  assert(list[0].category === 'fact', `default category: ${list[0].category}`);
});

test('memory.list filters by category', () => {
  const dir = proj('godpowers-memory-list-');
  evidence.memory.set('a', '1', { category: 'fact', projectRoot: dir });
  evidence.memory.set('b', '2', { category: 'decision', projectRoot: dir });
  assert(evidence.memory.list({ projectRoot: dir }).length === 2, 'list all');
  const decisions = evidence.memory.list({ category: 'decision', projectRoot: dir });
  assert(decisions.length === 1 && decisions[0].key === 'b', 'category filter');
});

test('memory.clear removes a key or all entries', () => {
  const dir = proj('godpowers-memory-clear-');
  evidence.memory.set('a', '1', { projectRoot: dir });
  evidence.memory.set('b', '2', { projectRoot: dir });
  const one = evidence.memory.clear('a', { projectRoot: dir });
  assert(one.removed === 1, `clear key removed: ${one.removed}`);
  assert(evidence.memory.list({ projectRoot: dir }).length === 1, 'one entry should remain');
  const all = evidence.memory.clear(undefined, { projectRoot: dir });
  assert(all.removed === 1, `clear all removed: ${all.removed}`);
  assert(evidence.memory.list({ projectRoot: dir }).length === 0, 'all entries cleared');
});

test('memory.set requires a non-empty key and does not mutate state.json', () => {
  const dir = proj('godpowers-memory-guard-');
  let threw = false;
  try { evidence.memory.set('', 'x', { projectRoot: dir }); } catch (_) { threw = true; }
  assert(threw, 'empty key should throw');
  const before = JSON.stringify(state.read(dir));
  evidence.memory.set('k', 'v', { projectRoot: dir });
  assert(JSON.stringify(state.read(dir)) === before, 'memory must not mutate state.json');
});

report('Memory store tests');
