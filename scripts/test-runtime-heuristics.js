#!/usr/bin/env node
/**
 * Behavioral tests for Phase 15 runtime heuristic improvements:
 *   - DEFAULT_SELECTORS expanded to 20
 *   - deriveSelectorsFromDesign reads components map
 *   - parseFlow recognizes 8+ verb forms, sequential, negative
 *   - visualRegression baseline-and-compare
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

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

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-runtime-heuristics-'));
}

console.log('\n  Runtime heuristic improvements - behavioral tests\n');

// ============================================================================
// DEFAULT_SELECTORS expansion
// ============================================================================

test('DEFAULT_SELECTORS has at least 20 entries', () => {
  const count = Object.keys(audit.DEFAULT_SELECTORS).length;
  if (count < 20) throw new Error(`expected 20+, got ${count}`);
});

test('DEFAULT_SELECTORS includes layout selectors', () => {
  const s = audit.DEFAULT_SELECTORS;
  if (!s.main) throw new Error('main missing');
  if (!s.nav) throw new Error('nav missing');
  if (!s.header) throw new Error('header missing');
  if (!s.footer) throw new Error('footer missing');
});

test('DEFAULT_SELECTORS includes form selectors', () => {
  const s = audit.DEFAULT_SELECTORS;
  if (!s.inputText) throw new Error('inputText missing');
  if (!s.label) throw new Error('label missing');
});

test('DEFAULT_SELECTORS includes feedback selectors', () => {
  const s = audit.DEFAULT_SELECTORS;
  if (!s.errorMessage) throw new Error('errorMessage missing');
});

test('DEFAULT_SELECTORS includes button variants', () => {
  const s = audit.DEFAULT_SELECTORS;
  if (!s.primaryButton) throw new Error('primaryButton missing');
  if (!s.secondaryButton) throw new Error('secondaryButton missing');
  if (!s.iconButton) throw new Error('iconButton missing');
});

// ============================================================================
// deriveSelectorsFromDesign
// ============================================================================

test('deriveSelectorsFromDesign extracts component selectors', () => {
  const design = `---
name: T
components:
  card:
    backgroundColor: "#fff"
  button-primary:
    backgroundColor: "#000"
---`;
  const sel = audit.deriveSelectorsFromDesign(design);
  if (!sel['D-card']) throw new Error('D-card missing');
  if (!sel['D-button-primary']) throw new Error('D-button-primary missing');
  if (sel['D-card'] !== '[data-design-component="card"]') {
    throw new Error('selector format wrong');
  }
});

test('deriveSelectorsFromDesign returns empty for design without components', () => {
  const design = `---
name: T
colors:
  primary: "#000"
---`;
  const sel = audit.deriveSelectorsFromDesign(design);
  if (Object.keys(sel).length !== 0) throw new Error('expected empty');
});

test('deriveSelectorsFromDesign handles invalid input gracefully', () => {
  const sel = audit.deriveSelectorsFromDesign(null);
  if (Object.keys(sel).length !== 0) throw new Error('expected empty for null');
});

// ============================================================================
// parseFlow expanded verbs
// ============================================================================

test('parseFlow recognizes "navigate to"', () => {
  const flow = tester.parseFlow('user navigates to https://example.com');
  if (!flow || !flow.steps.find(s => s.kind === 'navigate')) {
    throw new Error('navigate not parsed');
  }
});

test('parseFlow recognizes "visits"', () => {
  const flow = tester.parseFlow('user visits /dashboard');
  if (!flow || !flow.steps.find(s => s.kind === 'navigate')) {
    throw new Error('visits not parsed');
  }
});

test('parseFlow recognizes "opens"', () => {
  const flow = tester.parseFlow('user opens /settings');
  if (!flow || !flow.steps.find(s => s.kind === 'navigate')) {
    throw new Error('opens not parsed');
  }
});

test('parseFlow recognizes "goes to"', () => {
  const flow = tester.parseFlow('user goes to /profile');
  if (!flow || !flow.steps.find(s => s.kind === 'navigate')) {
    throw new Error('goes to not parsed');
  }
});

test('parseFlow recognizes "clicks"', () => {
  const flow = tester.parseFlow('user clicks Submit');
  if (!flow || !flow.steps.find(s => s.kind === 'click')) {
    throw new Error('clicks not parsed');
  }
});

test('parseFlow recognizes "taps"', () => {
  const flow = tester.parseFlow('user taps the menu');
  if (!flow || !flow.steps.find(s => s.kind === 'click')) {
    throw new Error('taps not parsed');
  }
});

test('parseFlow recognizes "presses"', () => {
  const flow = tester.parseFlow('user presses the Connect button');
  if (!flow || !flow.steps.find(s => s.kind === 'click')) {
    throw new Error('presses not parsed');
  }
});

test('parseFlow recognizes "lands on" (F-001 fix)', () => {
  const flow = tester.parseFlow('user lands on the dashboard');
  if (!flow || !flow.steps.find(s => s.kind === 'expect')) {
    throw new Error('lands on not parsed');
  }
});

test('parseFlow recognizes "arrives on" (F-001 fix)', () => {
  const flow = tester.parseFlow('user arrives on the welcome page');
  if (!flow || !flow.steps.find(s => s.kind === 'expect')) {
    throw new Error('arrives on not parsed');
  }
});

test('parseFlow recognizes "completes" (F-001 fix)', () => {
  const flow = tester.parseFlow('user completes onboarding flow');
  if (!flow || !flow.steps.find(s => s.kind === 'expect')) {
    throw new Error('completes not parsed');
  }
});

test('parseFlow on realistic PRD acceptance (F-001 dogfood input)', () => {
  const text = 'User clicks Connect, completes Stripe OAuth, lands on populated dashboard within 30 seconds.';
  const flow = tester.parseFlow(text);
  if (!flow) throw new Error('null flow');
  // Must catch click + at least one expect (completes or lands on)
  if (!flow.steps.find(s => s.kind === 'click')) throw new Error('click missed');
  if (!flow.steps.find(s => s.kind === 'expect')) throw new Error('expect missed');
});

test('parseFlow recognizes "types" with quoted text', () => {
  const flow = tester.parseFlow('user types "alice@example.com"');
  const typeStep = flow && flow.steps.find(s => s.kind === 'type');
  if (!typeStep) throw new Error('types not parsed');
  if (typeStep.text !== 'alice@example.com') throw new Error('text wrong');
});

test('parseFlow recognizes "enters" with field', () => {
  const flow = tester.parseFlow('user enters alice@example.com in the Email field');
  const typeStep = flow && flow.steps.find(s => s.kind === 'type');
  if (!typeStep) throw new Error('enters not parsed');
});

test('parseFlow recognizes "sees"', () => {
  const flow = tester.parseFlow('user sees Welcome');
  if (!flow || !flow.steps.find(s => s.kind === 'expect')) {
    throw new Error('sees not parsed');
  }
});

test('parseFlow recognizes "should see"', () => {
  const flow = tester.parseFlow('user should see Dashboard');
  if (!flow || !flow.steps.find(s => s.kind === 'expect')) {
    throw new Error('should see not parsed');
  }
});

test('parseFlow recognizes "displays"', () => {
  const flow = tester.parseFlow('page displays the user name');
  if (!flow || !flow.steps.find(s => s.kind === 'expect')) {
    throw new Error('displays not parsed');
  }
});

test('parseFlow recognizes negative expectations', () => {
  const flow = tester.parseFlow('user does not see Error');
  const notExpect = flow && flow.steps.find(s => s.kind === 'not-expect');
  if (!notExpect) throw new Error('does not see not parsed');
  if (notExpect.target !== 'Error') throw new Error('target wrong');
});

test('parseFlow recognizes "should not see"', () => {
  const flow = tester.parseFlow('admin should not see the delete button');
  if (!flow || !flow.steps.find(s => s.kind === 'not-expect')) {
    throw new Error('should not see not parsed');
  }
});

test('parseFlow handles sequential steps with "then"', () => {
  const flow = tester.parseFlow('user clicks Submit then sees Welcome');
  if (!flow) throw new Error('null flow');
  if (flow.steps.length < 2) throw new Error(`expected 2+ steps, got ${flow.steps.length}`);
});

test('parseFlow handles comma-separated steps', () => {
  const flow = tester.parseFlow('user clicks Connect, sees populated dashboard');
  if (!flow || flow.steps.length < 2) {
    throw new Error('comma-separated steps not parsed');
  }
});

// ============================================================================
// visualRegression
// ============================================================================

test('visualRegression captures baseline on first run', () => {
  const tmp = mkTmp();
  const screenshotPath = path.join(tmp, 'screen.png');
  fs.writeFileSync(screenshotPath, 'fake-screenshot-1');
  const baselineDir = path.join(tmp, 'baselines');
  const result = audit.visualRegression(screenshotPath, baselineDir);
  if (!result.baseline) throw new Error('first run should capture baseline');
  if (result.changed) throw new Error('first run should not flag change');
  if (!fs.existsSync(result.baselinePath)) throw new Error('baseline not written');
});

test('visualRegression detects no change on identical re-run', () => {
  const tmp = mkTmp();
  const screenshotPath = path.join(tmp, 'screen.png');
  fs.writeFileSync(screenshotPath, 'fake-screenshot-content');
  const baselineDir = path.join(tmp, 'baselines');
  audit.visualRegression(screenshotPath, baselineDir); // first run
  // Re-run with identical content
  const result = audit.visualRegression(screenshotPath, baselineDir);
  if (result.baseline) throw new Error('should not be baseline');
  if (result.changed) throw new Error('identical content should not flag change');
  if (result.deltaPct !== 0) throw new Error(`expected 0% delta, got ${result.deltaPct}`);
});

test('visualRegression detects significant change', () => {
  const tmp = mkTmp();
  const screenshotPath = path.join(tmp, 'screen.png');
  fs.writeFileSync(screenshotPath, 'small'); // baseline
  const baselineDir = path.join(tmp, 'baselines');
  audit.visualRegression(screenshotPath, baselineDir); // capture baseline
  // Now modify screenshot to a much larger size
  fs.writeFileSync(screenshotPath, 'a much larger screenshot content that is significantly different');
  const result = audit.visualRegression(screenshotPath, baselineDir);
  if (!result.changed) throw new Error('large change should flag changed');
  if (result.deltaPct <= 5) throw new Error(`expected >5% delta, got ${result.deltaPct}`);
});

test('visualRegression delta tolerance 5%', () => {
  const tmp = mkTmp();
  const screenshotPath = path.join(tmp, 'screen.png');
  // Create exactly 100 bytes baseline
  fs.writeFileSync(screenshotPath, 'a'.repeat(100));
  const baselineDir = path.join(tmp, 'baselines');
  audit.visualRegression(screenshotPath, baselineDir);
  // Now write 102 bytes (2% delta)
  fs.writeFileSync(screenshotPath, 'a'.repeat(102));
  const result = audit.visualRegression(screenshotPath, baselineDir);
  if (result.changed) throw new Error('2% delta should not flag changed');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
