#!/usr/bin/env node

const path = require('path');
const sourceGrounding = require('../lib/source-grounding');
const { test, assert, mkProject, writeRel, report } = require('./test-harness');

test('checkPlan passes grounded files and symbols', () => {
  const tmp = mkProject('godpowers-source-grounding-');
  writeRel(tmp, 'src/auth.js', [
    'function createSession() {',
    '  return true;',
    '}',
    'module.exports = { createSession };',
    ''
  ].join('\n'));
  const plan = [
    '## Existing files',
    '- src/auth.js',
    '## Existing symbols',
    '- createSession',
    '## New artifacts',
    '- src/signup.js',
    ''
  ].join('\n');
  const result = sourceGrounding.checkPlan(tmp, plan);
  assert(result.ok, sourceGrounding.renderReport(result));
  assert(result.summary.pass === 2, `pass count: ${result.summary.pass}`);
  assert(result.summary.declaredNew === 1, `declared new: ${result.summary.declaredNew}`);
});

test('checkPlan fails missing existing file and symbol', () => {
  const tmp = mkProject('godpowers-source-grounding-missing-');
  writeRel(tmp, 'src/auth.js', 'module.exports = {};\n');
  const plan = [
    '## Existing files',
    '- src/missing.js',
    '## Existing symbols',
    '- createSession',
    ''
  ].join('\n');
  const result = sourceGrounding.checkPlan(tmp, plan);
  assert(!result.ok, 'expected failure');
  assert(result.failures.length === 2, `failures: ${result.failures.length}`);
});

test('checkPlan reports unchecked references without failing', () => {
  const tmp = mkProject('godpowers-source-grounding-unchecked-');
  const plan = [
    '## Unchecked references',
    '- third-party webhook behavior',
    ''
  ].join('\n');
  const result = sourceGrounding.checkPlan(tmp, plan);
  assert(result.ok, 'unchecked references should warn, not fail');
  assert(result.warnings.length === 1, `warnings: ${result.warnings.length}`);
});

test('listFiles ignores generated and hidden runtime directories', () => {
  const tmp = mkProject('godpowers-source-grounding-ignore-');
  writeRel(tmp, 'src/live.js', 'const live = true;\n');
  writeRel(tmp, 'node_modules/pkg/index.js', 'const ignored = true;\n');
  writeRel(tmp, path.join('.git', 'config'), 'ignored\n');
  const files = sourceGrounding.listFiles(tmp);
  assert(files.includes('src/live.js'), 'live file missing');
  assert(!files.some(file => file.includes('node_modules')), 'node_modules should be ignored');
  assert(!files.some(file => file.startsWith('.git/')), '.git should be ignored');
});

report('Source grounding behavioral tests');
