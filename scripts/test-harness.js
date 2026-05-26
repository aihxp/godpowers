/**
 * Shared test harness for Godpowers unit tests.
 *
 * Provides test(), assert(), mkProject(), and cleanup utilities so
 * individual test files don't re-implement the same boilerplate.
 *
 * Usage:
 *   const { test, assert, mkProject, cleanup, report } = require('./test-harness');
 *   test('my test', () => { assert(1 === 1, 'math works'); });
 *   report('My module tests');
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

let passed = 0;
let failed = 0;
const tmpDirs = [];

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

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function mkProject(prefix) {
  prefix = prefix || 'godpowers-test-';
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(tmp, '.godpowers'), { recursive: true });
  tmpDirs.push(tmp);
  return tmp;
}

function writeRel(root, relPath, text) {
  const file = path.join(root, relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function cleanup() {
  for (const dir of tmpDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (_) {
      // best-effort cleanup
    }
  }
  tmpDirs.length = 0;
}

function report(label) {
  cleanup();
  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

function getCounters() {
  return { passed, failed };
}

module.exports = { test, assert, mkProject, writeRel, cleanup, report, getCounters };
