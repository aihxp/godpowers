#!/usr/bin/env node
/**
 * Behavioral tests for Phase 4 linkage foundation:
 *   lib/linkage.js
 *   lib/code-scanner.js
 *   lib/drift-detector.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const linkage = require('../lib/linkage');
const scanner = require('../lib/code-scanner');
const drift = require('../lib/drift-detector');

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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-linkage-test-'));
  fs.mkdirSync(path.join(tmp, '.godpowers'), { recursive: true });
  return tmp;
}

console.log('\n  Linkage / scanner / drift behavioral tests\n');

// ============================================================================
// linkage.classifyId
// ============================================================================

test('classifyId recognizes PRD requirement', () => {
  if (linkage.classifyId('P-MUST-01') !== 'prd') throw new Error('PRD missed');
  if (linkage.classifyId('P-SHOULD-12') !== 'prd') throw new Error('SHOULD missed');
  if (linkage.classifyId('P-COULD-99') !== 'prd') throw new Error('COULD missed');
});

test('classifyId recognizes ADR', () => {
  if (linkage.classifyId('ADR-007') !== 'adr') throw new Error('ADR missed');
});

test('classifyId recognizes container', () => {
  if (linkage.classifyId('C-auth-service') !== 'container') throw new Error('container missed');
});

test('classifyId recognizes design component', () => {
  if (linkage.classifyId('D-button-primary') !== 'design') throw new Error('component missed');
});

test('classifyId recognizes design token path', () => {
  if (linkage.classifyId('colors.primary') !== 'token') throw new Error('token missed');
  if (linkage.classifyId('typography.display') !== 'token') throw new Error('typo token');
});

test('classifyId returns unknown for garbage', () => {
  if (linkage.classifyId('random-string') !== 'unknown') throw new Error('should be unknown');
  if (linkage.classifyId('') !== 'unknown') throw new Error('empty should be unknown');
});

// ============================================================================
// linkage add/remove/query
// ============================================================================

test('addLink creates bidirectional entries', () => {
  const tmp = mkTmp();
  linkage.addLink(tmp, 'P-MUST-01', 'src/auth/login.ts');
  const fwd = linkage.readForward(tmp);
  const rev = linkage.readReverse(tmp);
  if (!fwd['P-MUST-01']) throw new Error('forward missing');
  if (!fwd['P-MUST-01'].includes('src/auth/login.ts')) throw new Error('forward content');
  if (!rev['src/auth/login.ts']) throw new Error('reverse missing');
  if (!rev['src/auth/login.ts'].includes('P-MUST-01')) throw new Error('reverse content');
});

test('addLink is idempotent (no duplicates)', () => {
  const tmp = mkTmp();
  linkage.addLink(tmp, 'P-MUST-01', 'src/auth/login.ts');
  linkage.addLink(tmp, 'P-MUST-01', 'src/auth/login.ts');
  const fwd = linkage.readForward(tmp);
  if (fwd['P-MUST-01'].length !== 1) {
    throw new Error(`expected 1 entry, got ${fwd['P-MUST-01'].length}`);
  }
});

test('addLink supports multiple files per artifact', () => {
  const tmp = mkTmp();
  linkage.addLink(tmp, 'P-MUST-01', 'src/auth/login.ts');
  linkage.addLink(tmp, 'P-MUST-01', 'src/auth/session.ts');
  const fwd = linkage.readForward(tmp);
  if (fwd['P-MUST-01'].length !== 2) throw new Error('should have 2');
});

test('addLink supports multiple artifacts per file', () => {
  const tmp = mkTmp();
  linkage.addLink(tmp, 'P-MUST-01', 'src/auth/login.ts');
  linkage.addLink(tmp, 'ADR-007', 'src/auth/login.ts');
  const rev = linkage.readReverse(tmp);
  if (rev['src/auth/login.ts'].length !== 2) throw new Error('should have 2');
});

test('removeLink clears bidirectional entries', () => {
  const tmp = mkTmp();
  linkage.addLink(tmp, 'P-MUST-01', 'src/auth/login.ts');
  const r = linkage.removeLink(tmp, 'P-MUST-01', 'src/auth/login.ts');
  if (!r.removed) throw new Error('not removed');
  const fwd = linkage.readForward(tmp);
  if (fwd['P-MUST-01']) throw new Error('forward still present');
});

test('queryByArtifact returns linked files', () => {
  const tmp = mkTmp();
  linkage.addLink(tmp, 'P-MUST-01', 'src/a.ts');
  linkage.addLink(tmp, 'P-MUST-01', 'src/b.ts');
  const files = linkage.queryByArtifact(tmp, 'P-MUST-01');
  if (files.length !== 2) throw new Error(`expected 2, got ${files.length}`);
});

test('queryByFile returns linked artifact IDs', () => {
  const tmp = mkTmp();
  linkage.addLink(tmp, 'P-MUST-01', 'src/auth/login.ts');
  linkage.addLink(tmp, 'ADR-007', 'src/auth/login.ts');
  const ids = linkage.queryByFile(tmp, 'src/auth/login.ts');
  if (ids.length !== 2) throw new Error(`expected 2, got ${ids.length}`);
});

test('listOrphans identifies unlinked artifact IDs', () => {
  const tmp = mkTmp();
  linkage.addLink(tmp, 'P-MUST-01', 'src/a.ts');
  const orphans = linkage.listOrphans(tmp, ['P-MUST-01', 'P-MUST-02', 'P-MUST-03']);
  if (orphans.length !== 2) throw new Error(`expected 2 orphans, got ${orphans.length}`);
  if (!orphans.includes('P-MUST-02')) throw new Error('P-MUST-02 orphan missing');
});

test('coverage computes linked percentage', () => {
  const tmp = mkTmp();
  linkage.addLink(tmp, 'P-MUST-01', 'src/a.ts');
  const cov = linkage.coverage(tmp, ['P-MUST-01', 'P-MUST-02']);
  if (cov !== 0.5) throw new Error(`expected 0.5, got ${cov}`);
});

test('appendLog writes to LINKAGE-LOG.md', () => {
  const tmp = mkTmp();
  linkage.addLink(tmp, 'P-MUST-01', 'src/a.ts');
  const logFile = linkage.logPath(tmp);
  if (!fs.existsSync(logFile)) throw new Error('log not created');
  const content = fs.readFileSync(logFile, 'utf8');
  if (!content.includes('P-MUST-01')) throw new Error('log entry missing');
});

// ============================================================================
// scanner.parseAnnotation
// ============================================================================

test('parseAnnotation catches Implements: P-MUST-01', () => {
  const ids = scanner.parseAnnotation('// Implements: P-MUST-01');
  if (!ids.includes('P-MUST-01')) throw new Error('not caught');
});

test('parseAnnotation catches Python comment', () => {
  const ids = scanner.parseAnnotation('# Implements: P-MUST-02');
  if (!ids.includes('P-MUST-02')) throw new Error('not caught');
});

test('parseAnnotation catches multiple IDs in comma list', () => {
  const ids = scanner.parseAnnotation('// Implements: P-MUST-01, ADR-007');
  if (!ids.includes('P-MUST-01')) throw new Error('first missed');
  if (!ids.includes('ADR-007')) throw new Error('second missed');
});

test('parseAnnotation catches inline ADR mention', () => {
  const ids = scanner.parseAnnotation('// follows ADR-007 pattern');
  if (!ids.includes('ADR-007')) throw new Error('not caught');
});

test('parseAnnotation catches Token: {colors.primary}', () => {
  const ids = scanner.parseAnnotation('// Token: {colors.primary}');
  if (!ids.includes('colors.primary')) throw new Error('not caught');
});

test('parseAnnotation returns empty for unrelated comment', () => {
  const ids = scanner.parseAnnotation('// just a regular comment');
  if (ids.length !== 0) throw new Error(`expected 0, got ${ids.length}`);
});

// ============================================================================
// scanner.scanFile
// ============================================================================

test('scanFile picks up annotations from real file', () => {
  const tmp = mkTmp();
  const f = path.join(tmp, 'login.ts');
  fs.writeFileSync(f, `// Implements: P-MUST-01
export function login() {
  // ADR-007: short-lived sessions
  return true;
}
`);
  const links = scanner.scanFile(f);
  if (links.length !== 2) throw new Error(`expected 2, got ${links.length}`);
  if (!links.find(l => l.artifactId === 'P-MUST-01')) throw new Error('P-MUST-01 missed');
  if (!links.find(l => l.artifactId === 'ADR-007')) throw new Error('ADR-007 missed');
});

test('scanFile skips unknown extensions', () => {
  const tmp = mkTmp();
  const f = path.join(tmp, 'unrecognized.xyz');
  fs.writeFileSync(f, '// Implements: P-MUST-01');
  const links = scanner.scanFile(f);
  if (links.length !== 0) throw new Error(`expected 0, got ${links.length}`);
});

// ============================================================================
// scanner.filenameHeuristic
// ============================================================================

test('filenameHeuristic detects component file', () => {
  const tmp = mkTmp();
  const f = path.join(tmp, 'src/components/Button.tsx');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, '');
  const links = scanner.filenameHeuristic(f, tmp);
  if (!links.find(l => l.artifactId.startsWith('D-'))) throw new Error('D- not generated');
});

test('filenameHeuristic detects auth-service container', () => {
  const tmp = mkTmp();
  const f = path.join(tmp, 'src/auth/login.ts');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, '');
  const links = scanner.filenameHeuristic(f, tmp);
  if (!links.find(l => l.artifactId === 'C-auth')) throw new Error('C-auth not generated');
});

// ============================================================================
// scanner.scan (full project)
// ============================================================================

test('scan walks project tree and finds annotations', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'src/login.ts'), '// Implements: P-MUST-01\nexport function login() {}');
  fs.writeFileSync(path.join(tmp, 'src/session.ts'), '// Implements: P-MUST-02\nexport function session() {}');
  const result = scanner.scan(tmp);
  if (result.stats.annotationLinks < 2) throw new Error(`expected 2+, got ${result.stats.annotationLinks}`);
});

test('scan ignores node_modules and other ignored dirs', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, 'node_modules', 'foo'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'node_modules', 'foo', 'index.ts'), '// Implements: P-MUST-99');
  const result = scanner.scan(tmp);
  if (result.links.find(l => l.artifactId === 'P-MUST-99')) {
    throw new Error('node_modules should be ignored');
  }
});

test('applyScan persists results to linkage map', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'src/login.ts'), '// Implements: P-MUST-01');
  const scanResult = scanner.scan(tmp);
  const r = scanner.applyScan(tmp, scanResult);
  const fwd = linkage.readForward(tmp);
  if (!fwd['P-MUST-01']) throw new Error('linkage not persisted');
});

test('applyScan removes stale scan links after annotations are deleted', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
  const file = path.join(tmp, 'src/login.ts');
  fs.writeFileSync(file, '// Implements: P-MUST-01');
  scanner.applyScan(tmp, scanner.scan(tmp));
  fs.writeFileSync(file, '// annotation removed');
  const r = scanner.applyScan(tmp, scanner.scan(tmp));
  const fwd = linkage.readForward(tmp);
  const rev = linkage.readReverse(tmp);
  if (fwd['P-MUST-01']) throw new Error('stale forward link remained');
  if (rev['src/login.ts']) throw new Error('stale reverse link remained');
  if (r.removed < 1) throw new Error('removal count not reported');
});

test('applyScan preserves manual links while replacing scanner-owned links', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
  linkage.addLink(tmp, 'P-SHOULD-02', 'src/manual.ts');
  fs.writeFileSync(path.join(tmp, 'src/login.ts'), '// Implements: P-MUST-01');
  scanner.applyScan(tmp, scanner.scan(tmp));
  fs.writeFileSync(path.join(tmp, 'src/login.ts'), '// annotation removed');
  scanner.applyScan(tmp, scanner.scan(tmp));
  const fwd = linkage.readForward(tmp);
  if (fwd['P-MUST-01']) throw new Error('scanner link remained');
  if (!fwd['P-SHOULD-02']) throw new Error('manual link was removed');
});

test('applyScan migrates legacy links without source metadata', () => {
  const tmp = mkTmp();
  linkage.addLink(tmp, 'P-MUST-01', 'src/old.ts', { source: 'code-scanner' });
  fs.rmSync(linkage.sourcePath(tmp), { force: true });
  scanner.applyScan(tmp, { links: [], stats: {} });
  const fwd = linkage.readForward(tmp);
  if (fwd['P-MUST-01']) throw new Error('legacy stale link remained');
});

// ============================================================================
// scanner.styleSystemScan
// ============================================================================

test('styleSystemScan picks up CSS var() references', () => {
  const tmp = mkTmp();
  const f = path.join(tmp, 'styles.css');
  fs.writeFileSync(f, '.button { color: var(--colors-primary); }');
  const links = scanner.styleSystemScan(f);
  if (!links.find(l => l.artifactId === 'colors.primary')) {
    throw new Error('CSS var not detected');
  }
});

test('styleSystemScan picks up {token.path} references', () => {
  const tmp = mkTmp();
  const f = path.join(tmp, 'theme.tsx');
  fs.writeFileSync(f, 'const c = "{colors.primary}";\nconst sp = "{spacing.md}";');
  const links = scanner.styleSystemScan(f);
  if (!links.find(l => l.artifactId === 'colors.primary')) throw new Error('colors.primary missed');
  if (!links.find(l => l.artifactId === 'spacing.md')) throw new Error('spacing.md missed');
});

// ============================================================================
// drift detector
// ============================================================================

test('detectDesignTokenDrift flags removed tokens', () => {
  const tmp = mkTmp();
  // Link a file to a token
  linkage.addLink(tmp, 'colors.removed', 'src/old.css');
  const designContent = `---
name: Test
colors:
  primary: "#000000"
---
## Overview`;
  const findings = drift.detectDesignTokenDrift(tmp, designContent);
  if (!findings.find(f => f.kind === 'design-token-drift')) {
    throw new Error('drift not detected');
  }
});

test('detectDesignTokenDrift accepts valid tokens', () => {
  const tmp = mkTmp();
  linkage.addLink(tmp, 'colors.primary', 'src/comp.css');
  const designContent = `---
name: Test
colors:
  primary: "#000000"
---
## Overview`;
  const findings = drift.detectDesignTokenDrift(tmp, designContent);
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

test('detectStackVersionDrift flags major version mismatch', () => {
  const tmp = mkTmp();
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({
    dependencies: { 'next': '^13.5.0' }
  }));
  const stackContent = `## Selected Stack

| Concern | Choice | Lock-in |
|---------|--------|---------|
| Web framework | Next.js 15 | Medium |`;
  const findings = drift.detectStackVersionDrift(tmp, stackContent);
  if (!findings.find(f => f.kind === 'stack-version-drift')) {
    throw new Error('drift not detected');
  }
});

test('detectAll returns aggregated findings', () => {
  const tmp = mkTmp();
  linkage.addLink(tmp, 'colors.gone', 'src/old.css');
  fs.writeFileSync(path.join(tmp, 'DESIGN.md'), `---
name: Test
colors:
  primary: "#000000"
---`);
  const result = drift.detectAll(tmp);
  if (result.summary.errors === 0) throw new Error('expected errors');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
