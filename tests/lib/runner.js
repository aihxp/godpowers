/**
 * Workflow runner for integration tests.
 *
 * Integration tests use the same workflow runtime as the package. The runtime
 * plans deterministic agent waves and writes the plan artifact; actual agent
 * execution still happens inside the orchestrator context.
 */

const workflowRunner = require('../../lib/workflow-runner');

/**
 * Run a workflow against a fixture project.
 *
 * This is intentionally a plan-mode smoke path. It proves the shipped workflow
 * can be loaded, planned, and persisted for a real copied fixture project.
 */
async function runWorkflow(workflowName, project, options = {}) {
  const workflow = workflowRunner.loadByName(workflowName, options);
  const runId = options.runId || `${workflowName}-smoke`;
  const plan = workflowRunner.plan(workflow, {
    projectRoot: project.path,
    fixture: options.fixture || null
  });
  const planPath = workflowRunner.writePlan(project.path, runId, plan);

  return {
    workflow: workflowName,
    project: project.path,
    status: 'planned',
    runId,
    planPath,
    plan,
    stepCount: plan.steps.length,
    waveCount: plan.waves.length,
    artifacts: project.listArtifacts(),
    paused: false
  };
}

module.exports = { runWorkflow };
