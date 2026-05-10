#!/usr/bin/env node
/**
 * Behavioral tests for Phase 11 runtime verification:
 *   lib/browser-bridge.js
 *   lib/runtime-audit.js
 *   lib/runtime-test.js
 *
 * All tests run without launching a real browser. Mocks via opts
 * exercise the actual logic; real browser dispatch is exercised
 * implicitly by the `isPlaywrightInstalled` and config-detection
 * paths.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const browserBridge = require('../lib/browser-bridge');
const runtimeAudit = require('../lib/runtime-audit');
const runtimeTest = require('../lib/runtime-test');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      // Async: caller passes in async fn but we don't await here in this simple harness;
      // tests that need awaits should resolve synchronously via mocks
      result.then(() => { console.log(`  + ${name}`); passed++; })
        .catch(e => { console.error(`  x ${name}: ${e.message}`); failed++; });
    } else {
      console.log(`  + ${name}`);
      passed++;
    }
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

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-runtime-test-'));
}

(async () => {
  console.log('\n  Runtime verification behavioral tests\n');

  // ============================================================================
  // browser-bridge: detection
  // ============================================================================

  test('isPlaywrightInstalled returns boolean', () => {
    const r = browserBridge.isPlaywrightInstalled();
    if (typeof r !== 'boolean') throw new Error('not boolean');
  });

  test('getActiveBackend returns null or a known backend on empty project', () => {
    const tmp = mkTmp();
    const result = browserBridge.getActiveBackend(tmp);
    // On most CI environments without agent-browser or Playwright installed,
    // this returns null. If either IS installed locally it returns its name.
    if (result !== null && result !== 'agent-browser' && result !== 'playwright') {
      throw new Error(`unexpected: ${result}`);
    }
  });

  test('newRunId returns a timestamp-shaped string', () => {
    const id = browserBridge.newRunId();
    if (!/^\d{4}-\d{2}-\d{2}T/.test(id)) throw new Error(`unexpected format: ${id}`);
  });

  test('runtimeDir returns expected path', () => {
    const tmp = mkTmp();
    const dir = browserBridge.runtimeDir(tmp, 'run-x');
    if (!dir.includes('.godpowers/runtime/run-x')) throw new Error('wrong path');
  });

  await asyncTest('launch returns no-backend-available on empty project', async () => {
    const tmp = mkTmp();
    // Force backend to a non-existent option to test the error path.
    // The library's own getActiveBackend may return playwright if installed
    // locally. So we test that LAUNCH passes the correct error structure
    // when no backend resolves.
    const r = await browserBridge.launch({ projectRoot: tmp, backend: 'unknown-backend' });
    if (!r.error) throw new Error('expected error');
  });

  // ============================================================================
  // runtime-audit
  // ============================================================================

  test('normalizeColor handles hex', () => {
    if (runtimeAudit.normalizeColor('#1A1C1E') !== '#1a1c1e') throw new Error('hex normalize');
  });

  test('normalizeColor handles rgb()', () => {
    if (runtimeAudit.normalizeColor('rgb(26, 28, 30)') !== '#1a1c1e') throw new Error('rgb');
  });

  test('normalizeColor handles rgba()', () => {
    if (runtimeAudit.normalizeColor('rgba(26, 28, 30, 0.5)') !== '#1a1c1e') throw new Error('rgba');
  });

  test('normalizeColor returns null for unparseable', () => {
    if (runtimeAudit.normalizeColor('oklch(20% 0.01 250)') !== null) throw new Error('oklch');
  });

  test('compareToDesign flags color mismatch', () => {
    const rendered = {
      primaryButton: { found: true, backgroundColor: 'rgb(255, 0, 0)' }
    };
    const designContent = `---
name: T
colors:
  primary: "#1a1c1e"
---`;
    const r = runtimeAudit.compareToDesign(rendered, designContent);
    if (!r.findings.find(f => f.kind === 'color-no-match')) throw new Error('not flagged');
  });

  test('compareToDesign accepts matching color', () => {
    const rendered = {
      primaryButton: { found: true, backgroundColor: 'rgb(26, 28, 30)' }
    };
    const designContent = `---
name: T
colors:
  primary: "#1a1c1e"
---`;
    const r = runtimeAudit.compareToDesign(rendered, designContent);
    if (r.findings.find(f => f.kind === 'color-no-match')) throw new Error('false positive');
  });

  test('compareToDesign flags typography mismatch', () => {
    const rendered = {
      bodyText: { found: true, fontFamily: 'Comic Sans, sans-serif' }
    };
    const designContent = `---
name: T
typography:
  body:
    fontFamily: "Inter, system-ui, sans-serif"
---`;
    const r = runtimeAudit.compareToDesign(rendered, designContent);
    if (!r.findings.find(f => f.kind === 'typography-no-match')) throw new Error('not flagged');
  });

  test('compareToDesign accepts matching typography family', () => {
    const rendered = {
      bodyText: { found: true, fontFamily: '"Inter", system-ui, sans-serif' }
    };
    const designContent = `---
name: T
typography:
  body:
    fontFamily: "Inter, system-ui, sans-serif"
---`;
    const r = runtimeAudit.compareToDesign(rendered, designContent);
    if (r.findings.find(f => f.kind === 'typography-no-match')) throw new Error('false positive');
  });

  await asyncTest('auditPage with mockBrowserResult returns structured findings', async () => {
    const tmp = mkTmp();
    const r = await runtimeAudit.auditPage('http://localhost:3000', '---\nname: T\n---', {
      projectRoot: tmp,
      mockBrowserResult: {
        findings: [{ severity: 'warning', kind: 'color-no-match', message: 'test' }],
        summary: { errors: 0, warnings: 1, infos: 0 }
      }
    });
    if (!r.findings || r.findings.length !== 1) throw new Error('findings missing');
    if (r.summary.warnings !== 1) throw new Error('summary wrong');
    if (r.backend !== 'mock') throw new Error('backend not mock');
  });

  // ============================================================================
  // runtime-test
  // ============================================================================

  test('extractAcceptanceCriteria pulls bullets with IDs and Acceptance:', () => {
    const prd = `## Functional Requirements

### MUST (V1 launch blockers)
- [DECISION] User clicks Connect, completes Stripe OAuth, lands on
  populated dashboard within 30 seconds. P-MUST-01 -- Acceptance: user clicks Connect, sees populated dashboard
- [DECISION] System shows breakdown. P-MUST-02 -- Acceptance: viewer can drill into any bucket`;
    const r = runtimeTest.extractAcceptanceCriteria(prd);
    if (r.length < 2) throw new Error(`expected 2+, got ${r.length}`);
    if (!r.find(x => x.id === 'P-MUST-01')) throw new Error('P-MUST-01 missing');
  });

  test('parseFlow extracts navigate + click + expect steps', () => {
    const flow = runtimeTest.parseFlow('user clicks Connect, sees populated dashboard');
    if (!flow) throw new Error('null flow');
    if (!flow.steps.find(s => s.kind === 'click')) throw new Error('click step missing');
    if (!flow.steps.find(s => s.kind === 'expect')) throw new Error('expect step missing');
  });

  test('parseFlow returns null for unrelated text', () => {
    const flow = runtimeTest.parseFlow('the system has good performance');
    if (flow !== null) throw new Error('false positive');
  });

  await asyncTest('runFlow returns mockResult when provided', async () => {
    const r = await runtimeTest.runFlow(null, null, {
      mockResult: { passed: true, steps: [] }
    });
    if (!r.passed) throw new Error('mock result wrong');
  });

  await asyncTest('verifyRequirement reports no-runnable-flow for un-parseable acceptance', async () => {
    const r = await runtimeTest.verifyRequirement(null, {
      id: 'P-MUST-99',
      parsedFlow: null,
      acceptanceText: 'just descriptive text'
    });
    if (r.passed) throw new Error('should not pass');
    if (r.reason !== 'no-runnable-flow-parsed-from-acceptance') throw new Error('wrong reason');
  });

  await asyncTest('runAllForUrl with mockResult returns summary', async () => {
    const tmp = mkTmp();
    const r = await runtimeTest.runAllForUrl('http://localhost:3000', 'P-MUST-01', {
      projectRoot: tmp,
      mockResult: {
        results: [{ id: 'P-MUST-01', passed: true }],
        summary: { passed: 1, failed: 0, total: 1 }
      }
    });
    if (r.summary.passed !== 1) throw new Error('summary wrong');
  });

  await asyncTest('runAllForUrl handles no-requirements case', async () => {
    const tmp = mkTmp();
    const r = await runtimeTest.runAllForUrl('http://localhost:3000', 'no-prd-content', {
      projectRoot: tmp
    });
    if (r.results.length !== 0) throw new Error('expected empty results');
  });

  // Wait briefly for any pending async tests to log
  await new Promise(r => setTimeout(r, 50));

  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
})();
