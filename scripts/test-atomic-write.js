#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const atomic = require('../lib/atomic-write');
const state = require('../lib/state');
const { test, asyncTest, assert, mkProject, report } = require('./test-harness');

test('writeFileAtomic keeps prior content when validation fails', () => {
  const tmp = mkProject('godpowers-atomic-write-');
  const file = path.join(tmp, '.godpowers', 'sample.txt');
  fs.writeFileSync(file, 'original\n');
  try {
    atomic.writeFileAtomic(file, 'next\n', {
      validateContent: () => { throw new Error('invalid'); }
    });
  } catch (_) {
    // expected
  }
  assert(fs.readFileSync(file, 'utf8') === 'original\n', 'original content changed');
});

test('writeJsonAtomic refuses invalid validation without corrupting file', () => {
  const tmp = mkProject('godpowers-atomic-json-');
  const file = path.join(tmp, '.godpowers', 'state.json');
  fs.writeFileSync(file, '{"ok":true}\n');
  try {
    atomic.writeJsonAtomic(file, { ok: false }, {
      validateContent: () => { throw new Error('nope'); }
    });
  } catch (_) {
    // expected
  }
  assert(JSON.parse(fs.readFileSync(file, 'utf8')).ok === true, 'json content changed');
});

test('state.write uses atomic json and still round-trips', () => {
  const tmp = mkProject('godpowers-state-atomic-');
  state.init(tmp, 'demo');
  const read = state.read(tmp);
  assert(read.project.name === 'demo', 'state did not round-trip');
});

asyncTest('writeJsonAtomicAsync round-trips', async () => {
  const tmp = mkProject('godpowers-atomic-async-');
  const file = path.join(tmp, '.godpowers', 'async.json');
  await atomic.writeJsonAtomicAsync(file, { ok: true });
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert(parsed.ok === true, 'async json did not write');
});

report('Atomic write behavioral tests');
