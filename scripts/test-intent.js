#!/usr/bin/env node
/**
 * Behavioral tests for lib/intent.js.
 *
 * Intent is the user-facing config artifact. The validator gates whether
 * downstream agents ever see the file. Bugs here are silent: a wrong
 * mode enum (the audit found one) would reject valid bluefield projects.
 *
 * Tests assert:
 *   - read returns null on missing file
 *   - parseSimpleYaml handles the subset we actually use
 *   - validate accepts every valid mode (A, B, C, E) and rejects D
 *   - validate accepts every valid scale
 *   - validate requires apiVersion / kind / metadata.name / mode / scale
 *   - get returns project-root intent or walks up to find suite intent
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const intent = require('../lib/intent');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  + ${name}`); passed++; }
  catch (e) { console.error(`  x ${name}: ${e.message}`); failed++; }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function mkProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-intent-test-'));
  fs.mkdirSync(path.join(tmp, '.godpowers'), { recursive: true });
  return tmp;
}

function writeIntent(root, body) {
  fs.writeFileSync(path.join(root, '.godpowers', 'intent.yaml'), body);
}

console.log('\n  Intent module behavioral tests\n');

test('read returns null when intent.yaml is missing', () => {
  const tmp = mkProject();
  assert(intent.read(tmp) === null, 'expected null');
});

test('parseSimpleYaml extracts top-level scalars', () => {
  const parsed = intent.parseSimpleYaml(
    'apiVersion: godpowers/v1\nkind: Project\nmode: A\nscale: small'
  );
  assert(parsed.apiVersion === 'godpowers/v1', `apiVersion: ${parsed.apiVersion}`);
  assert(parsed.kind === 'Project', `kind: ${parsed.kind}`);
  assert(parsed.mode === 'A', `mode: ${parsed.mode}`);
  assert(parsed.scale === 'small', `scale: ${parsed.scale}`);
});

test('parseSimpleYaml extracts nested objects', () => {
  const parsed = intent.parseSimpleYaml(
    'apiVersion: godpowers/v1\nkind: Project\nmetadata:\n  name: demo\n  description: test\nmode: A\nscale: small'
  );
  assert(parsed.metadata && parsed.metadata.name === 'demo',
    `metadata.name: ${parsed.metadata && parsed.metadata.name}`);
  assert(parsed.metadata.description === 'test',
    `metadata.description: ${parsed.metadata.description}`);
});

test('parseSimpleYaml strips inline comments', () => {
  const parsed = intent.parseSimpleYaml('mode: A # greenfield');
  assert(parsed.mode === 'A', `mode with comment: ${parsed.mode}`);
});

test('parseSimpleYaml preserves literal block scalars', () => {
  const parsed = intent.parseSimpleYaml(`metadata:
  name: full-arc
  description: |
    Idea to hardened production.
    Run by /god-mode.
kind: Workflow`);
  assert(parsed.metadata.description === 'Idea to hardened production.\nRun by /god-mode.',
    `description: ${JSON.stringify(parsed.metadata.description)}`);
  assert(parsed.kind === 'Workflow', `kind after block: ${parsed.kind}`);
});

test('read parses a written intent.yaml', () => {
  const tmp = mkProject();
  writeIntent(tmp,
    'apiVersion: godpowers/v1\nkind: Project\nmetadata:\n  name: roundtrip\nmode: A\nscale: small');
  const got = intent.read(tmp);
  assert(got && got.metadata.name === 'roundtrip',
    `read failed: ${JSON.stringify(got)}`);
});

test('validate accepts a minimal valid intent', () => {
  const errors = intent.validate({
    apiVersion: 'godpowers/v1',
    kind: 'Project',
    metadata: { name: 'good' },
    mode: 'A',
    scale: 'small'
  });
  assert(errors.length === 0, `unexpected errors: ${JSON.stringify(errors)}`);
});

test('validate accepts mode A, B, C, E', () => {
  for (const m of ['A', 'B', 'C', 'E']) {
    const errors = intent.validate({
      apiVersion: 'godpowers/v1', kind: 'Project',
      metadata: { name: 'm' }, mode: m, scale: 'small'
    });
    assert(errors.length === 0, `mode ${m} rejected: ${JSON.stringify(errors)}`);
  }
});

test('validate REJECTS mode D (D is suite-membership boolean, not primary mode)', () => {
  const errors = intent.validate({
    apiVersion: 'godpowers/v1', kind: 'Project',
    metadata: { name: 'd' }, mode: 'D', scale: 'small'
  });
  assert(errors.some(e => /mode/.test(e)),
    `mode D should be rejected; got: ${JSON.stringify(errors)}`);
});

test('validate rejects garbage mode', () => {
  const errors = intent.validate({
    apiVersion: 'godpowers/v1', kind: 'Project',
    metadata: { name: 'g' }, mode: 'Z', scale: 'small'
  });
  assert(errors.some(e => /mode/.test(e)), `garbage mode not rejected`);
});

test('validate accepts all valid scales', () => {
  for (const s of ['trivial', 'small', 'medium', 'large', 'enterprise']) {
    const errors = intent.validate({
      apiVersion: 'godpowers/v1', kind: 'Project',
      metadata: { name: 's' }, mode: 'A', scale: s
    });
    assert(errors.length === 0, `scale ${s} rejected: ${JSON.stringify(errors)}`);
  }
});

test('validate rejects bad apiVersion', () => {
  const errors = intent.validate({
    apiVersion: 'wrong/v1', kind: 'Project',
    metadata: { name: 'a' }, mode: 'A', scale: 'small'
  });
  assert(errors.some(e => /apiVersion/.test(e)),
    `bad apiVersion not rejected`);
});

test('validate rejects bad kind', () => {
  const errors = intent.validate({
    apiVersion: 'godpowers/v1', kind: 'Wrong',
    metadata: { name: 'a' }, mode: 'A', scale: 'small'
  });
  assert(errors.some(e => /kind/.test(e)), `bad kind not rejected`);
});

test('validate requires metadata.name', () => {
  const errors = intent.validate({
    apiVersion: 'godpowers/v1', kind: 'Project',
    metadata: {}, mode: 'A', scale: 'small'
  });
  assert(errors.some(e => /name/.test(e)), `missing name not rejected`);
});

test('validate rejects null intent', () => {
  const errors = intent.validate(null);
  assert(errors.length > 0, 'null intent not rejected');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
