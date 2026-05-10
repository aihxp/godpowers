#!/usr/bin/env node
/**
 * Behavioral tests for lib/extensions.js (v0.13 extension runtime).
 *
 * Covers install / list / info / remove / capability handshake.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ext = require('../lib/extensions');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  + ${name}`); passed++; }
  catch (e) { console.error(`  x ${name}: ${e.message}`); failed++; }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function mkRuntime() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-ext-runtime-'));
}

function mkPackSource(name, version, godpowersRange, opts = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-ext-source-'));
  const manifest = [
    'apiVersion: godpowers/v1',
    'kind: Extension',
    'metadata:',
    `  name: ${name}`,
    `  version: ${version}`,
    '  description: test pack',
    'engines:',
    `  godpowers: ${godpowersRange}`,
    'provides:',
    '  skills:',
    '    - god-test-skill',
    ...(opts.extraManifest || [])
  ].join('\n');
  fs.writeFileSync(path.join(tmp, 'manifest.yaml'), manifest);
  if (opts.withSkill !== false) {
    fs.mkdirSync(path.join(tmp, 'skills'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'skills', 'god-test-skill.md'),
      '---\nname: god-test-skill\ndescription: test\n---\n');
  }
  return tmp;
}

console.log('\n  Extensions module tests\n');

// --- isCompatible ----------------------------------------------------

test('isCompatible matches exact', () => {
  assert(ext.isCompatible('0.13.0', '0.13.0') === true);
  assert(ext.isCompatible('0.13.0', '0.13.1') === false);
});

test('isCompatible matches ^x.y.z for major>0', () => {
  assert(ext.isCompatible('^1.2.3', '1.2.3') === true);
  assert(ext.isCompatible('^1.2.3', '1.5.0') === true);
  assert(ext.isCompatible('^1.2.3', '2.0.0') === false);
});

test('isCompatible matches ^0.y.z for major=0', () => {
  assert(ext.isCompatible('^0.13.0', '0.13.5') === true);
  assert(ext.isCompatible('^0.13.0', '0.14.0') === false);
});

test('isCompatible matches >= range', () => {
  assert(ext.isCompatible('>=0.13.0', '0.13.0') === true);
  assert(ext.isCompatible('>=0.13.0', '0.14.5') === true);
  assert(ext.isCompatible('>=0.13.0', '0.12.0') === false);
});

test('isCompatible matches compound range', () => {
  assert(ext.isCompatible('>=0.13.0 <0.14.0', '0.13.5') === true);
  assert(ext.isCompatible('>=0.13.0 <0.14.0', '0.14.0') === false);
});

test('isCompatible matches ~x.y.z', () => {
  assert(ext.isCompatible('~0.13.5', '0.13.7') === true);
  assert(ext.isCompatible('~0.13.5', '0.14.0') === false);
});

// --- parseManifest + validateManifest -------------------------------

test('parseManifest reads a valid manifest', () => {
  const src = mkPackSource('@org/p', '1.0.0', '>=0.13.0');
  const text = fs.readFileSync(path.join(src, 'manifest.yaml'), 'utf8');
  const { manifest, errors } = ext.parseManifest(text);
  assert(errors.length === 0, `parse errors: ${errors}`);
  assert(manifest.metadata.name === '@org/p', `name: ${manifest.metadata.name}`);
});

test('validateManifest accepts a well-formed manifest', () => {
  const src = mkPackSource('@org/p', '1.0.0', '>=0.13.0');
  const text = fs.readFileSync(path.join(src, 'manifest.yaml'), 'utf8');
  const { manifest } = ext.parseManifest(text);
  const errors = ext.validateManifest(manifest, '0.13.0');
  assert(errors.length === 0, `unexpected errors: ${JSON.stringify(errors)}`);
});

test('validateManifest rejects bad scope name', () => {
  const src = mkPackSource('badname', '1.0.0', '>=0.13.0');
  const { manifest } = ext.parseManifest(
    fs.readFileSync(path.join(src, 'manifest.yaml'), 'utf8')
  );
  const errors = ext.validateManifest(manifest, '0.13.0');
  assert(errors.some(e => /name/.test(e)), `bad name not flagged`);
});

test('validateManifest rejects when engines.godpowers excludes current version', () => {
  const src = mkPackSource('@org/p', '1.0.0', '>=2.0.0');
  const { manifest } = ext.parseManifest(
    fs.readFileSync(path.join(src, 'manifest.yaml'), 'utf8')
  );
  const errors = ext.validateManifest(manifest, '0.13.0');
  assert(errors.some(e => /engines/.test(e)),
    `engines mismatch not flagged: ${JSON.stringify(errors)}`);
});

test('validateManifest rejects bad version format', () => {
  const src = mkPackSource('@org/p', 'v1', '>=0.13.0');
  const { manifest } = ext.parseManifest(
    fs.readFileSync(path.join(src, 'manifest.yaml'), 'utf8')
  );
  const errors = ext.validateManifest(manifest, '0.13.0');
  assert(errors.some(e => /version/.test(e)), `bad version not flagged`);
});

// --- install / list / info / remove ---------------------------------

test('install copies pack to runtime extensions dir', () => {
  const runtime = mkRuntime();
  const src = mkPackSource('@test/p1', '1.0.0', '>=0.13.0');
  const res = ext.install(runtime, src, '0.13.0');
  assert(res.installed, 'not installed');
  const installed = path.join(runtime, 'godpowers-extensions', '@test', 'p1');
  assert(fs.existsSync(path.join(installed, 'manifest.yaml')),
    'manifest not copied');
  assert(fs.existsSync(path.join(installed, 'skills', 'god-test-skill.md')),
    'skill file not copied');
});

test('install throws on capability mismatch', () => {
  const runtime = mkRuntime();
  const src = mkPackSource('@test/p2', '1.0.0', '>=99.0.0');
  try {
    ext.install(runtime, src, '0.13.0');
    throw new Error('install should have thrown');
  } catch (e) {
    assert(/engines/.test(e.message),
      `unexpected error: ${e.message}`);
  }
});

test('install throws on missing manifest', () => {
  const runtime = mkRuntime();
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-bad-'));
  try {
    ext.install(runtime, src, '0.13.0');
    throw new Error('install should have thrown');
  } catch (e) {
    assert(/manifest/.test(e.message),
      `unexpected error: ${e.message}`);
  }
});

test('list returns installed packs', () => {
  const runtime = mkRuntime();
  ext.install(runtime, mkPackSource('@org/a', '1.0.0', '>=0.13.0'), '0.13.0');
  ext.install(runtime, mkPackSource('@org/b', '2.0.0', '>=0.13.0'), '0.13.0');
  const all = ext.list(runtime);
  assert(all.length === 2, `expected 2, got ${all.length}`);
  const names = all.map(e => e.name).sort();
  assert(names[0] === '@org/a' && names[1] === '@org/b',
    `names: ${names}`);
});

test('info returns one pack by name', () => {
  const runtime = mkRuntime();
  ext.install(runtime, mkPackSource('@org/c', '1.0.0', '>=0.13.0'), '0.13.0');
  const got = ext.info(runtime, '@org/c');
  assert(got && got.name === '@org/c', `info wrong: ${JSON.stringify(got)}`);
  assert(got.version === '1.0.0', `version wrong: ${got.version}`);
});

test('info returns null for missing pack', () => {
  const runtime = mkRuntime();
  assert(ext.info(runtime, '@missing/x') === null, 'should be null');
});

test('remove deletes installed pack', () => {
  const runtime = mkRuntime();
  ext.install(runtime, mkPackSource('@org/d', '1.0.0', '>=0.13.0'), '0.13.0');
  const before = ext.list(runtime);
  assert(before.length === 1, `should have 1 installed`);
  const r = ext.remove(runtime, '@org/d');
  assert(r.removed, 'remove returned false');
  const after = ext.list(runtime);
  assert(after.length === 0, `should be empty after remove`);
});

test('remove returns not-installed when pack absent', () => {
  const runtime = mkRuntime();
  const r = ext.remove(runtime, '@missing/x');
  assert(!r.removed, 'should have returned removed=false');
  assert(r.reason === 'not-installed', `reason: ${r.reason}`);
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
