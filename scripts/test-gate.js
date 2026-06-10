#!/usr/bin/env node
/**
 * Tests for executable tier gates.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const gate = require('../lib/gate');
const { test, asyncTest, assert, mkProject, writeRel, report } = require('./test-harness');

const ROOT = path.resolve(__dirname, '..');

console.log('\n  Gate tests\n');

function fixture(relPath) {
  return path.join(ROOT, relPath);
}

function runCli(args, cwd = ROOT) {
  return cp.spawnSync(process.execPath, ['bin/install.js', ...args], {
    cwd,
    encoding: 'utf8'
  });
}

test('green PRD gate passes using the CLI tool example', () => {
  const result = gate.evaluate({ tier: 'prd', projectRoot: fixture('examples/cli-tool') });
  assert(result.verdict === 'pass', `expected pass, got ${result.verdict}`);
  assert(result.artifacts.some((item) => item.path === '.godpowers/prd/PRD.md'), 'PRD artifact missing');
});

test('green DESIGN gate passes using the SaaS tracker example', () => {
  const result = gate.evaluate({ tier: 'design', projectRoot: fixture('examples/saas-mrr-tracker') });
  assert(result.verdict === 'pass', `expected pass, got ${result.verdict}`);
  assert(result.artifacts.some((item) => item.path === 'DESIGN.md'), 'DESIGN artifact missing');
});

test('green ARCH, ROADMAP, and STACK gates pass using the CLI tool example', () => {
  for (const tier of ['arch', 'roadmap', 'stack']) {
    const result = gate.evaluate({ tier, projectRoot: fixture('examples/cli-tool') });
    assert(result.verdict === 'pass', `${tier} expected pass, got ${result.verdict}`);
  }
});

test('green repo, build, and harden gates pass using gate fixtures', () => {
  for (const [tier, rel] of [
    ['repo', 'fixtures/gate/repo-pass'],
    ['build', 'fixtures/gate/build-pass'],
    ['harden', 'fixtures/gate/harden-pass']
  ]) {
    const result = gate.evaluate({ tier, projectRoot: fixture(rel) });
    assert(result.verdict === 'pass', `${tier} expected pass, got ${result.verdict}`);
  }
});

test('missing artifact fails with stable JSON shape', () => {
  const project = mkProject('godpowers-gate-missing-');
  const result = gate.evaluate({ tier: 'prd', projectRoot: project });
  assert(result.verdict === 'fail', 'missing artifact should fail');
  for (const key of ['tier', 'verdict', 'artifacts', 'checks', 'findings', 'summary']) {
    assert(Object.prototype.hasOwnProperty.call(result, key), `${key} missing`);
  }
  assert(Array.isArray(result.artifacts), 'artifacts must be an array');
  assert(Array.isArray(result.checks), 'checks must be an array');
  assert(result.checks.some((check) => check.id === 'artifact.prd.exists' && check.status === 'fail'), 'missing check absent');
});

test('lint error fails the gate', () => {
  const project = mkProject('godpowers-gate-lint-');
  const bannedDash = String.fromCharCode(0x2014);
  writeRel(project, '.godpowers/prd/PRD.md', [
    '# Product Requirements Document',
    '',
    '## Problem Statement',
    '',
    `[DECISION] This fixture contains a banned dash ${bannedDash} so the gate fails.`
  ].join('\n'));
  const result = gate.evaluate({ tier: 'prd', projectRoot: project });
  assert(result.verdict === 'fail', 'lint error should fail');
  assert(result.findings.some((finding) => finding.code === 'U-08'), 'U-08 finding missing');
});

test('harden gate fails unresolved Critical findings', () => {
  const project = mkProject('godpowers-gate-critical-');
  writeRel(project, '.godpowers/harden/FINDINGS.md', [
    '# Harden Findings',
    '',
    '## Summary',
    '',
    '- [DECISION] Launch gate: BLOCKED.',
    '',
    '| Severity | Count |',
    '|---|---:|',
    '| Critical | 1 |',
    '',
    '### [CRITICAL-001] Token exposure',
    '- [DECISION] Status: Open.'
  ].join('\n'));
  const result = gate.evaluate({ tier: 'harden', projectRoot: project });
  assert(result.verdict === 'fail', 'critical finding should fail');
  assert(result.checks.some((check) => check.id === 'harden.critical-findings' && check.status === 'fail'), 'critical check missing');
});

test('build gate fails when STATE lacks passed command evidence', () => {
  const project = mkProject('godpowers-gate-build-');
  writeRel(project, '.godpowers/build/STATE.md', [
    '# Build State',
    '',
    '## Verification',
    '',
    '- [DECISION] Verification is planned but no command has passed yet.'
  ].join('\n'));
  const result = gate.evaluate({ tier: 'build', projectRoot: project });
  assert(result.verdict === 'fail', 'missing build evidence should fail');
  assert(result.findings.some((finding) => finding.code === 'G-BUILD-EVIDENCE'), 'build evidence finding missing');
});

test('CLI gate exits 0 and emits JSON on pass', () => {
  const result = runCli(['gate', '--tier=prd', '--project=examples/cli-tool']);
  assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  assert(parsed.verdict === 'pass', 'CLI verdict should pass');
});

test('CLI gate exits nonzero and emits JSON on failure', () => {
  const project = mkProject('godpowers-gate-cli-fail-');
  const result = runCli(['gate', '--tier=prd', `--project=${project}`]);
  assert(result.status === 1, `expected exit 1, got ${result.status}`);
  const parsed = JSON.parse(result.stdout);
  assert(parsed.verdict === 'fail', 'CLI verdict should fail');
});

asyncTest('async gate API mirrors sync verdict', async () => {
  const result = await gate.evaluateAsync({ tier: 'stack', projectRoot: fixture('examples/cli-tool') });
  assert(result.verdict === 'pass', 'async gate should pass');
});

report('Gate tests');
