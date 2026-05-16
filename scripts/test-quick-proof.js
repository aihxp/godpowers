#!/usr/bin/env node
/**
 * Quick proof documentation tests.
 *
 * Keeps the first-user proof loop connected to README, runtime expectations,
 * release verification, and the adoption canary.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const quickProof = require('../lib/quick-proof');

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

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function assertIncludes(relPath, expected) {
  const text = read(relPath);
  assert(text.includes(expected), `${relPath} missing expected text: ${expected}`);
}

function markdownLinks(text) {
  const links = [];
  const re = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    links.push(match[1]);
  }
  return links;
}

function isExternal(target) {
  return /^[a-z]+:\/\//i.test(target) || target.startsWith('#') || target.startsWith('mailto:');
}

function stripAnchor(target) {
  return target.split('#')[0];
}

console.log('\n  Quick proof documentation tests\n');

test('README links to the quick proof and adoption canary', () => {
  assertIncludes('README.md', '[Quick Proof](docs/quick-proof.md)');
  assertIncludes('README.md', '[Adoption Canary](docs/adoption-canary.md)');
});

test('README exposes starter paths before the full reference', () => {
  assertIncludes('README.md', '### Start With A Path');
  for (const phrase of [
    'Start a product',
    'Add a feature',
    'Fix production',
    'Audit an existing repo',
    'Ship a release',
    'Maintain project health',
    'Extend Godpowers'
  ]) {
    assertIncludes('README.md', phrase);
  }
});

test('README names runtime expectations near install', () => {
  assertIncludes('README.md', '### Runtime Expectations');
  assertIncludes('README.md', 'Claude Code');
  assertIncludes('README.md', 'Codex');
  assertIncludes('README.md', 'Degraded hosts');
  assertIncludes('README.md', '[Host capabilities](docs/host-capabilities.md)');
});

test('quick proof covers proof, transcripts, starters, and runtime expectations', () => {
  for (const heading of [
    '# Quick Proof',
    '## What This Proves',
    '## Ten Minute Path',
    '## Before And After',
    '## Transcript Excerpts',
    '## Starter Paths',
    '## Runtime Expectations',
    '## What To Inspect Next'
  ]) {
    assertIncludes('docs/quick-proof.md', heading);
  }
});

test('quick proof fixture computes /god-prd as next command', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-quick-proof-host-'));
  const proof = quickProof.compute(tmp, {
    hostReport: {
      host: 'test',
      level: 'degraded',
      guarantees: {
        shell: true,
        fileEdit: true,
        node: process.version,
        git: 'git version test',
        npm: 'test',
        gh: null,
        agentSpawn: false,
        extensionAuthoring: false,
        suiteReleaseDryRun: false
      },
      installedAgents: { codex: false, claude: false },
      gaps: ['fresh-context agent spawn not detected']
    }
  });
  assert(proof.dashboard.next.command === '/god-prd',
    `next command: ${proof.dashboard.next.command}`);
  assert(proof.dashboard.planning.prd.status === 'missing',
    `prd: ${proof.dashboard.planning.prd.status}`);
  assert(proof.statePath === 'fixtures/quick-proof/project/.godpowers/state.json',
    `state path: ${proof.statePath}`);
  const rendered = quickProof.render(proof);
  assert(rendered.includes('Godpowers Quick Proof'), 'render missing title');
  assert(rendered.includes('Next: /god-prd'), rendered);
  assert(rendered.includes('Host guarantees: degraded on test'), rendered);
});

test('CLI quick-proof renders the fixture proof', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-quick-proof-cli-'));
  const out = cp.execFileSync(process.execPath,
    [path.join(ROOT, 'bin', 'install.js'), 'quick-proof', '--project', tmp, '--brief'],
    { encoding: 'utf8' });
  assert(out.includes('Godpowers Quick Proof'), out);
  assert(out.includes('Next: /god-prd'), out);
  assert(out.includes('State on disk: fixtures/quick-proof/project/.godpowers/state.json'), out);
});

test('quick proof names the accountable outputs', () => {
  for (const phrase of [
    'disk state',
    'artifacts',
    'validation gates',
    'host guarantees',
    'next action',
    '.godpowers/PROGRESS.md',
    '.godpowers/harden/FINDINGS.md'
  ]) {
    assertIncludes('docs/quick-proof.md', phrase);
  }
});

test('release checklist includes published install verification', () => {
  assertIncludes('docs/RELEASE-CHECKLIST.md', '## Published Install Verification');
  assertIncludes('docs/RELEASE-CHECKLIST.md', 'node scripts/verify-published-install.js godpowers@latest');
  assertIncludes('docs/RELEASE-CHECKLIST.md', 'npx godpowers@latest --claude --global');
  assertIncludes('docs/RELEASE-CHECKLIST.md', 'npx godpowers@latest --codex --global');
  assertIncludes('docs/RELEASE-CHECKLIST.md', 'npx godpowers@latest quick-proof --project=. --brief');
  assertIncludes('docs/RELEASE-CHECKLIST.md', 'npx godpowers@latest status --project=. --brief');
});

test('published install verification script exercises quick-proof and runtime installs', () => {
  assertIncludes('scripts/verify-published-install.js', 'quick-proof');
  assertIncludes('scripts/verify-published-install.js', '--claude');
  assertIncludes('scripts/verify-published-install.js', '--codex');
  assertIncludes('scripts/verify-published-install.js', 'god-orchestrator.toml');
});

test('adoption canary defines pass and failure criteria', () => {
  assertIncludes('docs/adoption-canary.md', '# Adoption Canary');
  assertIncludes('docs/adoption-canary.md', 'node scripts/run-adoption-canary.js <git-url> --output=.godpowers-canary/report.md');
  assertIncludes('docs/adoption-canary.md', '## Canary Runbook');
  assertIncludes('docs/adoption-canary.md', '## Pass Criteria');
  assertIncludes('docs/adoption-canary.md', '## Failure Criteria');
  assertIncludes('docs/adoption-canary.md', '## Feedback Targets');
});

test('adoption canary harness captures CLI-verifiable proof signals', () => {
  assertIncludes('scripts/run-adoption-canary.js', 'quick-proof');
  assertIncludes('scripts/run-adoption-canary.js', 'status');
  assertIncludes('scripts/run-adoption-canary.js', 'next');
  assertIncludes('scripts/run-adoption-canary.js', 'Adoption Canary Report');
});

test('proof transcript captures the runnable quick-proof output', () => {
  assertIncludes('docs/proof-transcript.md', '# Proof Transcript');
  assertIncludes('docs/proof-transcript.md', 'node bin/install.js quick-proof --project=. --brief');
  assertIncludes('docs/proof-transcript.md', 'Next: /god-prd');
  assertIncludes('docs/proof-transcript.md', 'State on disk: fixtures/quick-proof/project/.godpowers/state.json');
});

test('proof docs local links resolve', () => {
  for (const relPath of ['docs/quick-proof.md', 'docs/adoption-canary.md', 'docs/proof-transcript.md']) {
    const baseDir = path.dirname(relPath);
    for (const target of markdownLinks(read(relPath))) {
      if (isExternal(target)) continue;
      const localTarget = stripAnchor(target);
      if (!localTarget) continue;
      const resolved = path.normalize(path.join(baseDir, localTarget));
      assert(exists(resolved), `${relPath} links to missing file: ${target}`);
    }
  }
});

test('new proof docs do not contain banned dash characters or decorative emoji', () => {
  const targets = [
    'docs/quick-proof.md',
    'docs/adoption-canary.md'
  ];
  for (const relPath of targets) {
    const text = read(relPath);
    assert(!text.includes('\u2013'), `${relPath} contains en dash`);
    assert(!text.includes('\u2014'), `${relPath} contains em dash`);
    assert(!/[\u{1F000}-\u{1FAFF}]/u.test(text), `${relPath} contains emoji`);
  }
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
