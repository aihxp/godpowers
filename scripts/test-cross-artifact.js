#!/usr/bin/env node
/**
 * Behavioral tests for Phase 8 cross-artifact impact.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ca = require('../lib/cross-artifact-impact');

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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-cross-artifact-test-'));
}

console.log('\n  Cross-artifact impact behavioral tests\n');

// ============================================================================
// suggestArtifactReviews
// ============================================================================

test('PRD requirement removal suggests ARCH review', () => {
  const tmp = mkTmp();
  const oldPrd = `## Functional Requirements\n- P-MUST-01\n- P-MUST-02`;
  const newPrd = `## Functional Requirements\n- P-MUST-01`;
  const r = ca.suggestArtifactReviews(tmp, 'prd', oldPrd, newPrd);
  if (!r.find(s => s.targetType === 'arch')) throw new Error('ARCH not suggested');
});

test('PRD requirement removal suggests ROADMAP review', () => {
  const tmp = mkTmp();
  const oldPrd = `## Functional Requirements\n- P-MUST-01\n- P-MUST-02`;
  const newPrd = `## Functional Requirements\n- P-MUST-01`;
  const r = ca.suggestArtifactReviews(tmp, 'prd', oldPrd, newPrd);
  if (!r.find(s => s.targetType === 'roadmap')) throw new Error('ROADMAP not suggested');
});

test('PRD with no ID changes returns no suggestions', () => {
  const tmp = mkTmp();
  const content = `## Functional Requirements\n- P-MUST-01`;
  const r = ca.suggestArtifactReviews(tmp, 'prd', content, content);
  // No removals or additions, but section diff may still trigger
  // Verify it's empty or only design/info-level
  const warnings = r.filter(s => s.severity !== 'info');
  if (warnings.length > 0) throw new Error('unexpected warnings on no-op diff');
});

test('ARCH container removal suggests DESIGN review', () => {
  const tmp = mkTmp();
  const oldArch = `## Containers\n- C-auth-service\n- C-billing`;
  const newArch = `## Containers\n- C-auth-service`;
  const r = ca.suggestArtifactReviews(tmp, 'arch', oldArch, newArch);
  if (!r.find(s => s.targetType === 'design')) throw new Error('DESIGN not suggested');
});

test('STACK addition suggests ARCH review', () => {
  const tmp = mkTmp();
  const oldStack = `## Stack\n- S-postgres-15`;
  const newStack = `## Stack\n- S-postgres-15\n- S-redis-7`;
  const r = ca.suggestArtifactReviews(tmp, 'stack', oldStack, newStack);
  if (!r.find(s => s.targetType === 'arch')) throw new Error('ARCH not suggested');
});

test('STACK UI framework change suggests DESIGN review', () => {
  const tmp = mkTmp();
  const oldStack = `## Stack\n- next.js 14`;
  const newStack = `## Stack\n- vue 3`;
  const r = ca.suggestArtifactReviews(tmp, 'stack', oldStack, newStack);
  if (!r.find(s => s.targetType === 'design')) throw new Error('DESIGN not suggested');
});

test('DESIGN component change suggests ARCH info-level review', () => {
  const tmp = mkTmp();
  const oldDesign = `---
name: T
components:
  card:
    backgroundColor: "#000"
---`;
  const newDesign = `---
name: T
components:
  card:
    backgroundColor: "#111"
  button:
    backgroundColor: "#fff"
---`;
  const r = ca.suggestArtifactReviews(tmp, 'design', oldDesign, newDesign);
  if (!r.find(s => s.targetType === 'arch')) throw new Error('ARCH info-level not suggested');
});

// ============================================================================
// forArtifactPair
// ============================================================================

test('forArtifactPair detects cross-reference to removed PRD requirement', () => {
  const tmp = mkTmp();
  const oldPrd = `P-MUST-01\nP-MUST-02`;
  const newPrd = `P-MUST-01`;
  const archContent = `## ADRs\nADR-007 implements P-MUST-02 for auth.`;
  const result = ca.forArtifactPair(tmp, 'prd', oldPrd, newPrd, 'arch', archContent);
  if (result.impacts.length === 0) throw new Error('cross-reference not detected');
  if (!result.impacts[0].sourceId.includes('P-MUST-02')) throw new Error('wrong source');
});

test('forArtifactPair returns empty when no rule matches', () => {
  const tmp = mkTmp();
  const oldPrd = `P-MUST-01`;
  const newPrd = `P-MUST-01`;
  const archContent = `arch content`;
  const result = ca.forArtifactPair(tmp, 'prd', oldPrd, newPrd, 'arch', archContent);
  if (result.impacts.length !== 0) throw new Error('unexpected impacts');
});

test('IMPACT_RULES has rules for major artifact types', () => {
  if (!ca.IMPACT_RULES.prd) throw new Error('PRD rules missing');
  if (!ca.IMPACT_RULES.arch) throw new Error('ARCH rules missing');
  if (!ca.IMPACT_RULES.stack) throw new Error('STACK rules missing');
  if (!ca.IMPACT_RULES.design) throw new Error('DESIGN rules missing');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
