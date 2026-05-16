#!/usr/bin/env node
/**
 * Behavioral tests for lib/host-capabilities.js.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const hostCapabilities = require('../lib/host-capabilities');

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

function mkProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-host-cap-'));
}

console.log('\n  Host capabilities behavioral tests\n');

test('detect reports full when agent metadata is present', () => {
  const tmp = mkProject();
  fs.mkdirSync(path.join(tmp, 'home', '.codex', 'agents'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'home', '.codex', 'agents', 'god-orchestrator.toml'), 'name = "god-orchestrator"\n');
  fs.mkdirSync(path.join(tmp, 'lib'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'schema'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'lib', 'extension-authoring.js'), '');
  fs.writeFileSync(path.join(tmp, 'lib', 'suite-state.js'), '');
  fs.writeFileSync(path.join(tmp, 'schema', 'extension-manifest.v1.json'), '{}');
  const report = hostCapabilities.detect(tmp, {
    homeDir: path.join(tmp, 'home'),
    env: { SHELL: '/bin/zsh', CODEX_HOME: path.join(tmp, 'home', '.codex') }
  });
  assert.equal(report.level, 'full');
  assert.equal(report.guarantees.agentSpawn, true);
  assert(hostCapabilities.summary(report).startsWith('full on codex'));
});

test('detect reports degraded when shell tools exist but agent spawn is absent', () => {
  const tmp = mkProject();
  const report = hostCapabilities.detect(tmp, {
    homeDir: path.join(tmp, 'home'),
    env: { SHELL: '/bin/zsh' }
  });
  assert.equal(report.level, 'degraded');
  assert(report.gaps.includes('fresh-context agent spawn not detected'));
});

test('render summarizes gaps without banned dash characters', () => {
  const tmp = mkProject();
  const report = hostCapabilities.detect(tmp, {
    homeDir: path.join(tmp, 'home'),
    env: { SHELL: '/bin/zsh' }
  });
  const rendered = hostCapabilities.render(report);
  assert(rendered.includes('Host capabilities:'));
  assert(!/[\u2013\u2014]/.test(rendered), 'render contains banned dash');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
