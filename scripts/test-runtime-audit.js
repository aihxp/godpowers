#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const audit = require('../lib/runtime-audit');
const { test, asyncTest, assert, mkProject, report } = require('./test-harness');

const DESIGN = `---
name: T
colors:
  primary: "#3366ff"
  surface: "#ffffff"
typography:
  body:
    fontFamily: "Inter, sans-serif"
rounded:
  md: "8px"
components:
  button-primary:
    backgroundColor: "#3366ff"
---
# Design rationale
`;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

test('normalizeColor handles hex, rgb, rgba, and unknown forms', () => {
  assert(audit.normalizeColor('#3366ff') === '#3366ff', 'hex passthrough');
  assert(audit.normalizeColor('#3366ffcc') === '#3366ff', 'hex8 truncates to 6');
  assert(audit.normalizeColor('rgb(51, 102, 255)') === '#3366ff', 'rgb -> hex');
  assert(audit.normalizeColor('rgba(51, 102, 255, 0.5)') === '#3366ff', 'rgba -> hex');
  assert(audit.normalizeColor('oklch(0.7 0.1 200)') === null, 'unknown -> null');
  assert(audit.normalizeColor('') === null, 'empty -> null');
});

test('collectColorTokens walks nested color maps', () => {
  const tokens = audit.collectColorTokens({ colors: { primary: '#3366ff', brand: { dark: '#001122' } } });
  assert(tokens.some((t) => t.value === '#3366ff'), 'flat token captured');
  assert(tokens.some((t) => t.path === 'colors.brand.dark' && t.value === '#001122'), 'nested token captured');
});

test('deriveSelectorsFromDesign handles malformed / no-component design', () => {
  assert(Object.keys(audit.deriveSelectorsFromDesign('not yaml at all')).length === 0, 'no components -> empty');
  assert(Object.keys(audit.deriveSelectorsFromDesign(null)).length === 0, 'null -> empty');
});

// ---------------------------------------------------------------------------
// compareToDesign branches
// ---------------------------------------------------------------------------

test('compareToDesign returns empty for missing design or frontmatter', () => {
  assert(audit.compareToDesign({}, '').findings.length === 0, 'no design content');
  assert(audit.compareToDesign({}, 'plain text, no frontmatter').findings.length === 0, 'no frontmatter');
});

test('compareToDesign flags mismatched button color, body font, and card radius', () => {
  const rendered = {
    primaryButton: { found: true, backgroundColor: 'rgb(255, 0, 0)' },
    bodyText: { found: true, fontFamily: 'Comic Sans MS' },
    card: { found: true, borderRadius: '99px' }
  };
  const { findings, summary } = audit.compareToDesign(rendered, DESIGN);
  assert(findings.find((f) => f.kind === 'color-no-match'), 'color mismatch flagged');
  assert(findings.find((f) => f.kind === 'typography-no-match'), 'font mismatch flagged');
  assert(findings.find((f) => f.kind === 'rounded-no-match'), 'radius mismatch flagged');
  assert(summary.warnings >= 2 && summary.infos >= 1, `summary tally: ${JSON.stringify(summary)}`);
});

test('compareToDesign passes when rendered styles match the tokens', () => {
  const rendered = {
    primaryButton: { found: true, backgroundColor: 'rgb(51, 102, 255)' },
    bodyText: { found: true, fontFamily: 'Inter, sans-serif' },
    card: { found: true, borderRadius: '8px' }
  };
  const { findings } = audit.compareToDesign(rendered, DESIGN);
  assert(findings.length === 0, `expected no findings, got ${JSON.stringify(findings)}`);
});

// ---------------------------------------------------------------------------
// extractComputedStyles: both browser backends + mock
// ---------------------------------------------------------------------------

asyncTest('extractComputedStyles uses the agent-browser getStyles path', async () => {
  const page = { getStyles: async (selector) => (selector === '.btn' ? { color: 'rgb(0,0,0)' } : null) };
  const styles = await audit.extractComputedStyles(page, { primaryButton: '.btn', missing: '.nope' });
  assert(styles.primaryButton.found === true && styles.primaryButton.color === 'rgb(0,0,0)', 'found style');
  assert(styles.missing.found === false, 'missing selector not found');
});

asyncTest('extractComputedStyles reports getStyles errors as not-found', async () => {
  const page = { getStyles: async () => { throw new Error('boom'); } };
  const styles = await audit.extractComputedStyles(page, { x: '.x' });
  assert(styles.x.found === false && /boom/.test(styles.x.error), 'error captured');
});

asyncTest('extractComputedStyles uses the Playwright $/evaluate path', async () => {
  const page = {
    $: async (sel) => (sel === '.btn' ? { sel } : null),
    evaluate: async (_fn, handle) => ({ color: 'rgb(1,2,3)', backgroundColor: 'rgb(4,5,6)' })
  };
  const styles = await audit.extractComputedStyles(page, { primaryButton: '.btn', gone: '.gone' });
  assert(styles.primaryButton.found === true && styles.primaryButton.color === 'rgb(1,2,3)', 'evaluate result');
  assert(styles.gone.found === false, 'null handle -> not found');
});

asyncTest('extractComputedStyles returns mockStyles without a page', async () => {
  const styles = await audit.extractComputedStyles(null, null, { mockStyles: { a: { found: true } } });
  assert(styles.a.found === true, 'mock passthrough');
});

// ---------------------------------------------------------------------------
// checkContrastRealDOM
// ---------------------------------------------------------------------------

asyncTest('checkContrastRealDOM maps DOM violations to error findings', async () => {
  const page = { evaluate: async () => ([{ tag: 'p', text: 'hi', ratio: '2.10', fg: 'rgb(0,0,0)', bg: 'rgb(10,10,10)' }]) };
  const findings = await audit.checkContrastRealDOM(page);
  assert(findings.length === 1 && findings[0].kind === 'wcag-contrast' && findings[0].severity === 'error', 'violation mapped');
});

asyncTest('checkContrastRealDOM honors mockAxeResults and catches evaluate errors', async () => {
  const mocked = await audit.checkContrastRealDOM(null, { mockAxeResults: [{ kind: 'x' }] });
  assert(mocked[0].kind === 'x', 'mock passthrough');
  const page = { evaluate: async () => { throw new Error('nope'); } };
  const errd = await audit.checkContrastRealDOM(page);
  assert(errd[0].kind === 'audit-error' && /nope/.test(errd[0].message), 'evaluate error captured');
});

// ---------------------------------------------------------------------------
// screenshot + visualRegression (real temp files)
// ---------------------------------------------------------------------------

asyncTest('screenshot writes a file to the target dir', async () => {
  const dir = path.join(mkProject('godpowers-runtime-audit-shot-'), 'shots');
  let written = null;
  const page = { screenshot: async ({ path: p }) => { fs.writeFileSync(p, 'PNG'); written = p; } };
  const out = await audit.screenshot(page, dir, 'main');
  assert(out === path.join(dir, 'main.png'), 'returns the path');
  assert(written && fs.existsSync(written), 'file written');
});

test('visualRegression captures a baseline, then detects a size change', () => {
  const root = mkProject('godpowers-runtime-audit-vr-');
  const baselineDir = path.join(root, 'baseline');
  const current = path.join(root, 'main.png');
  fs.writeFileSync(current, 'x'.repeat(100));
  const first = audit.visualRegression(current, baselineDir);
  assert(first.baseline === true && first.changed === false, 'first run is baseline');
  const second = audit.visualRegression(current, baselineDir);
  assert(second.baseline === false && second.changed === false, 'identical size unchanged');
  fs.writeFileSync(current, 'x'.repeat(1000));
  const third = audit.visualRegression(current, baselineDir);
  assert(third.changed === true && third.deltaPct > 5, `size delta should flag, got ${third.deltaPct}`);
});

// ---------------------------------------------------------------------------
// auditPage mock injection (deterministic, no real browser)
// ---------------------------------------------------------------------------

asyncTest('auditPage returns the injected mock browser result', async () => {
  const root = mkProject('godpowers-runtime-audit-page-');
  const result = await audit.auditPage('http://localhost/', DESIGN, {
    projectRoot: root,
    mockBrowserResult: { findings: [{ severity: 'error', kind: 'k' }], summary: { errors: 1, warnings: 0, infos: 0 } }
  });
  assert(result.backend === 'mock', 'mock backend');
  assert(result.findings.length === 1 && result.summary.errors === 1, 'mock findings/summary returned');
});

report('Runtime audit tests');
