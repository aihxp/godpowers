/**
 * Workflow runner for integration tests.
 *
 * Status: SCAFFOLD (v0.4). Real implementation in v0.5 alongside the
 * workflow YAML runtime.
 *
 * The pattern: parse a workflow YAML, execute its DAG, mock LLM calls
 * via replay layer.
 */

const fs = require('fs');
const path = require('path');
const { replay } = require('./replay');

const WORKFLOWS_DIR = path.join(__dirname, '..', '..', 'workflows');

/**
 * Run a workflow against a fixture project.
 *
 * Stub: in v0.4 this just records what the runner WOULD do.
 * In v0.5+ it actually parses the YAML and executes the DAG with mocked
 * LLM responses.
 */
async function runWorkflow(workflowName, project, options = {}) {
  const workflowPath = path.join(WORKFLOWS_DIR, `${workflowName}.yaml`);
  if (!fs.existsSync(workflowPath)) {
    throw new Error(`Workflow not found: ${workflowName}`);
  }

  // v0.4 placeholder: just verify the workflow exists and project is loadable
  // v0.5+ will actually parse and execute
  return {
    workflow: workflowName,
    project: project.path,
    status: 'scaffold-only',
    note: 'Real workflow execution lands in v0.5. This stub verifies the test infrastructure is wired correctly.',
    artifacts: project.listArtifacts(),
    paused: false
  };
}

module.exports = { runWorkflow };
