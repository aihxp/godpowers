#!/usr/bin/env node
/**
 * Behavioral tests for route, recipe, and release automation sync helpers.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const routeQualitySync = require('../lib/route-quality-sync');
const recipeCoverageSync = require('../lib/recipe-coverage-sync');
const releaseSurfaceSync = require('../lib/release-surface-sync');

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

function writeRel(root, relPath, text) {
  const file = path.join(root, relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function fixture() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-automation-surface-'));
  writeRel(tmp, 'package.json', JSON.stringify({ name: 'godpowers', version: '9.0.0' }, null, 2));
  writeRel(tmp, 'package-lock.json', JSON.stringify({ name: 'godpowers', version: '9.0.0' }, null, 2));
  writeRel(tmp, 'README.md', '[![Version](https://img.shields.io/badge/version-9.0.0-blue)](CHANGELOG.md)\n');
  writeRel(tmp, 'CHANGELOG.md', '## [9.0.0] - 2026-05-16\n');
  writeRel(tmp, 'RELEASE.md', '# Godpowers 9.0.0 Release\n');
  writeRel(tmp, 'docs/RELEASE-CHECKLIST.md', [
    '- Confirm route-quality-sync is fresh.',
    '- Confirm recipe-coverage-sync is fresh.',
    '- Confirm release-surface-sync is fresh.'
  ].join('\n'));
  writeRel(tmp, 'scripts/check-package-contents.js', [
    "'lib/route-quality-sync.js'",
    "'lib/recipe-coverage-sync.js'",
    "'lib/release-surface-sync.js'"
  ].join('\n'));
  writeRel(tmp, 'agents/god-planner.md', '---\nname: god-planner\n---\n');
  writeRel(tmp, 'agents/god-executor.md', '---\nname: god-executor\n---\n');
  writeRel(tmp, 'agents/god-spec-reviewer.md', '---\nname: god-spec-reviewer\n---\n');
  writeRel(tmp, 'agents/god-quality-reviewer.md', '---\nname: god-quality-reviewer\n---\n');
  writeRel(tmp, 'agents/god-writer.md', '---\nname: god-writer\n---\n');
  writeRel(tmp, 'routing/god-story-build.yaml', [
    'apiVersion: godpowers/v1',
    'kind: CommandRouting',
    'metadata:',
    '  command: /god-story-build',
    'execution:',
    '  spawns: [god-planner+god-executor+reviewers]',
    'success-path:',
    '  next-recommended: /god-story-verify'
  ].join('\n'));
  writeRel(tmp, 'routing/god-docs.yaml', [
    'apiVersion: godpowers/v1',
    'kind: CommandRouting',
    'metadata:',
    '  command: /god-docs',
    'execution:',
    '  spawns: [built-in]',
    'success-path:',
    '  next-recommended: /god-status'
  ].join('\n'));
  writeRel(tmp, 'routing/god-write.yaml', [
    'apiVersion: godpowers/v1',
    'kind: CommandRouting',
    'metadata:',
    '  command: /god-write',
    'execution:',
    '  spawns: [god-writer]',
    '  writes:',
    '    - .godpowers/write/REPORT.md',
    'success-path:',
    '  next-recommended: /god-status'
  ].join('\n'));
  writeRel(tmp, 'routing/recipes/docs-drift.yaml', [
    'apiVersion: godpowers/v1',
    'kind: Recipe',
    'metadata:',
    '  name: docs-drift',
    '  category: maintaining',
    'sequences:',
    '  default:',
    '    steps:',
    '      - command: "/god-docs"'
  ].join('\n'));
  return tmp;
}

console.log('\n  Automation surface sync behavioral tests\n');

test('route quality sync rejects symbolic spawn tokens', () => {
  const tmp = fixture();
  const report = routeQualitySync.detect(tmp);
  assert.equal(report.status, 'stale');
  assert(report.stale.some((check) => check.id.startsWith('symbolic-spawn')));
  assert(report.stale.some((check) => check.id.startsWith('missing-standards')));
});

test('recipe coverage sync finds missing high-frequency recipes', () => {
  const tmp = fixture();
  const report = recipeCoverageSync.detect(tmp);
  assert.equal(report.status, 'stale');
  assert(report.stale.some((check) => check.id === 'coverage-story-work'));
  assert(report.stale.some((check) => check.id === 'coverage-automation-setup'));
});

test('release surface sync catches missing package guardrails', () => {
  const tmp = fixture();
  writeRel(tmp, 'scripts/check-package-contents.js', "'lib/route-quality-sync.js'\n");
  const report = releaseSurfaceSync.detect(tmp);
  assert.equal(report.status, 'stale');
  assert(report.stale.some((check) => check.id.includes('recipe-coverage-sync')));
});

test('current repository automation surfaces are fresh', () => {
  const projectRoot = path.resolve(__dirname, '..');
  assert.equal(routeQualitySync.detect(projectRoot).status, 'fresh');
  assert.equal(recipeCoverageSync.detect(projectRoot).status, 'fresh');
  assert.equal(releaseSurfaceSync.detect(projectRoot).status, 'fresh');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
