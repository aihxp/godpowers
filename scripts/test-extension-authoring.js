#!/usr/bin/env node
/**
 * Behavioral tests for lib/extension-authoring.js.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const authoring = require('../lib/extension-authoring');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  + ${name}`);
    passed++;
  } catch (e) {
    console.error(`  x ${name}: ${e.message}`);
    failed++;
  }
}

console.log('\n  Extension authoring behavioral tests\n');

test('scaffold creates publishable extension files', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-ext-author-'));
  const result = authoring.scaffold(tmp, {
    name: '@godpowers/example-pack',
    skill: 'god-example',
    agent: 'god-example-agent',
    workflow: 'example-flow',
    runtimeVersion: '1.6.0'
  });
  assert.equal(result.validation.length, 0);
  assert(fs.existsSync(path.join(result.path, 'manifest.yaml')));
  assert(fs.existsSync(path.join(result.path, 'package.json')));
  assert(fs.existsSync(path.join(result.path, 'README.md')));
  assert(fs.existsSync(path.join(result.path, 'skills', 'god-example.md')));
  assert(fs.existsSync(path.join(result.path, 'agents', 'god-example-agent.md')));
  assert(fs.existsSync(path.join(result.path, 'workflows', 'example-flow.yaml')));
});

test('scaffold does not overwrite files unless requested', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-ext-author-'));
  const first = authoring.scaffold(tmp, { name: '@godpowers/no-overwrite', runtimeVersion: '1.6.0' });
  fs.writeFileSync(path.join(first.path, 'README.md'), '# custom\n');
  const second = authoring.scaffold(tmp, { name: '@godpowers/no-overwrite', runtimeVersion: '1.6.0' });
  assert(!second.written.includes('README.md'));
  assert.equal(fs.readFileSync(path.join(first.path, 'README.md'), 'utf8'), '# custom\n');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
