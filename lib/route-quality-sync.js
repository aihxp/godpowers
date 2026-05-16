/**
 * Route quality sync.
 *
 * Detects disconnected route automation surfaces: symbolic spawn tokens,
 * unresolved agent targets, contextual exits without an approved reason, and
 * composite flows that should be represented as primary plus secondary or
 * parallel spawns.
 */

const fs = require('fs');
const path = require('path');

const { parseSimpleYaml } = require('./intent');

const LOG_PATH = '.godpowers/surface/ROUTE-QUALITY-SYNC.md';

const CONTEXTUAL_NEXT_ALLOWED = new Set([
  '/god',
  '/god-agent-audit',
  '/god-budget',
  '/god-cache-clear',
  '/god-check-todos',
  '/god-context-scan',
  '/god-cost',
  '/god-discuss',
  '/god-doctor',
  '/god-extension-add',
  '/god-extension-info',
  '/god-extension-list',
  '/god-extension-remove',
  '/god-graph',
  '/god-help',
  '/god-lifecycle',
  '/god-list-assumptions',
  '/god-locate',
  '/god-logs',
  '/god-metrics',
  '/god-next',
  '/god-redo',
  '/god-resume-work',
  '/god-test-extension',
  '/god-thread',
  '/god-trace',
  '/god-workstream'
]);

const STANDARDS_EXEMPT_COMMANDS = new Set([
  '/god-archaeology',
  '/god-audit',
  '/god-automation-setup',
  '/god-debug',
  '/god-discuss',
  '/god-explore',
  '/god-feature',
  '/god-hotfix',
  '/god-hygiene',
  '/god-init',
  '/god-org-context',
  '/god-party',
  '/god-pause-work',
  '/god-preflight',
  '/god-reconstruct',
  '/god-roadmap-check',
  '/god-smite',
  '/god-tech-debt'
]);

function read(projectRoot, relPath) {
  const file = path.join(projectRoot, relPath);
  if (!fs.existsSync(file)) return '';
  return fs.readFileSync(file, 'utf8');
}

function write(projectRoot, relPath, content) {
  const file = path.join(projectRoot, relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function listFiles(projectRoot, relDir, pattern) {
  const dir = path.join(projectRoot, relDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => pattern.test(name))
    .sort()
    .map((name) => `${relDir}/${name}`.replace(/\\/g, '/'));
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function parseRoute(projectRoot, routePath) {
  try {
    return parseSimpleYaml(read(projectRoot, routePath)) || {};
  } catch (err) {
    return {};
  }
}

function addCheck(checks, id, status, relPath, message, opts = {}) {
  checks.push({
    area: 'route-quality',
    id,
    status,
    path: relPath,
    message,
    severity: opts.severity || (status === 'fresh' ? 'info' : 'warning'),
    spawn: opts.spawn || null
  });
}

function spawnTokens(route) {
  const execution = route.execution || {};
  return normalizeSpawnList([
    ...arr(execution.spawns),
    ...arr(execution['secondary-spawns']),
    ...arr(execution['parallel-spawns'])
  ]);
}

function normalizeSpawnList(tokens) {
  return tokens
    .map((token) => {
      if (token && typeof token === 'object' && token.agent) return token.agent;
      return token;
    })
    .filter((token) => token !== null && token !== undefined);
}

function isAtomicSpawn(token) {
  return token === 'built-in' || /^god-[a-z0-9-]+$/.test(token);
}

function detect(projectRoot) {
  const checks = [];
  const routes = listFiles(projectRoot, 'routing', /^god.*\.yaml$/);
  const agents = new Set(listFiles(projectRoot, 'agents', /^god.*\.md$/)
    .map((file) => path.basename(file, '.md')));
  let symbolicCount = 0;
  let unresolvedCount = 0;
  let contextualExitCount = 0;
  let standardsExemptCount = 0;

  for (const routePath of routes) {
    const route = parseRoute(projectRoot, routePath);
    const command = route.metadata && route.metadata.command
      ? route.metadata.command
      : `/${path.basename(routePath, '.yaml')}`;

    for (const token of spawnTokens(route)) {
      if (!isAtomicSpawn(String(token))) {
        symbolicCount++;
        addCheck(
          checks,
          `symbolic-spawn-${command.replace(/[^a-z0-9]+/gi, '-')}`,
          'stale',
          routePath,
          `${command} uses symbolic spawn token ${token}.`,
          { spawn: 'god-auditor' }
        );
        continue;
      }
      if (String(token).startsWith('god-') && !agents.has(String(token))) {
        unresolvedCount++;
        addCheck(
          checks,
          `unresolved-spawn-${command.replace(/[^a-z0-9]+/gi, '-')}-${token}`,
          'stale',
          routePath,
          `${command} references missing agent ${token}.`,
          { spawn: 'god-auditor' }
        );
      }
    }

    const next = route['success-path'] && route['success-path']['next-recommended'];
    const conditionalNext = route['success-path'] && arr(route['success-path']['conditional-next']);
    if (next === 'varies' && conditionalNext.length === 0) {
      if (CONTEXTUAL_NEXT_ALLOWED.has(command)) {
        contextualExitCount++;
      } else {
        addCheck(
          checks,
          `unapproved-varies-${command.replace(/[^a-z0-9]+/gi, '-')}`,
          'stale',
          routePath,
          `${command} uses next-recommended: varies without an approved contextual-exit classification.`,
          { spawn: 'god-roadmap-reconciler' }
        );
      }
    }

    const writes = arr(route.execution && route.execution.writes);
    const writesDurableSurface = writes.length > 0;
    if (writesDurableSurface && !route.standards) {
      if (STANDARDS_EXEMPT_COMMANDS.has(command)) {
        standardsExemptCount++;
      } else {
        addCheck(
          checks,
          `missing-standards-${command.replace(/[^a-z0-9]+/gi, '-')}`,
          'stale',
          routePath,
          `${command} writes durable surfaces but has no standards block or approved exemption.`,
          { spawn: 'god-auditor' }
        );
      }
    }
  }

  if (symbolicCount === 0) {
    addCheck(checks, 'atomic-spawn-tokens', 'fresh', 'routing/', 'All route spawn tokens are atomic.');
  }
  if (unresolvedCount === 0) {
    addCheck(checks, 'resolved-spawn-targets', 'fresh', 'routing/', 'All route spawn targets resolve to shipped agents or built-in runtime work.');
  }
  addCheck(
    checks,
    'contextual-exit-policy',
    checks.some((check) => check.id.startsWith('unapproved-varies-')) ? 'stale' : 'fresh',
    'routing/',
    `${contextualExitCount} contextual route exits are approved and all other next routes are explicit.`,
    { spawn: checks.some((check) => check.id.startsWith('unapproved-varies-')) ? 'god-roadmap-reconciler' : null }
  );
  addCheck(
    checks,
    'standards-policy',
    checks.some((check) => check.id.startsWith('missing-standards-')) ? 'stale' : 'fresh',
    'routing/',
    `${standardsExemptCount} durable-writing routes have approved standards exemptions and all other writing routes declare standards.`,
    { spawn: checks.some((check) => check.id.startsWith('missing-standards-')) ? 'god-auditor' : null }
  );

  const stale = checks.filter((check) => check.status !== 'fresh');
  return {
    status: stale.length === 0 ? 'fresh' : 'stale',
    checks,
    stale
  };
}

function appendLog(projectRoot, before, after) {
  const now = new Date().toISOString();
  const lines = [];
  if (fs.existsSync(path.join(projectRoot, LOG_PATH))) {
    lines.push(read(projectRoot, LOG_PATH).replace(/\s*$/, ''));
    lines.push('');
  } else {
    lines.push('# Route Quality Sync Log');
    lines.push('');
    lines.push('- [DECISION] This file records route-quality sync checks run by Godpowers.');
    lines.push('');
  }
  lines.push(`## ${now}`);
  lines.push('');
  lines.push(`- [DECISION] Route quality status before apply was ${before.status}.`);
  lines.push(`- [DECISION] Route quality status after apply is ${after.status}.`);
  lines.push('');
  write(projectRoot, LOG_PATH, lines.join('\n'));
}

function run(projectRoot, opts = {}) {
  const before = detect(projectRoot);
  const after = detect(projectRoot);
  if (opts.log !== false) appendLog(projectRoot, before, after);
  return {
    before,
    after,
    applied: [],
    logPath: opts.log === false ? null : LOG_PATH
  };
}

function summary(report) {
  return report.status === 'fresh' ? 'fresh' : `${report.stale.length} stale`;
}

module.exports = {
  LOG_PATH,
  CONTEXTUAL_NEXT_ALLOWED,
  STANDARDS_EXEMPT_COMMANDS,
  detect,
  run,
  summary
};
