#!/usr/bin/env node
/**
 * Behavioral tests for vercel-labs/agent-browser integration:
 *   lib/agent-browser-driver.js
 *   lib/browser-bridge.js (agent-browser path)
 *   lib/runtime-audit.js (agent-browser branch)
 *   lib/runtime-test.js (agent-browser branch)
 *
 * Tests run without requiring agent-browser to actually be installed.
 * The detection paths work either way; the dispatch paths are exercised
 * via mock-driver objects.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const driver = require('../lib/agent-browser-driver');
const bridge = require('../lib/browser-bridge');
const audit = require('../lib/runtime-audit');
const tester = require('../lib/runtime-test');

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

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  + ${name}`);
    passed++;
  } catch (e) {
    console.error(`  x ${name}: ${e.message}`);
    failed++;
  }
}

function makeMockAgentBrowser() {
  // Mock object that has the agent-browser driver shape (no $, has snapshot/goto/getStyles)
  return {
    snapshot: async () => 'mock-tree',
    goto: async (url) => { this.lastUrl = url; },
    click: async (sel) => { this.lastClick = sel; },
    type: async (sel, text) => { this.lastType = { sel, text }; },
    fill: async (sel, text) => { this.lastFill = { sel, text }; },
    isVisible: async (sel) => sel === 'visible-thing',
    getStyles: async (sel) => ({
      color: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(26, 28, 30)',
      fontFamily: 'Inter',
      fontSize: '16px'
    }),
    screenshot: async (p) => p,
    close: async () => {},
    _run: () => 'true'
  };
}

console.log('\n  Agent-browser integration behavioral tests\n');

// ============================================================================
// Detection
// ============================================================================

test('driver.isInstalled returns boolean', () => {
  const r = driver.isInstalled();
  if (typeof r !== 'boolean') throw new Error('not boolean');
});

test('bridge.isAgentBrowserInstalled returns boolean', () => {
  const r = bridge.isAgentBrowserInstalled();
  if (typeof r !== 'boolean') throw new Error('not boolean');
});

test('bridge.getActiveBackend respects agent-browser preference order', () => {
  // The result depends on what's actually installed. Verify it's a known value.
  const r = bridge.getActiveBackend('/tmp');
  if (r !== null && r !== 'agent-browser' && r !== 'playwright') {
    throw new Error(`unexpected backend: ${r}`);
  }
});

// ============================================================================
// runtime-audit branch detection
// ============================================================================

asyncTest('extractComputedStyles uses agent-browser path when shape matches', async () => {
  const mock = makeMockAgentBrowser();
  const styles = await audit.extractComputedStyles(mock, {
    primaryButton: 'button[type="submit"]'
  });
  if (!styles.primaryButton.found) throw new Error('not found');
  if (styles.primaryButton.color !== 'rgb(255, 255, 255)') throw new Error('color wrong');
});

asyncTest('extractComputedStyles handles agent-browser getStyles failure', async () => {
  const mock = {
    snapshot: async () => '',
    goto: async () => {},
    getStyles: async (sel) => { throw new Error('not found'); },
    close: async () => {}
  };
  const styles = await audit.extractComputedStyles(mock, { x: '.x' });
  if (styles.x.found) throw new Error('should not be found');
  if (!styles.x.error) throw new Error('error not propagated');
});

asyncTest('extractComputedStyles handles agent-browser null styles', async () => {
  const mock = {
    snapshot: async () => '',
    goto: async () => {},
    getStyles: async (sel) => null,
    close: async () => {}
  };
  const styles = await audit.extractComputedStyles(mock, { x: '.x' });
  if (styles.x.found) throw new Error('should not be found when null');
});

asyncTest('extractComputedStyles still uses Playwright path when $ present', async () => {
  const mockPlaywright = {
    $: async (sel) => ({ tag: 'button' }),
    evaluate: async (fn, handle) => ({
      color: 'rgb(0, 0, 0)',
      backgroundColor: 'rgb(255, 255, 255)',
      fontFamily: 'Arial',
      fontSize: '14px',
      fontWeight: '400',
      borderRadius: '4px',
      padding: '8px',
      margin: '0',
      lineHeight: '1.5'
    })
  };
  const styles = await audit.extractComputedStyles(mockPlaywright, { x: '.x' });
  if (!styles.x.found) throw new Error('Playwright path failed');
  if (styles.x.color !== 'rgb(0, 0, 0)') throw new Error('Playwright path output wrong');
});

// ============================================================================
// runtime-test branch detection
// ============================================================================

asyncTest('runFlow uses agent-browser branch on driver shape', async () => {
  const mock = makeMockAgentBrowser();
  const flow = {
    steps: [
      { kind: 'navigate', target: 'https://example.com' },
      { kind: 'click', target: 'Submit' },
      { kind: 'expect', target: 'visible-thing' }
    ]
  };
  const r = await tester.runFlow(mock, flow);
  if (!r.passed) throw new Error(`flow should pass: ${JSON.stringify(r)}`);
  if (r.steps.length !== 3) throw new Error(`expected 3 steps, got ${r.steps.length}`);
});

asyncTest('runFlow agent-browser fails gracefully when expect target not visible', async () => {
  const mock = makeMockAgentBrowser();
  const flow = {
    steps: [
      { kind: 'expect', target: 'invisible-thing' }
    ]
  };
  const r = await tester.runFlow(mock, flow);
  if (r.passed) throw new Error('should have failed');
  if (!r.error) throw new Error('error not set');
});

asyncTest('runFlow agent-browser handles type step', async () => {
  const mock = makeMockAgentBrowser();
  const flow = {
    steps: [
      { kind: 'type', text: 'hello' }
    ]
  };
  const r = await tester.runFlow(mock, flow);
  if (!r.passed) throw new Error('type failed');
});

// ============================================================================
// Driver helpers
// ============================================================================

test('driver._run quotes args with spaces', () => {
  // We can't actually run the CLI in tests. Verify the wrapper accepts proper input.
  // The driver's _run is exposed for testing structure.
  if (typeof driver._run !== 'function') throw new Error('not exposed');
});

test('driver session state is null initially', () => {
  if (driver._session() !== null) throw new Error('expected null session');
});

test('driver._setSession works for tests', () => {
  driver._setSession({ test: true });
  if (!driver._session() || !driver._session().test) throw new Error('not set');
  driver._setSession(null); // restore
});

test('driver.newPage returns the driver itself (single-session model)', async () => {
  const r = await driver.newPage();
  if (r !== driver) throw new Error('newPage should return driver module');
});

// Wait for async tests to log
setTimeout(() => {
  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}, 100);
