const path = require('path');
const z = require('zod/v4');

const runtime = require('./runtime');

const TOOL_NAMES = [
  'status',
  'next',
  'gate_check',
  'lint_artifact',
  'trace_requirement'
];

function toolResult(value) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(value, null, 2)
      }
    ],
    structuredContent: value
  };
}

function toolError(error) {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: error && error.message ? error.message : String(error)
      }
    ]
  };
}

async function withErrors(fn) {
  try {
    return toolResult(await fn());
  } catch (error) {
    return toolError(error);
  }
}

function projectRootFor(input, opts) {
  return runtime.resolveProject(input.project || opts.projectRoot || process.cwd());
}

function statusTool(input = {}, opts = {}) {
  const projectRoot = projectRootFor(input, opts);
  const dashboard = runtime.requireRuntime('dashboard', opts);
  const result = dashboard.compute(projectRoot, { git: input.git !== false });
  return {
    project: projectRoot,
    dashboard: result,
    rendered: dashboard.render(result, { brief: Boolean(input.brief) })
  };
}

function nextTool(input = {}, opts = {}) {
  const projectRoot = projectRootFor(input, opts);
  const dashboard = runtime.requireRuntime('dashboard', opts);
  const result = dashboard.compute(projectRoot, { git: input.git !== false });
  return {
    project: projectRoot,
    next: result.next,
    actionBrief: result.actionBrief,
    dashboard: result
  };
}

function gateTool(input = {}, opts = {}) {
  const projectRoot = projectRootFor(input, opts);
  const gate = runtime.requireRuntime('gate', opts);
  return gate.check({
    tier: input.tier,
    projectRoot
  });
}

function lintTool(input = {}, opts = {}) {
  const projectRoot = projectRootFor(input, opts);
  const linter = runtime.requireRuntime('artifact-linter', opts);
  const artifactPath = runtime.resolveProjectFile(projectRoot, input.path);
  const result = linter.lintFile(artifactPath, { projectRoot });
  return {
    project: projectRoot,
    artifact: path.relative(projectRoot, artifactPath).split(path.sep).join('/'),
    lint: {
      type: result.type,
      findings: result.findings,
      summary: result.summary
    }
  };
}

function traceRequirementTool(input = {}, opts = {}) {
  const projectRoot = projectRootFor(input, opts);
  const requirements = runtime.requireRuntime('requirements', opts);
  const derived = requirements.derive(projectRoot);
  const id = String(input.id || '').trim();
  const requirement = derived.requirements.find((item) => item.id === id) || null;
  const increment = requirement && requirement.increment
    ? derived.increments.find((item) => item.id === requirement.increment) || null
    : null;
  return {
    project: projectRoot,
    id,
    found: Boolean(requirement),
    requirement,
    increment,
    summary: derived.summary,
    ledger: requirements.LEDGER_PATH
  };
}

function registerTools(server, opts = {}) {
  server.registerTool('status', {
    title: 'Godpowers status',
    description: 'Read Godpowers dashboard state from disk.',
    inputSchema: {
      project: z.string().optional().describe('Project root. Defaults to the server project.'),
      brief: z.boolean().optional().describe('Include compact rendered dashboard text.'),
      git: z.boolean().optional().describe('Set false to skip git status checks.')
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
    }
  }, async (input) => withErrors(() => statusTool(input, opts)));

  server.registerTool('next', {
    title: 'Godpowers next',
    description: 'Read the recommended next Godpowers command from disk state.',
    inputSchema: {
      project: z.string().optional().describe('Project root. Defaults to the server project.'),
      git: z.boolean().optional().describe('Set false to skip git status checks.')
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
    }
  }, async (input) => withErrors(() => nextTool(input, opts)));

  server.registerTool('gate_check', {
    title: 'Godpowers gate check',
    description: 'Run a read-only executable tier gate check.',
    inputSchema: {
      project: z.string().optional().describe('Project root. Defaults to the server project.'),
      tier: z.enum(['prd', 'design', 'arch', 'roadmap', 'stack', 'repo', 'build', 'harden'])
        .describe('Gate tier to check.')
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
    }
  }, async (input) => withErrors(() => gateTool(input, opts)));

  server.registerTool('lint_artifact', {
    title: 'Godpowers artifact lint',
    description: 'Lint one artifact path inside the project root.',
    inputSchema: {
      project: z.string().optional().describe('Project root. Defaults to the server project.'),
      path: z.string().describe('Artifact path relative to the project root.')
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
    }
  }, async (input) => withErrors(() => lintTool(input, opts)));

  server.registerTool('trace_requirement', {
    title: 'Godpowers requirement trace',
    description: 'Trace one PRD requirement id to linkage and roadmap evidence.',
    inputSchema: {
      project: z.string().optional().describe('Project root. Defaults to the server project.'),
      id: z.string().describe('Requirement id such as P-MUST-01.')
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
    }
  }, async (input) => withErrors(() => traceRequirementTool(input, opts)));
}

module.exports = {
  TOOL_NAMES,
  registerTools,
  statusTool,
  nextTool,
  gateTool,
  lintTool,
  traceRequirementTool,
  toolResult,
  toolError
};
