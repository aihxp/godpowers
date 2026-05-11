#!/usr/bin/env node
/**
 * Install + state-init end-to-end smoke (dogfood-003 minimal cycle).
 *
 * Audits the install -> init -> read-back path without requiring an
 * actual AI session. Catches:
 *   - Installer fails on a clean home dir
 *   - Skills/agents/refs/routing not copied
 *   - VERSION marker missing or mismatched
 *   - state.init then state.read doesn't round-trip in a fresh project
 *
 * Replaces the spirit of "actually run /god-mode on a tmpdir" without
 * the LLM dependency.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const INSTALLER = path.join(ROOT, 'bin', 'install.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  + ${name}`); passed++; }
  catch (e) { console.error(`  x ${name}: ${e.message}`); failed++; }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

console.log('\n  Install + init smoke test\n');

// 1. Run the installer with a fake HOME -----------------------------------

const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-install-smoke-'));

test('installer completes against a clean HOME', () => {
  const out = execFileSync('node', [INSTALLER, '--claude', '--global'], {
    env: { ...process.env, HOME: fakeHome },
    encoding: 'utf8',
    timeout: 30_000
  });
  assert(/Installed Godpowers/i.test(out) || /skills installed/i.test(out) || /Done/i.test(out),
    `installer output looked wrong:\n${out.slice(-500)}`);
});

const installedDir = path.join(fakeHome, '.claude');

test('installer wrote ~/.claude/skills/ with at least 80 god-* files', () => {
  const skillsDir = path.join(installedDir, 'skills');
  assert(fs.existsSync(skillsDir), `${skillsDir} missing`);
  const files = fs.readdirSync(skillsDir).filter(f => /^god/.test(f));
  assert(files.length >= 80, `expected >=80 skills, got ${files.length}`);
});

test('installer writes Codex commands as skill directories', () => {
  const codexHome = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-codex-smoke-'));
  execFileSync('node', [INSTALLER, '--codex', '--global'], {
    env: { ...process.env, HOME: codexHome },
    encoding: 'utf8',
    timeout: 30_000
  });
  const skillsDir = path.join(codexHome, '.codex', 'skills');
  assert(fs.existsSync(path.join(skillsDir, 'god-next', 'SKILL.md')),
    'god-next/SKILL.md missing');
  assert(fs.existsSync(path.join(skillsDir, 'god-status', 'SKILL.md')),
    'god-status/SKILL.md missing');
  assert(fs.existsSync(path.join(skillsDir, 'godpowers', 'SKILL.md')),
    'godpowers/SKILL.md missing');
  assert(!fs.existsSync(path.join(skillsDir, 'god-next.md')),
    'Codex should not receive flat god-next.md');
  fs.rmSync(codexHome, { recursive: true, force: true });
});

test('installer wrote ~/.claude/agents/ with at least 30 god-* files', () => {
  const agentsDir = path.join(installedDir, 'agents');
  assert(fs.existsSync(agentsDir), `${agentsDir} missing`);
  const files = fs.readdirSync(agentsDir).filter(f => /^god-/.test(f));
  assert(files.length >= 30, `expected >=30 agents, got ${files.length}`);
});

test('installer wrote GODPOWERS_VERSION matching package.json', () => {
  const vFile = path.join(installedDir, 'GODPOWERS_VERSION');
  assert(fs.existsSync(vFile), `${vFile} missing`);
  const installed = fs.readFileSync(vFile, 'utf8').trim();
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert(installed === pkg.version,
    `version mismatch: installed=${installed} package.json=${pkg.version}`);
});

test('installer wrote godpowers-references/ with HAVE-NOTS.md', () => {
  const refsDir = path.join(installedDir, 'godpowers-references');
  const havenots = path.join(refsDir, 'HAVE-NOTS.md');
  assert(fs.existsSync(havenots), `${havenots} missing`);
});

test('installer wrote runtime bundle with lib next to workflow data', () => {
  const runtimeDir = path.join(installedDir, 'godpowers-runtime');
  assert(fs.existsSync(path.join(runtimeDir, 'lib', 'router.js')), 'runtime lib/router.js missing');
  assert(fs.existsSync(path.join(runtimeDir, 'routing', 'god-mode.yaml')), 'runtime routing missing');
  assert(fs.existsSync(path.join(runtimeDir, 'workflows', 'full-arc.yaml')), 'runtime workflow missing');
  assert(fs.existsSync(path.join(runtimeDir, 'package.json')), 'runtime package.json missing');
});

test('installed OTel exporter reports package version', () => {
  const runtimeDir = path.join(installedDir, 'godpowers-runtime');
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const otel = require(path.join(runtimeDir, 'lib', 'otel-exporter.js'));
  const now = new Date().toISOString();
  const out = otel.convertRun([{
    trace_id: '0123456789abcdef0123456789abcdef',
    span_id: '0123456789abcdef',
    ts: now,
    name: 'workflow.run',
    attrs: { name: 'smoke' },
    prev: 'genesis'
  }]);
  const version = out[0].scopeSpans[0].scope.version;
  assert(version === pkg.version, `version mismatch: ${version} vs ${pkg.version}`);
});

test('installed router skills explain godpowers-runtime resolution', () => {
  const skillsDir = path.join(installedDir, 'skills');
  const god = fs.readFileSync(path.join(skillsDir, 'god.md'), 'utf8');
  const next = fs.readFileSync(path.join(skillsDir, 'god-next.md'), 'utf8');
  assert(god.includes('godpowers-runtime'), 'god.md missing runtime bundle guidance');
  assert(next.includes('godpowers-runtime'), 'god-next.md missing runtime bundle guidance');
});

test('the 9 freshly-built skills are all installed', () => {
  const want = ['god-doctor', 'god-help', 'god-version', 'god-redo',
                'god-skip', 'god-rollback', 'god-repair', 'god-restore',
                'god-smite'];
  const skillsDir = path.join(installedDir, 'skills');
  for (const s of want) {
    assert(fs.existsSync(path.join(skillsDir, `${s}.md`)),
      `${s}.md not installed`);
  }
});

// 2. Init a project in a separate tmpdir, verify state round-trip -------

test('state.init in a fresh project writes valid state.json', () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-proj-'));
  fs.mkdirSync(path.join(proj, '.godpowers'), { recursive: true });
  const state = require('../lib/state');
  state.init(proj, 'smoke-test');
  const s = state.read(proj);
  assert(s && s.project.name === 'smoke-test', 'roundtrip failed');
  assert(s.tiers && s.tiers['tier-1'] && s.tiers['tier-1'].prd,
    'expected tier structure missing');
});

test('intent.validate accepts a minimal greenfield intent', () => {
  const intent = require('../lib/intent');
  const errors = intent.validate({
    apiVersion: 'godpowers/v1',
    kind: 'Project',
    metadata: { name: 'smoke' },
    mode: 'A',
    scale: 'small'
  });
  assert(errors.length === 0, `unexpected errors: ${JSON.stringify(errors)}`);
});

test('events.startRun creates an OTel-shape trace', () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-evt-'));
  fs.mkdirSync(path.join(proj, '.godpowers'), { recursive: true });
  const events = require('../lib/events');
  const handle = events.startRun(proj, { workflow: 'full-arc' });
  assert(handle.traceId, 'no traceId');
  assert(handle.runId, 'no runId');
  const all = events.readRun(proj, handle.runId);
  assert(all.length === 1, 'expected 1 event after startRun');
  assert(all[0].name === 'workflow.run', 'first event should be workflow.run');
});

// 3. Cleanup ------------------------------------------------------------

test('cleanup runs (no error)', () => {
  try {
    fs.rmSync(fakeHome, { recursive: true, force: true });
  } catch (e) {
    // not fatal
  }
});

test('uninstaller removes all installed Godpowers data dirs', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-uninstall-smoke-'));
  execFileSync('node', [INSTALLER, '--claude', '--global'], {
    env: { ...process.env, HOME: home },
    encoding: 'utf8',
    timeout: 30_000
  });
  execFileSync('node', [INSTALLER, '--claude', '--global', '--uninstall'], {
    env: { ...process.env, HOME: home },
    encoding: 'utf8',
    timeout: 30_000
  });
  const claudeDir = path.join(home, '.claude');
  for (const dir of [
    'godpowers-templates',
    'godpowers-references',
    'godpowers-workflows',
    'godpowers-schema',
    'godpowers-routing',
    'godpowers-runtime'
  ]) {
    assert(!fs.existsSync(path.join(claudeDir, dir)), `${dir} should be removed`);
  }
  fs.rmSync(home, { recursive: true, force: true });
});

test('uninstaller removes Codex skill directories', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-codex-uninstall-'));
  execFileSync('node', [INSTALLER, '--codex', '--global'], {
    env: { ...process.env, HOME: home },
    encoding: 'utf8',
    timeout: 30_000
  });
  execFileSync('node', [INSTALLER, '--codex', '--global', '--uninstall'], {
    env: { ...process.env, HOME: home },
    encoding: 'utf8',
    timeout: 30_000
  });
  const skillsDir = path.join(home, '.codex', 'skills');
  assert(!fs.existsSync(path.join(skillsDir, 'god-next')), 'god-next should be removed');
  assert(!fs.existsSync(path.join(skillsDir, 'godpowers')), 'godpowers should be removed');
  fs.rmSync(home, { recursive: true, force: true });
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
