#!/usr/bin/env node
/**
 * Behavioral tests for lib/host-capabilities.js.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const hostCapabilities = require('../lib/host-capabilities');
const { test, report } = require('./test-harness');


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
    env: { SHELL: '/bin/zsh', CODEX_HOME: path.join(tmp, 'home', '.codex') },
    codeIntelligence: {
      level: 'available',
      astGrep: { available: true, command: 'ast-grep', version: 'ast-grep 0.39.0' },
      lsp: { available: false, primary: null, tools: [] },
      gaps: ['LSP tools not detected']
    }
  });
  assert.equal(report.level, 'full');
  assert.equal(report.guarantees.agentSpawn, true);
  assert.equal(report.guarantees.codeIntelligence.astGrep.command, 'ast-grep');
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
  assert(rendered.includes('Code intelligence:'));
  assert(!/[\u2013\u2014]/.test(rendered), 'render contains banned dash');
});

report();
