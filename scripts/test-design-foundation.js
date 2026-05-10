#!/usr/bin/env node
/**
 * Behavioral tests for Phase 3 design foundation:
 *   lib/design-detector.js
 *   lib/design-spec.js
 *   lib/impeccable-bridge.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const detector = require('../lib/design-detector');
const spec = require('../lib/design-spec');
const bridge = require('../lib/impeccable-bridge');

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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-design-test-'));
}

console.log('\n  Design foundation behavioral tests\n');

// ============================================================================
// design-detector
// ============================================================================

test('detector picks up React from package.json', () => {
  const tmp = mkTmp();
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({
    dependencies: { react: '^18.0.0' }
  }));
  const result = detector.isUiProject(tmp);
  if (!result.required) throw new Error('UI not detected');
  if (!result.frameworks.includes('react')) throw new Error('react not listed');
});

test('detector picks up Next.js', () => {
  const tmp = mkTmp();
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({
    dependencies: { next: '^15.0.0', react: '^18.0.0' }
  }));
  const result = detector.isUiProject(tmp);
  if (!result.frameworks.includes('next.js')) throw new Error('next.js not listed');
});

test('detector picks up Vue', () => {
  const tmp = mkTmp();
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({
    dependencies: { vue: '^3.0.0' }
  }));
  const result = detector.isUiProject(tmp);
  if (!result.frameworks.includes('vue')) throw new Error('vue not listed');
});

test('detector picks up Svelte', () => {
  const tmp = mkTmp();
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({
    dependencies: { svelte: '^4.0.0' }
  }));
  const result = detector.isUiProject(tmp);
  if (!result.frameworks.includes('svelte')) throw new Error('svelte not listed');
});

test('detector picks up Flutter via pubspec.yaml', () => {
  const tmp = mkTmp();
  fs.writeFileSync(path.join(tmp, 'pubspec.yaml'), 'name: app\nflutter:\n  sdk: flutter\n');
  const result = detector.isUiProject(tmp);
  if (!result.frameworks.includes('flutter')) throw new Error('flutter not listed');
});

test('detector returns false for backend-only project', () => {
  const tmp = mkTmp();
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({
    dependencies: { express: '^4.0.0' }
  }));
  const result = detector.isUiProject(tmp);
  if (result.required) throw new Error('false positive on backend-only');
});

test('detector returns false on empty project', () => {
  const tmp = mkTmp();
  const result = detector.isUiProject(tmp);
  if (result.required) throw new Error('false positive on empty');
});

test('detector reads STACK/DECISION.md as a signal', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, '.godpowers', 'stack'), { recursive: true });
  fs.writeFileSync(path.join(tmp, '.godpowers', 'stack', 'DECISION.md'),
    '# Stack\n\nWe use Next.js for the frontend.');
  const result = detector.isUiProject(tmp);
  if (!result.required) throw new Error('STACK signal not used');
  if (!result.signals.includes('stack-decision')) throw new Error('signal not labeled');
});

test('detector finds tailwind as UI signal', () => {
  const tmp = mkTmp();
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({
    devDependencies: { tailwindcss: '^3.0.0' }
  }));
  const result = detector.isUiProject(tmp);
  if (!result.required) throw new Error('tailwind not detected as UI');
});

test('isImpeccableInstalled returns false for empty project', () => {
  const tmp = mkTmp();
  const result = detector.isImpeccableInstalled(tmp);
  if (result.installed) throw new Error('false positive');
});

test('isImpeccableInstalled detects .claude/skills/impeccable', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, '.claude', 'skills', 'impeccable'), { recursive: true });
  const result = detector.isImpeccableInstalled(tmp);
  if (!result.installed) throw new Error('.claude install not detected');
});

test('isImpeccableInstalled detects multiple tool installs', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, '.claude', 'skills', 'impeccable'), { recursive: true });
  fs.mkdirSync(path.join(tmp, '.cursor', 'skills', 'impeccable'), { recursive: true });
  const result = detector.isImpeccableInstalled(tmp);
  if (result.locations.length < 2) {
    throw new Error(`expected 2+ locations, got ${result.locations.length}`);
  }
});

// ============================================================================
// design-spec
// ============================================================================

const VALID_DESIGN = `---
name: TestSystem
description: A test design system
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
typography:
  display:
    fontFamily: "Public Sans"
    fontSize: "3rem"
spacing:
  sm: "8px"
  md: "16px"
components:
  card:
    backgroundColor: "{colors.primary}"
    rounded: "8px"
---

## Overview

[DECISION] A clean test design system.

## Colors

[DECISION] Two-color palette.
`;

test('spec.parse extracts frontmatter and body', () => {
  const result = spec.parse(VALID_DESIGN);
  if (!result.frontmatter) throw new Error('no frontmatter');
  if (result.frontmatter.name !== 'TestSystem') throw new Error('name not parsed');
  if (!result.body.includes('## Overview')) throw new Error('body missing');
});

test('spec.parse fails gracefully without frontmatter', () => {
  const result = spec.parse('# No frontmatter here');
  if (result.errors.length === 0) throw new Error('should error');
});

test('spec.parse fails on unclosed frontmatter', () => {
  const result = spec.parse('---\nname: Test\n# never closed');
  if (result.errors.length === 0) throw new Error('should error');
});

test('spec.validate accepts valid frontmatter', () => {
  const parsed = spec.parse(VALID_DESIGN);
  const r = spec.validate(parsed);
  const errors = r.findings.filter(f => f.severity === 'error');
  if (errors.length !== 0) throw new Error(`expected 0 errors, got ${errors.length}`);
});

test('spec.validate flags missing name', () => {
  const result = spec.validate({ frontmatter: { description: 'foo' } });
  if (!result.findings.find(f => f.code === 'D-NAME')) throw new Error('D-NAME missing');
});

test('spec.resolveTokens accepts resolved references', () => {
  const parsed = spec.parse(VALID_DESIGN);
  const r = spec.resolveTokens(parsed);
  if (r.findings.length !== 0) throw new Error(`expected 0, got ${r.findings.length}`);
});

test('spec.resolveTokens flags unresolved reference', () => {
  const broken = `---
name: Broken
colors:
  primary: "#000000"
components:
  card:
    backgroundColor: "{colors.nonexistent}"
---`;
  const parsed = spec.parse(broken);
  const r = spec.resolveTokens(parsed);
  if (!r.findings.find(f => f.code === 'D-TOKEN-REF')) throw new Error('D-TOKEN-REF missing');
});

test('spec.sectionOrder accepts canonical order', () => {
  const body = `## Overview

text

## Colors

text

## Typography

text`;
  const r = spec.sectionOrder(body);
  const errors = r.findings.filter(f => f.severity === 'error');
  if (errors.length !== 0) throw new Error(`expected 0, got ${errors.length}`);
});

test('spec.sectionOrder flags out-of-order sections', () => {
  const body = `## Typography

text

## Overview

text`;
  const r = spec.sectionOrder(body);
  if (!r.findings.find(f => f.code === 'D-SECTION-ORDER')) {
    throw new Error('D-SECTION-ORDER not raised');
  }
});

test('spec.sectionOrder flags duplicates', () => {
  const body = `## Colors

text

## Colors

duplicate`;
  const r = spec.sectionOrder(body);
  if (!r.findings.find(f => f.code === 'D-SECTION-DUP')) {
    throw new Error('D-SECTION-DUP not raised');
  }
});

test('spec.contrastRatio computes correctly for known pair', () => {
  // Black on white = 21:1 (max)
  const ratio = spec.contrastRatio('#000000', '#FFFFFF');
  if (Math.abs(ratio - 21) > 0.1) throw new Error(`expected 21, got ${ratio}`);
});

test('spec.contrastCheck flags WCAG fail', () => {
  const broken = `---
name: Broken
colors:
  bg: "#fda4af"
  fg: "#ffffff"
components:
  cta:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
---`;
  const parsed = spec.parse(broken);
  const r = spec.contrastCheck(parsed);
  if (!r.findings.find(f => f.code === 'D-CONTRAST' && f.severity === 'error')) {
    throw new Error('contrast fail not detected');
  }
});

test('spec.lint runs all checks together', () => {
  const result = spec.lint(VALID_DESIGN);
  if (!result.valid) {
    throw new Error(`valid DESIGN rejected: ${JSON.stringify(result.findings)}`);
  }
});

test('spec.lint rejects multi-violating DESIGN', () => {
  const broken = `# no frontmatter`;
  const result = spec.lint(broken);
  if (result.valid) throw new Error('broken DESIGN accepted');
});

// ============================================================================
// impeccable-bridge
// ============================================================================

test('bridge.isInstalled returns false on empty project', () => {
  const tmp = mkTmp();
  if (bridge.isInstalled(tmp)) throw new Error('false positive');
});

test('bridge.isInstalled returns true with .claude install', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, '.claude', 'skills', 'impeccable'), { recursive: true });
  if (!bridge.isInstalled(tmp)) throw new Error('install not detected');
});

test('bridge.getInstallation identifies primary tool', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, '.claude', 'skills', 'impeccable'), { recursive: true });
  const r = bridge.getInstallation(tmp);
  if (r.primaryTool !== 'claude-code') throw new Error(`primary tool wrong: ${r.primaryTool}`);
});

test('bridge.runDetect returns not-installed when impeccable absent', () => {
  const tmp = mkTmp();
  const r = bridge.runDetect('foo', { cwd: tmp });
  if (r.error !== 'not-installed') throw new Error(`expected not-installed, got ${r.error}`);
});

test('bridge.commandMap covers all 23 impeccable commands', () => {
  const map = bridge.commandMap();
  if (Object.keys(map).length < 23) {
    throw new Error(`expected 23+, got ${Object.keys(map).length}`);
  }
  if (!map['/god-design polish']) throw new Error('polish missing');
  if (!map['/god-design refresh']) throw new Error('refresh alias missing');
});

test('bridge.describeBridge returns metadata', () => {
  const meta = bridge.describeBridge();
  if (!meta.commands.includes('teach')) throw new Error('teach command missing');
  if (!meta.commands.includes('polish')) throw new Error('polish command missing');
  if (!meta.sourcedFrom.includes('pbakaus/impeccable')) throw new Error('source missing');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
