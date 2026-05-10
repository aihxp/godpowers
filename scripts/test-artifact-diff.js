#!/usr/bin/env node
/**
 * Behavioral tests for lib/artifact-diff.js (regression detection).
 */

const diff = require('../lib/artifact-diff');

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

console.log('\n  Artifact diff behavioral tests\n');

test('extractSections splits content by ## headings', () => {
  const content = `# Title

## Section A

Body of A.

## Section B

Body of B.`;
  const sections = diff.extractSections(content);
  if (!sections['Section A']) throw new Error('Section A missing');
  if (!sections['Section B']) throw new Error('Section B missing');
  if (!sections['Section A'].includes('Body of A')) throw new Error('Section A body lost');
});

test('extractSections returns empty for content with no ## headings', () => {
  const sections = diff.extractSections('# Title only\n\nNo h2 sections.');
  if (Object.keys(sections).length !== 0) throw new Error('expected 0 sections');
});

test('countLabels counts DECISION, HYPOTHESIS, OPEN QUESTION', () => {
  const content = `[DECISION] one
[DECISION] two
[HYPOTHESIS] three
[OPEN QUESTION] four`;
  const counts = diff.countLabels(content);
  if (counts.DECISION !== 2) throw new Error(`DECISION expected 2, got ${counts.DECISION}`);
  if (counts.HYPOTHESIS !== 1) throw new Error(`HYPOTHESIS expected 1`);
  if (counts['OPEN QUESTION'] !== 1) throw new Error('OQ expected 1');
});

test('countListItems counts bullet items', () => {
  const content = `- item one
- item two
* item three
  * nested`;
  const count = diff.countListItems(content);
  if (count !== 4) throw new Error(`expected 4, got ${count}`);
});

test('diffArtifacts detects removed section as regression', () => {
  const oldContent = `## Section A\n\nbody`;
  const newContent = `# only title`;
  const result = diff.diffArtifacts(oldContent, newContent);
  if (!result.regression) throw new Error('should be regression');
  const removed = result.changes.find(c => c.kind === 'section-removed');
  if (!removed) throw new Error('section-removed not detected');
});

test('diffArtifacts detects added section as info', () => {
  const oldContent = `## Section A\n\nbody`;
  const newContent = `## Section A\n\nbody\n\n## Section B\n\nnew`;
  const result = diff.diffArtifacts(oldContent, newContent);
  const added = result.changes.find(c => c.kind === 'section-added');
  if (!added) throw new Error('section-added not detected');
  if (added.severity !== 'info') throw new Error('should be info severity');
});

test('diffArtifacts detects DECISION downgrade as regression', () => {
  const oldContent = `## A\n\n[DECISION] one\n[DECISION] two`;
  const newContent = `## A\n\n[DECISION] one\n[HYPOTHESIS] two`;
  const result = diff.diffArtifacts(oldContent, newContent);
  if (!result.regression) throw new Error('should be regression');
  const downgrade = result.changes.find(c => c.kind === 'decision-downgraded');
  if (!downgrade) throw new Error('downgrade not detected');
});

test('diffArtifacts detects acceptance criteria reduction', () => {
  const oldContent = `## Functional Requirements

- req one
- req two
- req three`;
  const newContent = `## Functional Requirements

- req one`;
  const result = diff.diffArtifacts(oldContent, newContent);
  const reduced = result.changes.find(c => c.kind === 'acceptance-reduced');
  if (!reduced) throw new Error('acceptance-reduced not detected');
});

test('diffArtifacts detects new open questions', () => {
  const oldContent = `## Open Questions\n\n[OPEN QUESTION] one`;
  const newContent = `## Open Questions\n\n[OPEN QUESTION] one\n[OPEN QUESTION] two`;
  const result = diff.diffArtifacts(oldContent, newContent);
  const added = result.changes.find(c => c.kind === 'open-question-added');
  if (!added) throw new Error('open-question-added not detected');
  if (added.severity !== 'info') throw new Error('should be info');
});

test('diffArtifacts no regression on identical content', () => {
  const content = `## A\n\n[DECISION] same`;
  const result = diff.diffArtifacts(content, content);
  if (result.regression) throw new Error('should not be regression');
  if (result.changes.length !== 0) throw new Error(`expected 0 changes, got ${result.changes.length}`);
});

test('diffArtifacts no regression on adding more decisions', () => {
  const oldContent = `## A\n\n[DECISION] one`;
  const newContent = `## A\n\n[DECISION] one\n[DECISION] two`;
  const result = diff.diffArtifacts(oldContent, newContent);
  if (result.regression) throw new Error('adding decisions should not be regression');
});

test('diffArtifacts handles empty inputs gracefully', () => {
  const result = diff.diffArtifacts('', '');
  if (result.regression) throw new Error('empty diff should not regress');
  if (result.changes.length !== 0) throw new Error('empty diff should have no changes');
});

test('formatDiff produces readable output', () => {
  const result = {
    regression: true,
    changes: [
      { kind: 'section-removed', severity: 'error', section: 'A', message: 'A removed' }
    ]
  };
  const output = diff.formatDiff(result);
  if (!output.includes('YES')) throw new Error('regression flag missing');
  if (!output.includes('section-removed')) throw new Error('change kind missing');
});

test('end-to-end: PRD evolution with multiple regressions', () => {
  const oldPrd = `## Problem Statement

[DECISION] specific problem

## Functional Requirements

- req one
- req two
- req three

## Scope and No-Gos

### Explicitly NOT in scope
- mobile`;

  const newPrd = `## Problem Statement

[HYPOTHESIS] less certain now

## Functional Requirements

- req one`;

  const result = diff.diffArtifacts(oldPrd, newPrd);
  if (!result.regression) throw new Error('should be regression');

  const removedSection = result.changes.find(c => c.kind === 'section-removed' && c.section === 'Scope and No-Gos');
  if (!removedSection) throw new Error('Scope removal not detected');

  const downgrade = result.changes.find(c => c.kind === 'decision-downgraded');
  if (!downgrade) throw new Error('downgrade not detected');

  const reduced = result.changes.find(c => c.kind === 'acceptance-reduced');
  if (!reduced) throw new Error('acceptance reduction not detected');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
