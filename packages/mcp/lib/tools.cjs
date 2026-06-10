const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { requireRuntimeModule } = require('./runtime.cjs');

const dashboard = requireRuntimeModule('dashboard.js');
const gate = requireRuntimeModule('gate.js');
const linter = requireRuntimeModule('artifact-linter.js');
const requirements = requireRuntimeModule('requirements.js');

const projectSchema = {
  project: z.string().min(1).optional()
};

function resolveProject(defaultProject, project) {
  return path.resolve(project || defaultProject || process.cwd());
}

function ensureInside(root, relPath) {
  const resolved = path.resolve(root, relPath);
  const relative = path.relative(root, resolved);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    return { absolute: resolved, relative: relative.split(path.sep).join('/') };
  }
  throw new Error(`Artifact path must stay inside project root: ${relPath}`);
}

function jsonToolResult(value) {
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

function registerGodpowersTools(server, opts = {}) {
  const defaultProject = path.resolve(opts.project || process.cwd());

  server.registerTool('status', {
    title: 'Godpowers Status',
    description: 'Read the Godpowers dashboard for a project from disk.',
    inputSchema: projectSchema
  }, async (args = {}) => {
    const project = resolveProject(defaultProject, args.project);
    return jsonToolResult(dashboard.compute(project));
  });

  server.registerTool('next', {
    title: 'Godpowers Next',
    description: 'Read the next recommended Godpowers command for a project.',
    inputSchema: projectSchema
  }, async (args = {}) => {
    const project = resolveProject(defaultProject, args.project);
    const result = dashboard.compute(project);
    return jsonToolResult({
      project,
      next: result.next,
      actionBrief: result.actionBrief,
      planning: result.planning,
      proactive: result.proactive
    });
  });

  server.registerTool('gate_check', {
    title: 'Godpowers Gate Check',
    description: 'Run a read-only executable gate check for one tier.',
    inputSchema: {
      ...projectSchema,
      tier: z.enum(['prd', 'design', 'arch', 'roadmap', 'stack', 'repo', 'build', 'harden'])
    }
  }, async (args = {}) => {
    const project = resolveProject(defaultProject, args.project);
    return jsonToolResult(gate.check({ tier: args.tier, projectRoot: project }));
  });

  server.registerTool('lint_artifact', {
    title: 'Godpowers Artifact Lint',
    description: 'Lint one Godpowers artifact inside the selected project.',
    inputSchema: {
      ...projectSchema,
      artifact: z.string().min(1)
    }
  }, async (args = {}) => {
    const project = resolveProject(defaultProject, args.project);
    const artifact = ensureInside(project, args.artifact);
    if (!fs.existsSync(artifact.absolute)) {
      throw new Error(`Artifact not found: ${artifact.relative}`);
    }
    const result = linter.lintFile(artifact.absolute, { projectRoot: project });
    return jsonToolResult({
      project,
      artifact: artifact.relative,
      type: result.type,
      findings: result.findings,
      summary: result.summary
    });
  });

  server.registerTool('trace_requirement', {
    title: 'Godpowers Requirement Trace',
    description: 'Trace a requirement id through requirements, roadmap increments, and linked files.',
    inputSchema: {
      ...projectSchema,
      requirement: z.string().min(1)
    }
  }, async (args = {}) => {
    const project = resolveProject(defaultProject, args.project);
    const derived = requirements.derive(project);
    const requirement = derived.requirements.find(item => item.id === args.requirement) || null;
    const increment = requirement && requirement.increment
      ? derived.increments.find(item => item.id === requirement.increment) || null
      : null;
    return jsonToolResult({
      project,
      requirementId: args.requirement,
      found: Boolean(requirement),
      requirement,
      increment,
      summary: derived.summary,
      gaps: derived.gaps
    });
  });
}

module.exports = {
  registerGodpowersTools,
  jsonToolResult,
  resolveProject,
  ensureInside
};
