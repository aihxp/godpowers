/**
 * Godpowers Dashboard
 *
 * Shared executable status engine for /god-status, /god-next, /god-sync,
 * /god-scan, and /god-mode closeouts. Disk state is authoritative.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const state = require('./state');
const router = require('./router');
const automationProviders = require('./automation-providers');

const GOD_DIR = '.godpowers';
const PRD_PATH = '.godpowers/prd/PRD.md';
const ROADMAP_PATH = '.godpowers/roadmap/ROADMAP.md';
const CHECKPOINT_PATH = '.godpowers/CHECKPOINT.md';
const SYNC_LOG_PATH = '.godpowers/SYNC-LOG.md';
const REVIEW_PATH = '.godpowers/REVIEW-REQUIRED.md';

function exists(projectRoot, relPath) {
  return fs.existsSync(path.join(projectRoot, relPath));
}

function readText(projectRoot, relPath) {
  const file = path.join(projectRoot, relPath);
  if (!fs.existsSync(file)) return '';
  return fs.readFileSync(file, 'utf8');
}

function mtimeMs(projectRoot, relPath) {
  const file = path.join(projectRoot, relPath);
  if (!fs.existsSync(file)) return null;
  return fs.statSync(file).mtimeMs;
}

function artifactStatus(projectRoot, relPath) {
  return exists(projectRoot, relPath) ? 'done' : 'missing';
}

function currentPhase(progress) {
  const current = progress && progress.current;
  if (!current) {
    return {
      phase: 'Complete',
      tierKey: null,
      tierNumber: null,
      tierTotal: 0,
      tierOrdinal: 0,
      tierCount: 0,
      tierLabel: 'Complete',
      stepLabel: 'Complete',
      stepNumber: 0,
      totalSteps: progress ? progress.total : 0
    };
  }

  const tierNumbers = (progress.tiers || [])
    .map(tier => tier.tierNumber)
    .filter(n => Number.isFinite(n))
    .sort((a, b) => a - b);
  const tierTotal = tierNumbers.length > 0 ? Math.max(...tierNumbers) : current.tierNumber;
  const tierOrdinal = tierNumbers.indexOf(current.tierNumber) + 1;
  const tierCount = tierNumbers.length || (Number.isFinite(current.tierNumber) ? current.tierNumber + 1 : 0);

  return {
    phase: current.tierLabel,
    tierKey: current.tierKey,
    tierNumber: current.tierNumber,
    tierTotal,
    tierOrdinal: tierOrdinal > 0 ? tierOrdinal : 1,
    tierCount,
    tierLabel: current.tierLabel,
    stepLabel: current.subStepLabel,
    stepNumber: current.ordinal,
    totalSteps: progress.total
  };
}

function worktree(projectRoot) {
  try {
    const out = cp.execFileSync('git', ['status', '--porcelain'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return parseGitStatus(out);
  } catch (e) {
    return { worktree: 'unknown', index: 'unknown', entries: [] };
  }
}

function parseGitStatus(out) {
  if (!out || !out.trim()) {
    return { worktree: 'clean', index: 'untouched', entries: [] };
  }
  const entries = out.split(/\r?\n/).filter(Boolean);
  const staged = entries.filter(line => line[0] !== ' ' && line[0] !== '?');
  const unstaged = entries.filter(line => line[1] !== ' ' || line.startsWith('??'));
  let worktreeState = 'modified files unstaged';
  if (staged.length > 0 && unstaged.length > 0) worktreeState = 'mixed';
  else if (staged.length > 0) worktreeState = 'staged changes';
  return {
    worktree: worktreeState,
    index: staged.length > 0 ? staged.map(statusPath).join(', ') : 'untouched',
    entries
  };
}

function statusPath(line) {
  if (line.startsWith('?? ')) return line.slice(3);
  return line.length > 3 ? line.slice(3) : line.trim();
}

function reviewCount(projectRoot) {
  const text = readText(projectRoot, REVIEW_PATH);
  if (!text.trim()) return 0;
  const unchecked = (text.match(/\[\s\]\s*(?:TODO|PENDING|OPEN|REVIEW|BLOCKER|[Pp][0-3])/g) || []).length;
  if (unchecked > 0) return unchecked;
  const headings = (text.match(/^###\s+/gm) || []).length;
  return headings;
}

function hasRecentPath(projectRoot, relPath, maxAgeMs) {
  const modified = mtimeMs(projectRoot, relPath);
  if (!modified) return false;
  return Date.now() - modified <= maxAgeMs;
}

function proactiveChecks(projectRoot, changedFiles = []) {
  const oneDay = 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * oneDay;
  const reviews = reviewCount(projectRoot);

  const checkpoint = exists(projectRoot, CHECKPOINT_PATH)
    ? (hasRecentPath(projectRoot, CHECKPOINT_PATH, oneDay) ? 'fresh' : 'stale')
    : 'missing';

  const sync = exists(projectRoot, SYNC_LOG_PATH)
    ? (hasRecentPath(projectRoot, SYNC_LOG_PATH, oneDay) ? 'fresh' : 'stale, suggest /god-sync')
    : 'missing, suggest /god-sync';

  const hygieneFresh = exists(projectRoot, CHECKPOINT_PATH)
    && hasRecentPath(projectRoot, CHECKPOINT_PATH, thirtyDays);

  const pkgChanged = changedFiles.some(file => [
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock'
  ].includes(file));
  const sensitiveChanged = changedFiles.some(file => matchesAnyPrefix(file, [
    '.env.example',
    'SECURITY.md',
    '.github/workflows',
    'auth',
    'security'
  ]));

  return {
    checkpoint,
    reviews: reviews > 0 ? `${reviews} pending, suggest /god-review-changes` : 'none',
    sync,
    docs: 'fresh',
    runtime: 'not-applicable',
    automation: automationSummary(projectRoot),
    security: sensitiveChanged ? 'sensitive files changed, suggest /god-harden' : 'clear',
    dependencies: pkgChanged ? 'dependency files changed, suggest /god-update-deps' : 'clear',
    hygiene: hygieneFresh ? 'fresh' : 'stale, suggest /god-hygiene'
  };
}

function automationSummary(projectRoot) {
  const report = automationProviders.detect(projectRoot);
  if (report.active.length > 0) {
    return `${report.active.length} active`;
  }
  if (report.recommendedProvider) {
    return `available via ${report.recommendedProvider.id}, suggest /god-automation-setup`;
  }
  return 'not configured';
}

function matchesAnyPrefix(file, prefixes) {
  return prefixes.some(prefix => file === prefix || file.startsWith(`${prefix}/`));
}

function planningVisibility(projectRoot, progress) {
  const prd = artifactStatus(projectRoot, PRD_PATH);
  const roadmap = artifactStatus(projectRoot, ROADMAP_PATH);
  const phase = currentPhase(progress);
  return {
    prd: { status: prd, path: prd === 'done' ? PRD_PATH : null },
    roadmap: { status: roadmap, path: roadmap === 'done' ? ROADMAP_PATH : null },
    currentMilestone: phase.stepLabel ? `${phase.phase} / ${phase.stepLabel}` : phase.phase,
    completion: `${progress.percent}% based on state.json tracked steps`
  };
}

function compute(projectRoot, opts = {}) {
  const s = state.read(projectRoot);
  const git = opts.git === false ? { worktree: 'not-checked', index: 'not-checked', entries: [] } : worktree(projectRoot);

  if (!s) {
    const next = { command: '/god-init', reason: 'No Godpowers project initialized' };
    return {
      state: 'not initialized',
      mode: null,
      lifecycle: 'pre-init',
      progress: { percent: 0, completed: 0, total: 0, currentStep: 0, current: null, tiers: [] },
      current: currentPhase(null),
      worktree: git.worktree,
      index: git.index,
      planning: {
        prd: { status: 'missing', path: null },
        roadmap: { status: 'missing', path: null },
        currentMilestone: 'Project initialization',
        completion: '0% based on missing state.json'
      },
      proactive: proactiveChecks(projectRoot, git.entries.map(statusPath)),
      next,
      openItems: ['No .godpowers/state.json found']
    };
  }

  const progress = state.progressSummary(s);
  const current = currentPhase(progress);
  const next = router.suggestNext(projectRoot);
  const openItems = [];
  const drift = state.detectDrift(projectRoot);

  if (drift.length > 0) openItems.push(`${drift.length} artifact drift item(s), suggest /god-repair`);
  if (next && next.blocker) openItems.push(`${next.blocker} blocks next route`);
  if (reviewCount(projectRoot) > 0) openItems.push('pending review items');
  if (openItems.length === 0) openItems.push('none');

  return {
    state: progress.remaining === 0 ? 'complete' : 'in progress',
    mode: s.mode || s['mode-announced-as'] || null,
    lifecycle: s['lifecycle-phase'] || 'in-arc',
    progress,
    current,
    worktree: git.worktree,
    index: git.index,
    planning: planningVisibility(projectRoot, progress),
    proactive: proactiveChecks(projectRoot, git.entries.map(statusPath)),
    next,
    openItems
  };
}

function render(dashboard) {
  const current = dashboard.current || {};
  const planning = dashboard.planning || {};
  const proactive = dashboard.proactive || {};
  const next = dashboard.next || {};
  const progress = dashboard.progress || {};
  const prd = planning.prd || {};
  const roadmap = planning.roadmap || {};
  const openItems = dashboard.openItems && dashboard.openItems.length > 0
    ? dashboard.openItems
    : ['none'];

  return [
    'Godpowers Dashboard',
    '',
    'Current status:',
    `  State: ${dashboard.state}`,
    `  Phase: ${current.phase || 'unknown'}${current.tierNumber !== null && current.tierNumber !== undefined ? ` (tier ${current.tierOrdinal} of ${current.tierCount}, internal ${current.tierKey || `tier-${current.tierNumber}`})` : ''}`,
    `  Step: ${current.stepLabel || 'unknown'}${current.stepNumber ? ` (step ${current.stepNumber} of ${current.totalSteps})` : ''}`,
    `  Progress: ${progress.percent || 0}% (${progress.completed || 0} of ${progress.total || 0} steps complete)`,
    `  Worktree: ${dashboard.worktree}`,
    `  Index: ${dashboard.index}`,
    '',
    'Planning visibility:',
    `  PRD: ${prd.status || 'missing'}${prd.path ? ` ${prd.path}` : ''}`,
    `  Roadmap: ${roadmap.status || 'missing'}${roadmap.path ? ` ${roadmap.path}` : ''}`,
    `  Current milestone: ${planning.currentMilestone || 'unknown'}`,
    `  Completion: ${planning.completion || 'unknown'}`,
    '',
    'Proactive checks:',
    `  Checkpoint: ${proactive.checkpoint || 'unknown'}`,
    `  Reviews: ${proactive.reviews || 'unknown'}`,
    `  Sync: ${proactive.sync || 'unknown'}`,
    `  Docs: ${proactive.docs || 'unknown'}`,
    `  Runtime: ${proactive.runtime || 'unknown'}`,
    `  Automation: ${proactive.automation || 'unknown'}`,
    `  Security: ${proactive.security || 'unknown'}`,
    `  Dependencies: ${proactive.dependencies || 'unknown'}`,
    `  Hygiene: ${proactive.hygiene || 'unknown'}`,
    '',
    'Open items:',
    ...openItems.map((item, index) => `  ${index + 1}. ${item}`),
    '',
    'Next:',
    `  Recommended: ${next.command || 'describe the next intent'}`,
    `  Why: ${next.reason || 'No route was computed.'}`
  ].join('\n');
}

module.exports = {
  compute,
  render,
  worktree,
  parseGitStatus,
  proactiveChecks,
  automationSummary,
  planningVisibility
};
