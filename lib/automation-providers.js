/**
 * Godpowers Automation Providers
 *
 * Detects host-native automation surfaces and renders opt-in setup guidance.
 * This module never creates schedules, routines, background agents, commits,
 * pushes, packages, publishes, deploys, or clears reviews by itself.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');

const CONFIG_PATH = '.godpowers/automations.json';

const SAFE_TEMPLATES = [
  {
    id: 'daily-status',
    title: 'Daily Godpowers status',
    cadence: 'Daily at 9am local time',
    risk: 'read-only',
    prompt: 'Run godpowers status --project . and summarize current phase, progress, open items, and recommended next action.'
  },
  {
    id: 'stale-checkpoint',
    title: 'Stale checkpoint watcher',
    cadence: 'Weekdays at 9am local time',
    risk: 'read-only',
    prompt: 'Check .godpowers/CHECKPOINT.md freshness. If stale, report that /god-sync or /god-resume-work should run.'
  },
  {
    id: 'review-queue',
    title: 'Review queue watcher',
    cadence: 'Daily at 10am local time',
    risk: 'read-only',
    prompt: 'Inspect .godpowers/REVIEW-REQUIRED.md and report unresolved review items without clearing them.'
  },
  {
    id: 'weekly-hygiene',
    title: 'Weekly hygiene report',
    cadence: 'Monday at 9am local time',
    risk: 'read-only',
    prompt: 'Run a read-only hygiene summary for docs drift, dependency signals, checkpoint age, and pending reviews.'
  },
  {
    id: 'release-readiness',
    title: 'Release readiness report',
    cadence: 'Manual or before release',
    risk: 'read-only',
    prompt: 'Report release readiness from tests, package metadata, changelog, release notes, and unstaged work. Do not publish.'
  }
];

const PROVIDERS = [
  {
    id: 'codex-app',
    label: 'Codex App automations',
    runtime: 'codex',
    class: 'native-scheduler',
    detect: (ctx) => hasRuntime(ctx, 'codex') || hasEnv(ctx, 'CODEX_HOME'),
    setup: [
      'Use /god-automation-setup inside Codex App so the host can create reviewed automations.',
      'Prefer thread heartbeat for short follow-ups and worktree cron for durable project checks.'
    ]
  },
  {
    id: 'claude-routines',
    label: 'Claude Code routines',
    runtime: 'claude',
    class: 'native-scheduler',
    detect: (ctx) => hasCommand(ctx, 'claude') || hasRuntime(ctx, 'claude'),
    setup: [
      'Run /schedule in Claude Code for scheduled routines.',
      'Use claude.ai/code/routines for API or GitHub triggers.'
    ]
  },
  {
    id: 'cline-schedule',
    label: 'Cline scheduled agents',
    runtime: 'cline',
    class: 'native-scheduler',
    detect: (ctx) => hasCommand(ctx, 'cline') || hasRuntime(ctx, 'cline'),
    setup: [
      'Run cline schedule to create, list, trigger, pause, resume, or delete schedules.',
      'Use read-only prompts unless the user explicitly approves branch or PR automation.'
    ]
  },
  {
    id: 'kilo-scheduled-triggers',
    label: 'Kilo scheduled triggers',
    runtime: 'kilo',
    class: 'native-scheduler',
    detect: (ctx) => hasRuntime(ctx, 'kilo'),
    setup: [
      'Use KiloClaw Scheduled Triggers from Kilo settings.',
      'Limit each trigger to read-only Godpowers reports unless the user approves write scope.'
    ]
  },
  {
    id: 'qwen-loop',
    label: 'Qwen Code /loop',
    runtime: 'qwen',
    class: 'session-scheduler',
    detect: (ctx) => hasCommand(ctx, 'qwen') || hasRuntime(ctx, 'qwen'),
    setup: [
      'Enable Qwen experimental cron support, then use /loop for session-scoped recurring prompts.',
      'Do not treat Qwen loops as durable because they do not persist across restarts.'
    ]
  },
  {
    id: 'cursor-background-agent',
    label: 'Cursor Background Agents',
    runtime: 'cursor',
    class: 'background-agent',
    detect: (ctx) => hasCommand(ctx, 'cursor') || hasRuntime(ctx, 'cursor'),
    setup: [
      'Use Cursor Background Agent mode or Background Agent API for asynchronous branch work.',
      'Prefer issue or branch scoped tasks and require human review before merge.'
    ]
  },
  {
    id: 'github-copilot-cloud-agent',
    label: 'GitHub Copilot cloud agent',
    runtime: 'copilot',
    class: 'background-agent',
    detect: (ctx) => hasGitRemote(ctx) || hasRuntime(ctx, 'copilot'),
    setup: [
      'Use GitHub issues, pull requests, or Copilot chat to delegate work to Copilot cloud agent.',
      'Keep Godpowers automations branch or PR scoped and require human merge authority.'
    ]
  },
  {
    id: 'windsurf-workflows',
    label: 'Windsurf workflows',
    runtime: 'windsurf',
    class: 'manual-workflow',
    detect: (ctx) => hasRuntime(ctx, 'windsurf'),
    setup: [
      'Install reusable workflows under .windsurf/workflows/ or the global Windsurf workflow folder.',
      'Windsurf workflows are manual-only; use Skills when Cascade should discover a procedure.'
    ]
  },
  {
    id: 'gemini-headless',
    label: 'Gemini CLI headless mode',
    runtime: 'gemini',
    class: 'scriptable-headless',
    detect: (ctx) => hasCommand(ctx, 'gemini') || hasRuntime(ctx, 'gemini'),
    setup: [
      'Use gemini -p for non-interactive scripting.',
      'Use an external scheduler only when the user explicitly asks for OS or CI scheduling.'
    ]
  },
  {
    id: 'opencode-run',
    label: 'OpenCode run and serve',
    runtime: 'opencode',
    class: 'scriptable-headless',
    detect: (ctx) => hasCommand(ctx, 'opencode') || hasRuntime(ctx, 'opencode'),
    setup: [
      'Use opencode run for non-interactive prompts or opencode serve for an attachable server.',
      'Use opencode github install when repo-native GitHub automation is preferred.'
    ]
  },
  {
    id: 'augment-subagents',
    label: 'Augment Agent and subagents',
    runtime: 'augment',
    class: 'manual-workflow',
    detect: (ctx) => hasRuntime(ctx, 'augment'),
    setup: [
      'Use Augment Agent or Agent Auto for supervised tasks.',
      'Use Augment subagents for specialized review, test, or docs work.'
    ]
  },
  {
    id: 'codebuddy-sdk',
    label: 'CodeBuddy Agent SDK',
    runtime: 'codebuddy',
    class: 'scriptable-headless',
    detect: (ctx) => hasCommand(ctx, 'codebuddy') || hasRuntime(ctx, 'codebuddy'),
    setup: [
      'Use the CodeBuddy Agent SDK for programmatic automation.',
      'Keep filesystem config loading explicit so automation stays predictable.'
    ]
  },
  {
    id: 'pi-sdk',
    label: 'Pi CLI and SDK',
    runtime: 'pi',
    class: 'scriptable-headless',
    detect: (ctx) => hasCommand(ctx, 'pi') || hasRuntime(ctx, 'pi'),
    setup: [
      'Use Pi CLI or SDK for scriptable coding-agent sessions.',
      'Use host or CI scheduling only after explicit user approval.'
    ]
  },
  {
    id: 'trae',
    label: 'Trae',
    runtime: 'trae',
    class: 'unknown',
    detect: (ctx) => hasRuntime(ctx, 'trae'),
    setup: [
      'No stable scheduled automation provider is documented for Godpowers yet.',
      'Use manual Godpowers commands until a native Trae automation surface is confirmed.'
    ]
  },
  {
    id: 'antigravity',
    label: 'Google Antigravity',
    runtime: 'antigravity',
    class: 'unknown',
    detect: (ctx) => hasRuntime(ctx, 'antigravity'),
    setup: [
      'Agent-first workflows are supported, but scheduled automation is not confirmed for Godpowers yet.',
      'Use manual workflows and require artifact review for autonomous agent work.'
    ]
  }
];

function detect(projectRoot = process.cwd(), opts = {}) {
  const ctx = {
    projectRoot,
    home: opts.home || os.homedir(),
    env: opts.env || process.env,
    commands: opts.commands || null,
    gitRemote: opts.gitRemote
  };
  const active = readConfig(projectRoot).automations || [];
  const providers = PROVIDERS.map(provider => {
    const installed = Boolean(provider.detect(ctx));
    return {
      id: provider.id,
      label: provider.label,
      runtime: provider.runtime,
      class: provider.class,
      installed,
      status: providerStatus(provider.class, installed),
      active: active.filter(item => item.provider === provider.id),
      setup: provider.setup.slice()
    };
  });

  const safeTemplates = SAFE_TEMPLATES.map(template => ({
    ...template,
    active: active.some(item => item.id === template.id && item.status !== 'disabled')
  }));

  return {
    configPath: path.join(projectRoot, CONFIG_PATH),
    providers,
    safeTemplates,
    active,
    recommendedProvider: recommendProvider(providers),
    safety: [
      'Do not create automations during install.',
      'Create schedules, routines, background agents, or API triggers only after explicit user approval.',
      'Default templates are read-only and must not commit, push, publish, deploy, clear reviews, or access provider dashboards.'
    ]
  };
}

function render(report) {
  const active = report.active && report.active.length > 0
    ? report.active.map(item => `  - ${item.id} via ${item.provider}: ${item.status || 'active'}`)
    : ['  - none recorded'];
  const providers = report.providers.map(provider => (
    `  - ${provider.label}: ${provider.status} (${provider.class})`
  ));
  const recommended = report.recommendedProvider
    ? `${report.recommendedProvider.label} (${report.recommendedProvider.class})`
    : 'none available';
  const templates = report.safeTemplates.map(template => (
    `  - ${template.id}: ${template.title}, ${template.cadence}, ${template.risk}`
  ));

  return [
    'Godpowers Automation Providers',
    '',
    `Config: ${report.configPath}`,
    `Recommended provider: ${recommended}`,
    '',
    'Active automations:',
    ...active,
    '',
    'Provider status:',
    ...providers,
    '',
    'Safe templates:',
    ...templates,
    '',
    'Safety rules:',
    ...report.safety.map(rule => `  - ${rule}`)
  ].join('\n');
}

function setupPlan(projectRoot = process.cwd(), opts = {}) {
  const report = detect(projectRoot, opts);
  const provider = report.recommendedProvider;
  return {
    ...report,
    setup: provider ? provider.setup : ['No automation provider is available. Use /god-next or godpowers next --project . manually.']
  };
}

function renderSetupPlan(plan) {
  const provider = plan.recommendedProvider
    ? `${plan.recommendedProvider.label} (${plan.recommendedProvider.id})`
    : 'none available';
  return [
    'Godpowers Automation Setup Plan',
    '',
    `Recommended provider: ${provider}`,
    '',
    'Setup steps:',
    ...plan.setup.map((step, index) => `  ${index + 1}. ${step}`),
    '',
    'Recommended safe templates:',
    ...plan.safeTemplates.map(template => `  - ${template.id}: ${template.prompt}`),
    '',
    'Approval required:',
    '  - Choose a provider',
    '  - Choose one or more templates',
    '  - Confirm any host-native schedule, routine, background agent, API trigger, or connector scope'
  ].join('\n');
}

function readConfig(projectRoot) {
  const file = path.join(projectRoot, CONFIG_PATH);
  if (!fs.existsSync(file)) return { automations: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return {
      automations: Array.isArray(parsed.automations) ? parsed.automations : []
    };
  } catch (e) {
    return { automations: [] };
  }
}

function providerStatus(providerClass, installed) {
  if (providerClass === 'unknown') return installed ? 'installed, capability unknown' : 'unknown';
  if (providerClass === 'manual-workflow') return installed ? 'manual workflow available' : 'supported, not detected';
  if (providerClass === 'session-scheduler') return installed ? 'session scheduler available' : 'supported, not detected';
  if (providerClass === 'background-agent') return installed ? 'background agent available' : 'supported, not detected';
  if (providerClass === 'scriptable-headless') return installed ? 'scriptable headless available' : 'supported, not detected';
  if (providerClass === 'native-scheduler') return installed ? 'native scheduler available' : 'supported, not detected';
  return installed ? 'available' : 'not detected';
}

function recommendProvider(providers) {
  const order = [
    'native-scheduler',
    'background-agent',
    'scriptable-headless',
    'session-scheduler',
    'manual-workflow'
  ];
  for (const providerClass of order) {
    const found = providers.find(provider => provider.installed && provider.class === providerClass);
    if (found) return found;
  }
  return null;
}

function hasRuntime(ctx, runtime) {
  const homePath = path.join(ctx.home, `.${runtime}`, 'GODPOWERS_VERSION');
  return fs.existsSync(homePath);
}

function hasEnv(ctx, key) {
  return Boolean(ctx.env && ctx.env[key]);
}

function hasCommand(ctx, command) {
  if (ctx.commands) {
    return Boolean(ctx.commands[command]);
  }
  try {
    cp.execFileSync('which', [command], { stdio: ['ignore', 'ignore', 'ignore'] });
    return true;
  } catch (e) {
    return false;
  }
}

function hasGitRemote(ctx) {
  if (ctx.gitRemote !== undefined) return Boolean(ctx.gitRemote);
  try {
    const out = cp.execFileSync('git', ['remote', '-v'], {
      cwd: ctx.projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return /github\.com[:/]/.test(out);
  } catch (e) {
    return false;
  }
}

module.exports = {
  CONFIG_PATH,
  SAFE_TEMPLATES,
  PROVIDERS,
  detect,
  render,
  setupPlan,
  renderSetupPlan,
  readConfig
};
