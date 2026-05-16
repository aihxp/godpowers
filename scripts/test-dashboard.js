#!/usr/bin/env node
/**
 * Behavioral tests for lib/dashboard.js.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const dashboard = require('../lib/dashboard');
const state = require('../lib/state');

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

function mkProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-dashboard-test-'));
  fs.mkdirSync(path.join(tmp, '.godpowers'), { recursive: true });
  return tmp;
}

function writeRel(root, relPath, text) {
  const file = path.join(root, relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

console.log('\n  Dashboard engine behavioral tests\n');

test('compute reports not initialized and suggests /god-init', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-dashboard-empty-'));
  const result = dashboard.compute(tmp, { git: false });
  assert(result.state === 'not initialized', `state: ${result.state}`);
  assert(result.next.command === '/god-init', `next: ${result.next.command}`);
  assert(result.planning.prd.status === 'missing', `prd: ${result.planning.prd.status}`);
  assert(result.openItems.includes('No .godpowers/state.json found'), 'missing open item');
  const rendered = dashboard.render(result);
  assert(rendered.includes('Godpowers Dashboard'), 'render missing title');
  assert(rendered.includes('Source: runtime dashboard (lib/dashboard.js)'), 'render missing source');
  assert(rendered.includes('Recommended: /god-init'), 'render missing init route');
});

test('render uses human-readable tier counts', () => {
  const tmp = mkProject();
  state.init(tmp, 'tier-demo');
  const result = dashboard.compute(tmp, { git: false });
  const rendered = dashboard.render(result);
  assert(rendered.includes('tier 1 of 4'), `rendered: ${rendered}`);
  assert(rendered.includes('internal tier-0'), `rendered: ${rendered}`);
});

test('compute reports progress and planning visibility from disk', () => {
  const tmp = mkProject();
  state.init(tmp, 'demo');
  state.updateSubStep(tmp, 'tier-0', 'orchestration', { status: 'done' });
  state.updateSubStep(tmp, 'tier-1', 'prd', { status: 'done', artifact: 'prd/PRD.md' });
  writeRel(tmp, '.godpowers/prd/PRD.md', '# PRD\n');
  writeRel(tmp, '.godpowers/CHECKPOINT.md', '# Checkpoint\n');
  writeRel(tmp, '.godpowers/SYNC-LOG.md', '# Sync Log\n');

  const result = dashboard.compute(tmp, { git: false });
  assert(result.state === 'in progress', `state: ${result.state}`);
  assert(result.progress.percent === 15, `percent: ${result.progress.percent}`);
  assert(result.current.phase === 'Planning', `phase: ${result.current.phase}`);
  assert(result.current.stepLabel === 'Architecture', `step: ${result.current.stepLabel}`);
  assert(result.planning.prd.status === 'done', `prd: ${result.planning.prd.status}`);
  assert(result.planning.roadmap.status === 'missing',
    `roadmap: ${result.planning.roadmap.status}`);
  assert(result.next.command === '/god-arch', `next: ${result.next.command}`);
  assert(result.proactive.checkpoint === 'fresh',
    `checkpoint: ${result.proactive.checkpoint}`);
  assert(result.proactive.sync === 'fresh', `sync: ${result.proactive.sync}`);
});

test('render includes current status, proactive checks, and next route', () => {
  const tmp = mkProject();
  state.init(tmp, 'render-demo');
  const result = dashboard.compute(tmp, { git: false });
  const rendered = dashboard.render(result);
  assert(rendered.includes('Current status:'), 'missing current status');
  assert(rendered.includes('Progress: 0% workflow progress'), `rendered: ${rendered}`);
  assert(rendered.includes('Planning visibility:'), 'missing planning visibility');
  assert(rendered.includes('Completion basis: .godpowers/state.json workflow steps'), `rendered: ${rendered}`);
  assert(rendered.includes('Proactive checks:'), 'missing proactive checks');
  assert(rendered.includes('Recommended: /god-prd'), `rendered: ${rendered}`);
});

test('pending review file becomes proactive review suggestion', () => {
  const tmp = mkProject();
  state.init(tmp, 'review-demo');
  writeRel(tmp, '.godpowers/REVIEW-REQUIRED.md',
    '# Review Required\n\n### P1 Missing test\n\n- [ ] REVIEW: add coverage\n');
  const result = dashboard.compute(tmp, { git: false });
  assert(/pending/.test(result.proactive.reviews), `reviews: ${result.proactive.reviews}`);
  assert(result.openItems.includes('pending review items'), 'missing review open item');
});

test('parseGitStatus preserves leading-space porcelain entries', () => {
  const parsed = dashboard.parseGitStatus(' M README.md\n?? lib/dashboard.js\n');
  assert(parsed.worktree === 'modified files unstaged', `worktree: ${parsed.worktree}`);
  assert(parsed.index === 'untouched', `index: ${parsed.index}`);
  assert(parsed.entries[0] === ' M README.md', `entry: ${parsed.entries[0]}`);
});

test('parseGitStatus reports staged paths without clipping filenames', () => {
  const parsed = dashboard.parseGitStatus('M  README.md\n M package.json\n');
  assert(parsed.worktree === 'mixed', `worktree: ${parsed.worktree}`);
  assert(parsed.index === 'README.md', `index: ${parsed.index}`);
});

test('CLI status renders the dashboard for a project', () => {
  const tmp = mkProject();
  state.init(tmp, 'cli-status-demo');
  const out = cp.execFileSync(process.execPath,
    [path.join(__dirname, '..', 'bin', 'install.js'), 'status', '--project', tmp],
    { encoding: 'utf8' });
  assert(out.includes('Godpowers Dashboard'), `output: ${out}`);
  assert(out.includes('Recommended: /god-prd'), `output: ${out}`);
});

test('CLI next can emit JSON with the recommended route', () => {
  const tmp = mkProject();
  state.init(tmp, 'cli-next-demo');
  const out = cp.execFileSync(process.execPath,
    [path.join(__dirname, '..', 'bin', 'install.js'), 'next', '--project', tmp, '--json'],
    { encoding: 'utf8' });
  const parsed = JSON.parse(out);
  assert(parsed.next.command === '/god-prd', `next: ${parsed.next.command}`);
  assert(parsed.progress.total === 13, `total: ${parsed.progress.total}`);
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
