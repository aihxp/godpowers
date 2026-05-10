#!/usr/bin/env node
/**
 * Behavioral tests for lib/have-nots-validator.js + lib/artifact-linter.js.
 *
 * Each test produces a violating artifact, asserts the right have-not
 * is caught. Or produces a passing artifact, asserts no findings.
 *
 * This is the down-payment on the "structural-only tests" gap from the
 * production-ready evaluation.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const validator = require('../lib/have-nots-validator');
const linter = require('../lib/artifact-linter');

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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-linter-test-'));
}

function hasFinding(findings, code) {
  return findings.some(f => f.code === code);
}

function findingsByCode(findings, code) {
  return findings.filter(f => f.code === code);
}

console.log('\n  Have-nots validator + artifact linter behavioral tests\n');

// ============================================================================
// U-08 em/en dash
// ============================================================================

test('U-08 catches em dash in body content', () => {
  const findings = validator.checkEmEnDash('A normal sentence — with an em dash.');
  if (!hasFinding(findings, 'U-08')) throw new Error('em dash not caught');
});

test('U-08 catches en dash', () => {
  const findings = validator.checkEmEnDash('Pages 10–15 of the spec.');
  if (!hasFinding(findings, 'U-08')) throw new Error('en dash not caught');
});

test('U-08 finds zero in clean content', () => {
  const findings = validator.checkEmEnDash('No fancy dashes here, just plain ASCII.');
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

test('U-08 reports correct line number', () => {
  const content = 'Line 1\nLine 2 with — em dash\nLine 3';
  const findings = validator.checkEmEnDash(content);
  if (findings[0].line !== 2) throw new Error(`expected line 2, got ${findings[0].line}`);
});

// ============================================================================
// U-09 emoji
// ============================================================================

test('U-09 catches face emoji', () => {
  const findings = validator.checkEmoji('Status: shipped 🚀 successfully');
  if (!hasFinding(findings, 'U-09')) throw new Error('emoji not caught');
});

test('U-09 catches multiple emoji on same line', () => {
  const findings = validator.checkEmoji('Done ✅ and ready 🎉 to go');
  if (findings.length < 2) throw new Error(`expected 2+, got ${findings.length}`);
});

test('U-09 ignores plain ASCII status markers', () => {
  const findings = validator.checkEmoji('Done [x] and ready (+) to go');
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

// ============================================================================
// U-02 unlabeled sentences
// ============================================================================

test('U-02 catches unlabeled sentence in paragraph body', () => {
  const content = `# Header

This is a sentence without any label. It has substance and length.

[DECISION] This one is properly labeled and long enough to count.`;
  const findings = validator.checkUnlabeled(content);
  const u02 = findingsByCode(findings, 'U-02');
  if (u02.length === 0) throw new Error('unlabeled sentence not caught');
});

test('U-02 ignores properly labeled sentences', () => {
  const content = `# Header

[DECISION] This is a properly labeled decision sentence with content.

[HYPOTHESIS] This is a hypothesis with content for testing purposes.`;
  const findings = validator.checkUnlabeled(content);
  const u02 = findingsByCode(findings, 'U-02');
  if (u02.length !== 0) throw new Error(`expected 0, got ${u02.length}: ${JSON.stringify(u02[0])}`);
});

test('U-02 ignores headings, table rows, and code blocks', () => {
  const content = `# Heading

| Col1 | Col2 |
|------|------|
| Row1 | Row2 |

\`\`\`
code line that should not be checked for labels at all here
\`\`\``;
  const findings = validator.checkUnlabeled(content);
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

// ============================================================================
// U-10 phantom reference
// ============================================================================

test('U-10 catches link to non-existent file', () => {
  const tmp = mkTmp();
  const file = path.join(tmp, 'doc.md');
  fs.writeFileSync(file, 'See [this link](./does-not-exist.md) for info.');
  const findings = validator.checkPhantomRef(fs.readFileSync(file, 'utf8'), {
    projectRoot: tmp, docDir: tmp
  });
  if (!hasFinding(findings, 'U-10')) throw new Error('phantom link not caught');
});

test('U-10 ignores http URLs', () => {
  const findings = validator.checkPhantomRef('See [docs](https://example.com/page) for info.', {
    projectRoot: '/tmp', docDir: '/tmp'
  });
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

test('U-10 accepts existing relative link', () => {
  const tmp = mkTmp();
  fs.writeFileSync(path.join(tmp, 'target.md'), 'target');
  const file = path.join(tmp, 'doc.md');
  fs.writeFileSync(file, 'See [target](./target.md).');
  const findings = validator.checkPhantomRef(fs.readFileSync(file, 'utf8'), {
    projectRoot: tmp, docDir: tmp
  });
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

// ============================================================================
// U-11 future date
// ============================================================================

test('U-11 catches far-future date in body', () => {
  const content = 'The launch happened on 2099-12-31 according to the report.';
  const findings = validator.checkFutureDate(content, { today: '2026-05-10' });
  if (!hasFinding(findings, 'U-11')) throw new Error('future date not caught');
});

test('U-11 ignores due dates in tables', () => {
  const content = `| Question | Owner | Due |
|----------|-------|-----|
| Pricing? | alice | 2099-12-31 |`;
  const findings = validator.checkFutureDate(content, { today: '2026-05-10' });
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

test('U-11 accepts dates in current range', () => {
  const content = 'Started on 2026-01-15 and ongoing.';
  const findings = validator.checkFutureDate(content, { today: '2026-05-10' });
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

// ============================================================================
// U-01 substitution test (partial)
// ============================================================================

test('U-01 flags generic-only sentence', () => {
  const content = 'Our app helps users be more scalable and intuitive in their workflow.';
  const findings = validator.checkSubstitution(content);
  if (!hasFinding(findings, 'U-01')) throw new Error('generic sentence not caught');
});

test('U-01 accepts sentence with specific numbers', () => {
  const content = 'Our app helps users save 30% of time by automating their reports.';
  const findings = validator.checkSubstitution(content);
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

// ============================================================================
// P-04 metric without timeline
// ============================================================================

test('P-04 catches metric without timeline', () => {
  const content = `## Success Metrics

- 50 daily active users.
- 99% uptime.`;
  const findings = validator.checkPrdMetricTimeline(content);
  if (findings.length === 0) throw new Error('metric without timeline not caught');
});

test('P-04 accepts metric with within-timeline', () => {
  const content = `## Success Metrics

- 50 daily active users within 30 days of launch.`;
  const findings = validator.checkPrdMetricTimeline(content);
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

test('P-04 accepts metric with absolute date', () => {
  const content = `## Success Metrics

- 50 daily active users by 2026-12-31 measured via analytics.`;
  const findings = validator.checkPrdMetricTimeline(content);
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

// ============================================================================
// P-07 No-Gos empty
// ============================================================================

test('P-07 catches missing No-Gos section', () => {
  const content = `## Problem Statement

We need a thing.

## Functional Requirements

- Build it.`;
  const findings = validator.checkPrdNoGos(content);
  if (!hasFinding(findings, 'P-07')) throw new Error('missing no-gos not caught');
});

test('P-07 catches empty No-Gos section', () => {
  const content = `## Scope and No-Gos

### In scope for V1
- thing one

### Explicitly NOT in scope
`;
  const findings = validator.checkPrdNoGos(content);
  if (!hasFinding(findings, 'P-07')) throw new Error('empty no-gos not caught');
});

test('P-07 accepts populated No-Gos section', () => {
  const content = `## Scope and No-Gos

### In scope for V1
- thing one

### Explicitly NOT in scope
- mobile app
- enterprise sso`;
  const findings = validator.checkPrdNoGos(content);
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

// ============================================================================
// P-08, P-09 open questions
// ============================================================================

test('P-08 catches open question without owner', () => {
  const content = `## Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| What's the pricing model? | TBD | 2026-06-01 | |`;
  const findings = validator.checkPrdOpenQuestions(content);
  if (!hasFinding(findings, 'P-08')) throw new Error('owner-missing not caught');
});

test('P-09 catches open question without due date', () => {
  const content = `## Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| What's the pricing model? | alice | TBD | |`;
  const findings = validator.checkPrdOpenQuestions(content);
  if (!hasFinding(findings, 'P-09')) throw new Error('due-missing not caught');
});

test('P-08/09 accept fully filled open question', () => {
  const content = `## Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| What's the pricing model? | alice | 2026-06-01 | |`;
  const findings = validator.checkPrdOpenQuestions(content);
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}: ${JSON.stringify(findings)}`);
});

// ============================================================================
// A-04 NFR mapping
// ============================================================================

test('A-04 catches missing NFR-to-Architecture Map section', () => {
  const archContent = `## System Context

Some context here.`;
  const prdContent = `## Non-Functional Requirements

| Category | Requirement | Source |
|----------|-------------|--------|
| Latency | p99 < 100ms | [DECISION] |`;
  const findings = validator.checkArchNfrMap(archContent, { prdContent });
  if (!hasFinding(findings, 'A-04')) throw new Error('missing map section not caught');
});

test('A-04 catches NFR not mapped', () => {
  const archContent = `## NFR-to-Architecture Map

| PRD NFR | Architectural Choice | ADR Reference |
|---------|---------------------|---------------|
| Latency | Edge caching | ADR-001 |`;
  const prdContent = `## Non-Functional Requirements

| Category | Requirement | Source |
|----------|-------------|--------|
| Latency | p99 < 100ms | [DECISION] |
| Security | OAuth 2.0 | [DECISION] |`;
  const findings = validator.checkArchNfrMap(archContent, { prdContent });
  if (!hasFinding(findings, 'A-04')) throw new Error('Security NFR not flagged');
});

test('A-04 accepts complete mapping', () => {
  const archContent = `## NFR-to-Architecture Map

| PRD NFR | Choice | ADR |
|---------|--------|-----|
| Latency | edge cache | ADR-001 |
| Security | OAuth 2.0 | ADR-002 |`;
  const prdContent = `## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Latency | p99 < 100ms |
| Security | OAuth 2.0 |`;
  const findings = validator.checkArchNfrMap(archContent, { prdContent });
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

// ============================================================================
// runChecks orchestration
// ============================================================================

test('runChecks combines universal + artifact-specific findings', () => {
  const content = `# PRD

This sentence has — an em dash and is not labeled.

## Scope and No-Gos
empty section here`;
  const findings = validator.runChecks(content, 'prd');
  if (!hasFinding(findings, 'U-08')) throw new Error('U-08 missing');
  if (!hasFinding(findings, 'P-07')) throw new Error('P-07 missing');
});

test('summarize counts severities and codes', () => {
  const findings = [
    { code: 'U-08', severity: 'error', line: 1, message: 'a' },
    { code: 'U-08', severity: 'error', line: 2, message: 'b' },
    { code: 'U-02', severity: 'warning', line: 3, message: 'c' }
  ];
  const summary = validator.summarize(findings);
  if (summary.errors !== 2) throw new Error(`errors expected 2, got ${summary.errors}`);
  if (summary.warnings !== 1) throw new Error(`warnings expected 1, got ${summary.warnings}`);
  if (summary.byCode['U-08'] !== 2) throw new Error('U-08 count wrong');
});

// ============================================================================
// linter (high-level)
// ============================================================================

test('linter detectType identifies PRD path', () => {
  if (linter.detectType('.godpowers/prd/PRD.md') !== 'prd') throw new Error('PRD detection');
  if (linter.detectType('/foo/.godpowers/arch/ARCH.md') !== 'arch') throw new Error('ARCH detection');
  if (linter.detectType('DESIGN.md') !== 'design') throw new Error('DESIGN detection');
  if (linter.detectType('PRODUCT.md') !== 'product') throw new Error('PRODUCT detection');
});

test('linter detectType returns null for unknown', () => {
  if (linter.detectType('random.md') !== null) throw new Error('should be null');
});

test('linter lintFile produces structured output for clean PRD', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, '.godpowers', 'prd'), { recursive: true });
  const file = path.join(tmp, '.godpowers', 'prd', 'PRD.md');
  fs.writeFileSync(file, `# PRD

## Problem Statement

[DECISION] Solo founders cannot decompose MRR change between new and price increases.

## Success Metrics

- [DECISION] 50 daily active users within 30 days, measured via analytics.

## Scope and No-Gos

### Explicitly NOT in scope
- mobile app

## Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|`);
  const result = linter.lintFile(file, { projectRoot: tmp });
  if (result.type !== 'prd') throw new Error('type wrong');
  if (result.summary.errors !== 0) throw new Error(`expected 0 errors, got ${result.summary.errors}`);
});

test('linter lintFile catches errors in broken PRD', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, '.godpowers', 'prd'), { recursive: true });
  const file = path.join(tmp, '.godpowers', 'prd', 'PRD.md');
  fs.writeFileSync(file, `# PRD

## Problem Statement

This has — em dash and no label.

## Success Metrics

- 50 users.

## Scope and No-Gos
`);
  const result = linter.lintFile(file, { projectRoot: tmp });
  if (result.summary.errors === 0) throw new Error('expected errors');
  if (!hasFinding(result.findings, 'U-08')) throw new Error('U-08 missing');
  if (!hasFinding(result.findings, 'P-04')) throw new Error('P-04 missing');
  if (!hasFinding(result.findings, 'P-07')) throw new Error('P-07 missing');
});

test('linter lintAll scans all candidates in project', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, '.godpowers', 'prd'), { recursive: true });
  fs.mkdirSync(path.join(tmp, '.godpowers', 'arch'), { recursive: true });
  fs.writeFileSync(path.join(tmp, '.godpowers', 'prd', 'PRD.md'), '# PRD\n\nClean content.');
  fs.writeFileSync(path.join(tmp, '.godpowers', 'arch', 'ARCH.md'), '# ARCH\n\nClean content.');
  const results = linter.lintAll(tmp);
  if (results.length !== 2) throw new Error(`expected 2 results, got ${results.length}`);
});

test('linter aggregate sums across results', () => {
  const results = [
    { summary: { errors: 2, warnings: 1, infos: 0, byCode: { 'U-08': 2, 'U-02': 1 } } },
    { summary: { errors: 1, warnings: 0, infos: 1, byCode: { 'P-04': 1, 'U-09': 1 } } }
  ];
  const total = linter.aggregate(results);
  if (total.errors !== 3) throw new Error(`expected 3, got ${total.errors}`);
  if (total.warnings !== 1) throw new Error(`expected 1, got ${total.warnings}`);
  if (total.byCode['U-08'] !== 2) throw new Error('U-08 aggregate wrong');
});

test('linter formatReport produces readable output', () => {
  const result = {
    path: '/tmp/PRD.md',
    type: 'prd',
    summary: { errors: 1, warnings: 0, infos: 0 },
    findings: [
      { code: 'P-04', severity: 'error', line: 24, message: 'No timeline.', suggestion: 'Add one.' }
    ]
  };
  const report = linter.formatReport(result);
  if (!report.includes('P-04')) throw new Error('code missing');
  if (!report.includes('line 24')) throw new Error('line missing');
});

// ============================================================================
// End-to-end behavioral test
// ============================================================================

test('end-to-end: violating PRD produces expected error set', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, '.godpowers', 'prd'), { recursive: true });
  const file = path.join(tmp, '.godpowers', 'prd', 'PRD.md');
  fs.writeFileSync(file, `# PRD

## Problem Statement

Users want a thing — without specifics.

## Success Metrics

- 50 users.

## Scope and No-Gos

### Explicitly NOT in scope
- nothing yet

## Open Questions

| Question | Owner | Due Date |
|----------|-------|----------|
| Pricing? | TBD | TBD |`);

  const result = linter.lintFile(file, { projectRoot: tmp });

  // Expected catches:
  if (!hasFinding(result.findings, 'U-08')) throw new Error('U-08 (em dash) missing');
  if (!hasFinding(result.findings, 'P-04')) throw new Error('P-04 (timeline) missing');
  if (!hasFinding(result.findings, 'P-08')) throw new Error('P-08 (owner) missing');
  if (!hasFinding(result.findings, 'P-09')) throw new Error('P-09 (due) missing');

  // Should have errors
  if (result.summary.errors === 0) throw new Error('summary should have errors');
});

test('end-to-end: clean PRD produces zero errors', () => {
  const tmp = mkTmp();
  fs.mkdirSync(path.join(tmp, '.godpowers', 'prd'), { recursive: true });
  const file = path.join(tmp, '.godpowers', 'prd', 'PRD.md');
  fs.writeFileSync(file, `# PRD

## Problem Statement

[DECISION] Solo SaaS founders running between $1k and $10k MRR cannot decompose revenue change.

## Success Metrics

- [DECISION] 50 daily active users within 30 days of launch, measured via analytics.

## Scope and No-Gos

### Explicitly NOT in scope
- [DECISION] Mobile app
- [DECISION] Enterprise SSO

## Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| Pricing model | alice | 2026-06-15 | |`);

  const result = linter.lintFile(file, { projectRoot: tmp });
  if (result.summary.errors !== 0) {
    throw new Error(`expected 0 errors, got ${result.summary.errors}: ${JSON.stringify(result.findings.filter(f => f.severity === 'error'))}`);
  }
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
