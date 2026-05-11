/**
 * Workflow Runner - v0.14 executable workflows.
 *
 * Reads a parsed workflow (from lib/workflow-parser.js), computes a
 * plan (the agent dispatch order, with dependency waves), and either:
 *   - emits the plan only (--plan mode), writing
 *     .godpowers/runs/<id>/plan.yaml
 *   - emits a plan AND signals the orchestrator agent to execute it
 *     step by step
 *
 * For the pure-skill model, "execute" doesn't shell out; the
 * orchestrator agent reads the plan and dispatches agents inside its
 * AI context. The runner's contract is therefore:
 *
 *   - parse + validate the YAML
 *   - compute waves (parallel groups)
 *   - emit a deterministic plan
 *   - return the plan for the orchestrator to follow
 *
 * Public API:
 *   loadByName(workflowName, opts?) -> workflow object
 *   plan(workflow, ctx?) -> { steps: [...], waves: [...], summary }
 *   writePlan(projectRoot, runId, plan) -> path
 *   readPlan(projectRoot, runId) -> plan | null
 *   listWorkflows(opts?) -> [{ name, version, description, file }]
 */

const fs = require('fs');
const path = require('path');

const parser = require('./workflow-parser');

function workflowsDir(opts) {
  if (opts && opts.dir) return opts.dir;
  // Prefer project-local override, then repo workflows/
  const candidates = [
    path.join(process.cwd(), '.godpowers', 'workflows'),
    path.join(__dirname, '..', 'workflows')
  ];
  return candidates.find(d => fs.existsSync(d)) || candidates[1];
}

/**
 * List all available workflows. opts.dir overrides the default
 * lookup chain.
 */
function listWorkflows(opts = {}) {
  const dir = workflowsDir(opts);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.yaml'))
    .map(f => {
      try {
        const wf = parser.parseFile(path.join(dir, f));
        return {
          name: wf.metadata && wf.metadata.name,
          version: wf.metadata && wf.metadata.version,
          description: wf.metadata && wf.metadata.description,
          file: path.join(dir, f)
        };
      } catch (e) {
        return { name: path.basename(f, '.yaml'), file: path.join(dir, f),
                 error: e.message };
      }
    });
}

/**
 * Load a workflow by name (looks up name in workflows/ dir).
 * If `name` ends with .yaml, treats it as a path.
 */
function loadByName(name, opts = {}) {
  if (name.endsWith('.yaml') && fs.existsSync(name)) {
    return parser.parseFile(name);
  }
  const dir = workflowsDir(opts);
  // Look up by metadata.name first; then by filename
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.yaml'))) {
    const wf = parser.parseFile(path.join(dir, f));
    if (wf.metadata && wf.metadata.name === name) return wf;
  }
  const filePath = path.join(dir, `${name}.yaml`);
  if (fs.existsSync(filePath)) return parser.parseFile(filePath);
  throw new Error(`workflow not found: ${name} (searched in ${dir})`);
}

/**
 * Compute an execution plan from a workflow. Uses parser.buildWaves
 * for dependency ordering.
 *
 * Returns:
 *   {
 *     workflow: { name, version, description },
 *     steps: [{ jobKey, agent, tier, needs, uses, review?, on-pass?, on-fail? }],
 *     waves: [[jobKey, ...], ...],
 *     summary: '...'
 *   }
 */
function plan(workflow, ctx = {}) {
  const waves = parser.buildWaves(workflow);
  const steps = [];
  for (const wave of waves) {
    for (const jobKey of wave) {
      const job = workflow.jobs[jobKey] || {};
      steps.push({
        jobKey,
        agent: extractAgent(job.uses),
        tier: job.tier != null ? `tier-${job.tier}` : null,
        needs: parser.normalizeNeeds(job.needs),
        uses: job.uses,
        review: job.review || null,
        'on-pass': job['on-pass'] || null,
        'on-fail': job['on-fail'] || null,
        with: job.with || null
      });
    }
  }
  const summary = formatSummary(workflow, waves, steps);
  return {
    workflow: {
      name: workflow.metadata && workflow.metadata.name,
      version: workflow.metadata && workflow.metadata.version,
      description: workflow.metadata && workflow.metadata.description
    },
    steps,
    waves,
    summary,
    generatedAt: new Date().toISOString(),
    context: ctx
  };
}

function extractAgent(uses) {
  if (!uses) return null;
  const m = String(uses).match(/^([a-z][a-z0-9-]*)/);
  return m ? m[1] : uses;
}

function formatSummary(workflow, waves, steps) {
  const lines = [];
  lines.push(`Workflow: ${workflow.metadata && workflow.metadata.name} v${workflow.metadata && workflow.metadata.version}`);
  if (workflow.metadata && workflow.metadata.description) {
    lines.push(workflow.metadata.description.split('\n')[0]);
  }
  lines.push('');
  lines.push(`Steps: ${steps.length} across ${waves.length} wave${waves.length === 1 ? '' : 's'}`);
  lines.push('');
  for (let i = 0; i < waves.length; i++) {
    lines.push(`Wave ${i + 1}:`);
    for (const jobKey of waves[i]) {
      const step = steps.find(s => s.jobKey === jobKey);
      const agent = step.agent || '(no agent)';
      const tier = step.tier ? ` [${step.tier}]` : '';
      lines.push(`  - ${jobKey}${tier}: ${agent}`);
    }
  }
  return lines.join('\n');
}

/**
 * Write a plan to disk.
 */
function writePlan(projectRoot, runId, planObj) {
  const dir = path.join(projectRoot, '.godpowers', 'runs', runId);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'plan.yaml');
  fs.writeFileSync(file, serializePlan(planObj));
  return file;
}

function serializePlan(p) {
  // YAML-ish hand-roll, paired with our minimal parser
  const lines = [];
  lines.push(`# Generated workflow plan`);
  lines.push(`# Workflow: ${p.workflow.name} v${p.workflow.version}`);
  lines.push(`# Generated: ${p.generatedAt}`);
  lines.push('');
  lines.push(`workflow: ${p.workflow.name}`);
  lines.push(`version: ${p.workflow.version}`);
  lines.push(`generated-at: ${p.generatedAt}`);
  lines.push(`step-count: ${p.steps.length}`);
  lines.push(`wave-count: ${p.waves.length}`);
  lines.push('');
  lines.push('waves:');
  for (let i = 0; i < p.waves.length; i++) {
    lines.push(`  - index: ${i + 1}`);
    lines.push('    steps:');
    for (const jobKey of p.waves[i]) {
      const step = p.steps.find(s => s.jobKey === jobKey);
      lines.push(`      - jobKey: ${jobKey}`);
      if (step.tier) lines.push(`        tier: ${step.tier}`);
      if (step.agent) lines.push(`        agent: ${step.agent}`);
      if (step.uses)  lines.push(`        uses: ${step.uses}`);
      if (step.needs && step.needs.length) {
        lines.push(`        needs: [${step.needs.join(', ')}]`);
      }
    }
  }
  lines.push('');
  lines.push('summary: |');
  for (const l of (p.summary || '').split('\n')) {
    lines.push(`  ${l}`);
  }
  return lines.join('\n') + '\n';
}

function readPlan(projectRoot, runId) {
  const file = path.join(projectRoot, '.godpowers', 'runs', runId, 'plan.yaml');
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
}

module.exports = {
  workflowsDir,
  listWorkflows,
  loadByName,
  plan,
  writePlan,
  readPlan,
  serializePlan
};
