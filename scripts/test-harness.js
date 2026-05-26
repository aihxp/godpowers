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
const pending = [];

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

async function asyncTest(name, fn) {
  const run = (async () => {
    try {
      await fn();
      console.log(`  + ${name}`);
      passed++;
    } catch (e) {
      console.error(`  x ${name}: ${e.message}`);
      failed++;
    }
  })();
  pending.push(run);
  return run;
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

function finishReport() {
  cleanup();
  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

function report(label) {
  if (pending.length > 0) {
    return Promise.allSettled(pending).then(finishReport);
  }
  finishReport();
  return undefined;
}

function getCounters() {
  return { passed, failed };
}

module.exports = {
  test,
  asyncTest,
  assert,
  mkProject,
  writeRel,
  cleanup,
  report,
  getCounters
};
