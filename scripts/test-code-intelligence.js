#!/usr/bin/env node
/**
 * Behavioral tests for lib/code-intelligence.js.
 */

const assert = require('assert');

const codeIntelligence = require('../lib/code-intelligence');
const { test, report, mkProject } = require('./test-harness');

function fakeProbe(versions) {
  return function probe(command) {
    return versions[command] || null;
  };
}

console.log('\n  Code intelligence behavioral tests\n');

test('detect reports not-detected when no tools are available', () => {
  const tmp = mkProject('godpowers-code-intel-');
  const detected = codeIntelligence.detect(tmp, {
    commandVersion: fakeProbe({})
  });
  assert.equal(detected.level, 'not-detected');
  assert.equal(detected.astGrep.available, false);
  assert.equal(detected.lsp.available, false);
  assert(detected.gaps.includes('ast-grep not detected'));
  assert(detected.gaps.includes('LSP tools not detected'));
  assert.equal(codeIntelligence.summary(detected), 'not detected');
});

test('detect prefers ast-grep and reports available LSP tools', () => {
  const tmp = mkProject('godpowers-code-intel-');
  const detected = codeIntelligence.detect(tmp, {
    commandVersion: fakeProbe({
      'ast-grep': 'ast-grep 0.39.0',
      sg: 'sg 0.38.0',
      'typescript-language-server': '4.3.4',
      gopls: 'golang.org/x/tools/gopls v0.17.0'
    })
  });
  assert.equal(detected.level, 'available');
  assert.equal(detected.astGrep.available, true);
  assert.equal(detected.astGrep.command, 'ast-grep');
  assert.equal(detected.lsp.available, true);
  assert.equal(detected.lsp.tools.length, 2);
  assert(codeIntelligence.summary(detected).includes('ast-grep via ast-grep'));
  assert(codeIntelligence.summary(detected).includes('LSP via typescript-language-server, gopls'));
});

test('detect falls back to sg when ast-grep is absent', () => {
  const tmp = mkProject('godpowers-code-intel-');
  const detected = codeIntelligence.detect(tmp, {
    commandVersion: fakeProbe({
      sg: 'sg 0.38.0'
    })
  });
  assert.equal(detected.level, 'available');
  assert.equal(detected.astGrep.available, true);
  assert.equal(detected.astGrep.command, 'sg');
});

test('detect rejects non ast-grep sg commands', () => {
  const tmp = mkProject('godpowers-code-intel-');
  const detected = codeIntelligence.detect(tmp, {
    commandVersion: fakeProbe({
      sg: 'sg from util-linux 2.39.3'
    })
  });
  assert.equal(detected.level, 'not-detected');
  assert.equal(detected.astGrep.available, false);
});

test('render summarizes optional tools without banned dash characters', () => {
  const tmp = mkProject('godpowers-code-intel-');
  const detected = codeIntelligence.detect(tmp, {
    commandVersion: fakeProbe({
      'ast-grep': 'ast-grep 0.39.0'
    })
  });
  const rendered = codeIntelligence.render(detected);
  assert(rendered.includes('Code intelligence:'));
  assert(rendered.includes('Structural search: ast-grep'));
  assert(!/[\u2013\u2014]/.test(rendered), 'render contains banned dash');
});

report();
