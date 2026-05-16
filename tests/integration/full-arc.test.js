/**
 * Integration test: /god-mode (full-arc) against todo-app fixture.
 *
 * Run: node tests/integration/full-arc.test.js
 */

const assert = require('assert');
const fs = require('fs');
const fixture = require('../lib/fixture');
const { runWorkflow } = require('../lib/runner');

async function run() {
  const project = fixture.load('todo-app');

  try {
    const result = await runWorkflow('full-arc', project, {
      fixture: 'todo-app',
      runId: 'full-arc-todo-app-smoke'
    });

    assert.strictEqual(result.workflow, 'full-arc', 'workflow loaded');
    assert.ok(result.project, 'project path set');
    assert.strictEqual(result.status, 'planned', 'workflow planned');
    assert.strictEqual(result.stepCount, 11, 'full-arc step count');
    assert.strictEqual(result.waveCount, 8, 'full-arc wave count');
    assert.ok(project.exists('.godpowers/runs/full-arc-todo-app-smoke/plan.yaml'),
      'plan artifact written');

    const jobs = result.plan.steps.map(step => step.jobKey);
    for (const job of ['prd', 'arch', 'roadmap', 'stack', 'repo', 'build',
      'deploy', 'observe', 'harden', 'launch', 'final-sync']) {
      assert.ok(jobs.includes(job), `missing full-arc job: ${job}`);
    }

    const planText = fs.readFileSync(result.planPath, 'utf8');
    assert.ok(/workflow: full-arc/.test(planText), 'plan names workflow');
    assert.ok(/step-count: 11/.test(planText), 'plan records step count');
    assert.ok(/wave-count: 8/.test(planText), 'plan records wave count');
    assert.ok(/god-pm/.test(planText), 'plan includes PM agent');
    assert.ok(/god-launch-strategist/.test(planText), 'plan includes launch agent');
    assert.ok(/local-helpers: \[feature-awareness, source-sync-back/.test(planText),
      'plan includes final sync local helpers');

    console.log('  + full-arc smoke passed: fixture + workflow plan + artifact');

  } finally {
    project.cleanup();
  }
}

run().catch((err) => {
  console.error('  x test failed:', err.message);
  process.exit(1);
});
