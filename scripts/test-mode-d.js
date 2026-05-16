#!/usr/bin/env node
/**
 * Behavioral tests for Phase 12 Mode D libs:
 *   lib/multi-repo-detector.js
 *   lib/cross-repo-linkage.js
 *   lib/meta-linter.js
 *   lib/suite-state.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const detector = require('../lib/multi-repo-detector');
const crossRepoLinkage = require('../lib/cross-repo-linkage');
const metaLinter = require('../lib/meta-linter');
const suiteState = require('../lib/suite-state');
const linkage = require('../lib/linkage');

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

function mkSuite() {
  // Build a suite: hub at root, siblings as subdirs of hub
  // Suite-config sibling names are resolved relative to hub by default.
  const hub = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-mode-d-test-'));
  const repoA = path.join(hub, 'repo-a');
  const repoB = path.join(hub, 'repo-b');
  fs.mkdirSync(path.join(hub, '.godpowers'), { recursive: true });
  for (const dir of [repoA, repoB]) {
    fs.mkdirSync(path.join(dir, '.godpowers'), { recursive: true });
  }

  // Hub config declares the two siblings (subdir convention)
  fs.writeFileSync(path.join(hub, '.godpowers', 'suite-config.yaml'),
    `name: test-suite
siblings:
  - repo-a
  - repo-b
byte-identical:
  - .editorconfig
  - LICENSE
version-table:
  repo-a:
    repo-a: 1.2.3
  repo-b:
    repo-b: 1.2.3
shared-standards:
  node-version: 20
  linter: biome
`);

  // Each sibling registers the hub via state.json (absolute path for test)
  for (const repoDir of [repoA, repoB]) {
    fs.writeFileSync(path.join(repoDir, '.godpowers', 'state.json'),
      JSON.stringify({
        version: '1.0.0',
        project: { name: path.basename(repoDir) },
        suite: { hubPath: hub },
        tiers: {
          'tier-1': {
            prd: { status: 'done' }
          }
        },
        linkage: {
          'coverage-pct': 0.85,
          'orphan-count': 1,
          'drift-count': 0,
          'review-required-items': 0
        }
      }, null, 2));
  }

  return { root: hub, hub, repoA, repoB };
}

console.log('\n  Mode D behavioral tests\n');

// ============================================================================
// multi-repo-detector
// ============================================================================

test('readSuiteConfig returns null on non-suite dir', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-non-suite-'));
  if (detector.readSuiteConfig(tmp) !== null) throw new Error('should be null');
});

test('readSuiteConfig parses hub config', () => {
  const { hub } = mkSuite();
  const config = detector.readSuiteConfig(hub);
  if (!config) throw new Error('null config');
  if (!Array.isArray(config.siblings)) throw new Error('siblings not array');
  if (config.siblings.length !== 2) throw new Error(`expected 2, got ${config.siblings.length}`);
});

test('isHub identifies the hub directory', () => {
  const { hub } = mkSuite();
  if (!detector.isHub(hub)) throw new Error('hub not detected');
});

test('isHub returns false for sibling', () => {
  const { repoA } = mkSuite();
  if (detector.isHub(repoA)) throw new Error('false positive');
});

test('detect returns hub role for hub dir', () => {
  const { hub } = mkSuite();
  const result = detector.detect(hub);
  if (!result.isMultiRepo) throw new Error('not detected');
  if (result.role !== 'hub') throw new Error(`role wrong: ${result.role}`);
  if (result.siblings.length !== 2) throw new Error('siblings wrong');
});

test('detect returns sibling role for repo dirs', () => {
  const { repoA } = mkSuite();
  const result = detector.detect(repoA);
  if (!result.isMultiRepo) throw new Error('not detected');
  if (result.role !== 'sibling') throw new Error(`role wrong: ${result.role}`);
  if (!result.hubPath) throw new Error('hub path missing');
});

test('detect returns false for empty dir', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-empty-'));
  const result = detector.detect(tmp);
  if (result.isMultiRepo) throw new Error('false positive');
});

test('getByteIdenticalFiles returns declared files', () => {
  const { hub } = mkSuite();
  const files = detector.getByteIdenticalFiles(hub);
  if (files.length !== 2) throw new Error(`expected 2, got ${files.length}`);
  if (!files.find(f => f.path === '.editorconfig')) throw new Error('.editorconfig missing');
});

test('getVersionTable returns declared versions', () => {
  const { hub } = mkSuite();
  const table = detector.getVersionTable(hub);
  if (!table['repo-a']) throw new Error('repo-a missing');
  if (table['repo-a']['repo-a'] !== '1.2.3') throw new Error('version wrong');
});

// ============================================================================
// cross-repo-linkage
// ============================================================================

test('qualifyId prefixes with repo name', () => {
  if (crossRepoLinkage.qualifyId('shared', 'C-auth') !== 'shared:C-auth') {
    throw new Error('format wrong');
  }
});

test('parseQualifiedId splits correctly', () => {
  const r = crossRepoLinkage.parseQualifiedId('shared:C-auth');
  if (r.repo !== 'shared') throw new Error('repo');
  if (r.id !== 'C-auth') throw new Error('id');
});

test('parseQualifiedId returns null for unqualified', () => {
  if (crossRepoLinkage.parseQualifiedId('C-auth') !== null) throw new Error('should be null');
});

test('readForwardSuite aggregates per-repo linkage', () => {
  const { hub, repoA, repoB } = mkSuite();
  linkage.addLink(repoA, 'P-MUST-01', 'src/auth.ts');
  linkage.addLink(repoB, 'P-MUST-01', 'src/billing.ts');
  const suite = crossRepoLinkage.readForwardSuite(hub);
  if (!suite['repo-a:P-MUST-01']) throw new Error('repo-a entry missing');
  if (!suite['repo-b:P-MUST-01']) throw new Error('repo-b entry missing');
  // Same ID, different repos = different qualified entries
});

test('crossRepoOrphans finds qualified IDs without files', () => {
  const { hub, repoA } = mkSuite();
  linkage.addLink(repoA, 'P-MUST-01', 'src/auth.ts');
  const orphans = crossRepoLinkage.crossRepoOrphans(hub, [
    'repo-a:P-MUST-01',
    'repo-a:P-MUST-99'
  ]);
  if (orphans.length !== 1) throw new Error(`expected 1 orphan, got ${orphans.length}`);
  if (orphans[0] !== 'repo-a:P-MUST-99') throw new Error('wrong orphan');
});

test('collectAllIds returns suite-wide ID list', () => {
  const { hub, repoA, repoB } = mkSuite();
  linkage.addLink(repoA, 'P-MUST-01', 'a.ts');
  linkage.addLink(repoB, 'C-billing', 'b.ts');
  const ids = crossRepoLinkage.collectAllIds(hub);
  if (ids.length !== 2) throw new Error(`expected 2, got ${ids.length}`);
});

// ============================================================================
// meta-linter
// ============================================================================

test('checkByteIdentical finds drift in declared files', () => {
  const { hub, repoA, repoB } = mkSuite();
  fs.writeFileSync(path.join(repoA, '.editorconfig'), 'root = true\n');
  fs.writeFileSync(path.join(repoB, '.editorconfig'), 'root = false\n');
  const findings = metaLinter.checkByteIdentical(hub);
  if (!findings.find(f => f.kind === 'byte-identical-drift')) {
    throw new Error('drift not detected');
  }
});

test('checkByteIdentical produces warnings by default (not errors)', () => {
  const { hub, repoA, repoB } = mkSuite();
  fs.writeFileSync(path.join(repoA, '.editorconfig'), 'a\n');
  fs.writeFileSync(path.join(repoB, '.editorconfig'), 'b\n');
  const findings = metaLinter.checkByteIdentical(hub);
  if (!findings.every(f => f.severity === 'warning')) {
    throw new Error('expected warning severity by default');
  }
});

test('checkByteIdentical with strict=true produces errors', () => {
  const { hub, repoA, repoB } = mkSuite();
  fs.writeFileSync(path.join(repoA, '.editorconfig'), 'a\n');
  fs.writeFileSync(path.join(repoB, '.editorconfig'), 'b\n');
  const findings = metaLinter.checkByteIdentical(hub, { strict: true });
  if (!findings.every(f => f.severity === 'error')) {
    throw new Error('expected error severity in strict mode');
  }
});

test('checkByteIdentical clean state produces no findings', () => {
  const { hub, repoA, repoB } = mkSuite();
  fs.writeFileSync(path.join(repoA, '.editorconfig'), 'same\n');
  fs.writeFileSync(path.join(repoB, '.editorconfig'), 'same\n');
  fs.writeFileSync(path.join(repoA, 'LICENSE'), 'license\n');
  fs.writeFileSync(path.join(repoB, 'LICENSE'), 'license\n');
  const findings = metaLinter.checkByteIdentical(hub);
  if (findings.length !== 0) throw new Error(`expected 0, got ${findings.length}`);
});

test('checkVersionTable detects drift', () => {
  const { hub, repoA } = mkSuite();
  fs.writeFileSync(path.join(repoA, 'package.json'), JSON.stringify({
    name: 'repo-a', version: '2.0.0' // declared 1.2.3
  }));
  const findings = metaLinter.checkVersionTable(hub);
  if (!findings.find(f => f.kind === 'version-table-drift')) {
    throw new Error('version drift not detected');
  }
});

test('checkSharedStandards detects linter mismatch', () => {
  const { hub, repoA } = mkSuite();
  fs.writeFileSync(path.join(repoA, 'package.json'), JSON.stringify({
    name: 'repo-a',
    version: '1.2.3',
    devDependencies: { eslint: '^8.0.0' }  // suite says biome
  }));
  const findings = metaLinter.checkSharedStandards(hub);
  if (!findings.find(f => f.kind === 'shared-standard-drift')) {
    throw new Error('linter drift not detected');
  }
});

test('runAll aggregates all checks', () => {
  const { hub, repoA, repoB } = mkSuite();
  fs.writeFileSync(path.join(repoA, '.editorconfig'), 'a\n');
  fs.writeFileSync(path.join(repoB, '.editorconfig'), 'b\n');
  const result = metaLinter.runAll(hub);
  if (result.summary.warnings === 0) throw new Error('expected warnings');
});

// ============================================================================
// suite-state
// ============================================================================

test('refreshFromRepos aggregates per-repo state', () => {
  const { hub } = mkSuite();
  const data = suiteState.refreshFromRepos(hub);
  if (!data) throw new Error('null data');
  if (data.repos.length !== 2) throw new Error('repo count wrong');
  if (data.totals.artifacts !== 2) throw new Error('artifact total wrong'); // each repo has 1 done
});

test('refreshFromRepos writes STATE.md', () => {
  const { hub } = mkSuite();
  suiteState.refreshFromRepos(hub);
  const stateMd = suiteState.suiteStateMdPath(hub);
  if (!fs.existsSync(stateMd)) throw new Error('STATE.md not written');
  const content = fs.readFileSync(stateMd, 'utf8');
  if (!content.includes('Suite State')) throw new Error('header missing');
  if (!content.includes('repo-a')) throw new Error('repo-a missing');
});

test('readSuiteState returns null before refresh', () => {
  const { hub } = mkSuite();
  if (suiteState.readSuiteState(hub) !== null) throw new Error('should be null');
});

test('readSuiteState returns data after refresh', () => {
  const { hub } = mkSuite();
  suiteState.refreshFromRepos(hub);
  const data = suiteState.readSuiteState(hub);
  if (!data) throw new Error('null after refresh');
  if (data.totals.artifacts !== 2) throw new Error('totals wrong');
});

test('appendSyncLog creates and appends', () => {
  const { hub } = mkSuite();
  suiteState.appendSyncLog(hub, 'Test entry 1');
  suiteState.appendSyncLog(hub, 'Test entry 2');
  const file = suiteState.suiteSyncLogPath(hub);
  if (!fs.existsSync(file)) throw new Error('not created');
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes('Test entry 1')) throw new Error('first lost');
  if (!content.includes('Test entry 2')) throw new Error('second lost');
});

test('format returns markdown after refresh', () => {
  const { hub } = mkSuite();
  suiteState.refreshFromRepos(hub);
  const md = suiteState.format(hub);
  if (!md.includes('Suite State')) throw new Error('missing header');
});

test('planRelease produces dry-run impact plan for dependents', () => {
  const { hub, repoB } = mkSuite();
  fs.writeFileSync(path.join(repoB, 'package.json'), JSON.stringify({
    name: 'repo-b',
    version: '1.2.3',
    dependencies: { 'repo-a': '^1.2.3' }
  }, null, 2));
  const plan = suiteState.planRelease(hub, 'repo-a', '1.2.4');
  if (plan.mode !== 'dry-run') throw new Error(`mode wrong: ${plan.mode}`);
  if (plan.status !== 'ready') throw new Error(`status wrong: ${plan.status}`);
  if (plan.impacted.length !== 1) throw new Error(`impact wrong: ${plan.impacted.length}`);
  if (plan.impacted[0].name !== 'repo-b') throw new Error('repo-b not impacted');
  if (plan.writes.length < 3) throw new Error('writes not planned');
});

test('planRelease blocks unknown suite repo', () => {
  const { hub } = mkSuite();
  const plan = suiteState.planRelease(hub, 'repo-missing', '1.2.4');
  if (plan.status !== 'blocked') throw new Error(`status wrong: ${plan.status}`);
  if (plan.blockers.length !== 1) throw new Error('blocker missing');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
