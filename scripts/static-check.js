#!/usr/bin/env node
/**
 * Dependency-free static checks for release-sensitive JavaScript surfaces.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHECK_DIRS = ['bin', 'lib', 'scripts', 'tests'];

let passed = 0;
let failed = 0;

function pass(name) {
  console.log(`  + ${name}`);
  passed++;
}

function fail(name, message) {
  console.error(`  x ${name}: ${message}`);
  failed++;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

function test(name, fn) {
  try {
    fn();
    pass(name);
  } catch (e) {
    fail(name, e.message);
  }
}

console.log('\n  Static checks\n');

const jsFiles = CHECK_DIRS.flatMap(dir => walk(path.join(ROOT, dir))).sort();

test('JavaScript files parse with node --check', () => {
  for (const file of jsFiles) {
    const result = spawnSync(process.execPath, ['--check', file], {
      cwd: ROOT,
      encoding: 'utf8'
    });
    if (result.status !== 0) {
      throw new Error(`${path.relative(ROOT, file)} failed syntax check\n${result.stderr || result.stdout}`);
    }
  }
});

test('package test script delegates to scripts/run-tests.js', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  if (pkg.scripts.test !== 'node scripts/run-tests.js') {
    throw new Error(`unexpected test script: ${pkg.scripts.test}`);
  }
});

test('full test runner includes YAML parser coverage', () => {
  const runner = require('./run-tests');
  const commands = runner.TEST_COMMANDS.map(([command, args]) => [command, ...args].join(' '));
  if (!commands.some(command => command.includes('scripts/test-yaml-parser.js'))) {
    throw new Error('scripts/test-yaml-parser.js is missing from TEST_COMMANDS');
  }
});

test('install file helpers stay outside bin/install.js', () => {
  const installer = fs.readFileSync(path.join(ROOT, 'bin', 'install.js'), 'utf8');
  if (!installer.includes("require('../lib/installer-files')")) {
    throw new Error('bin/install.js does not import installer file helpers');
  }
  if (/function\s+copyRecursive\s*\(/.test(installer)) {
    throw new Error('copyRecursive should live in lib/installer-files.js');
  }
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
