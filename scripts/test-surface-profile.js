#!/usr/bin/env node
/**
 * Surface profile preview and apply tests.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const surfaceProfile = require('../lib/surface-profile');
const { test, assert, report } = require('./test-harness');

const ROOT = path.resolve(__dirname, '..');
const INSTALLER = path.join(ROOT, 'bin', 'install.js');

console.log('\n  Surface profile tests\n');

test('plan previews selected profile against installed skills', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-surface-plan-'));
  const cwd = process.cwd();
  try {
    process.chdir(tmp);
    cp.execFileSync(process.execPath, [INSTALLER, '--codex', '--local', '--profile=core'], {
      encoding: 'utf8',
      timeout: 30_000
    });

    const report = surfaceProfile.plan(ROOT, {
      runtimes: ['codex'],
      local: true,
      profile: 'builder'
    });

    assert(report.profile === 'builder', `profile: ${report.profile}`);
    assert(report.targets.length === 1, `targets: ${report.targets.length}`);
    assert(report.targets[0].currentProfile === 'core', `current: ${report.targets[0].currentProfile}`);
    assert(report.targets[0].selectedCount > report.targets[0].currentCount,
      `selected ${report.targets[0].selectedCount}, current ${report.targets[0].currentCount}`);
    assert(report.targets[0].add.includes('god-feature'), 'builder preview should add god-feature');
  } finally {
    process.chdir(cwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('render shows dry-run next command before applying', () => {
  const report = {
    profile: 'builder',
    description: 'builder: test profile',
    mode: 'dry-run',
    selectedCount: 3,
    availableCount: 5,
    targets: [{
      key: 'codex',
      name: 'Codex',
      currentProfile: 'core',
      selectedCount: 3,
      skillsDir: '/tmp/example/.codex/skills',
      add: ['god-feature'],
      remove: []
    }]
  };
  const rendered = surfaceProfile.render(report);
  assert(rendered.includes('Godpowers Surface'), 'missing title');
  assert(rendered.includes('Mode: dry-run'), 'missing mode');
  assert(rendered.includes('--apply'), 'missing apply command');
});

test('CLI surface command emits JSON preview', () => {
  const out = cp.execFileSync(process.execPath, [
    INSTALLER,
    'surface',
    '--profile=core',
    '--codex',
    '--json'
  ], {
    encoding: 'utf8',
    timeout: 30_000
  });
  const parsed = JSON.parse(out);
  assert(parsed.profile === 'core', `profile: ${parsed.profile}`);
  assert(parsed.targets.length === 1, `targets: ${parsed.targets.length}`);
});

report('Surface profile tests');
