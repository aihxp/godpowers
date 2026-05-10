/**
 * Integration test: /god-mode (full-arc) against todo-app fixture.
 *
 * Status: SCAFFOLD (v0.4). Real assertions in v0.5+.
 *
 * Run: node tests/integration/full-arc.test.js
 */

const assert = require('assert');
const fixture = require('../lib/fixture');
const { runWorkflow } = require('../lib/runner');

async function run() {
  const project = fixture.load('todo-app');

  try {
    const result = await runWorkflow('full-arc', project);

    // v0.4 scaffold assertions: verify infrastructure is wired
    assert.strictEqual(result.workflow, 'full-arc', 'workflow loaded');
    assert.ok(result.project, 'project path set');
    assert.strictEqual(result.status, 'scaffold-only', 'v0.4 stub responded');

    console.log('  + scaffold test passed: workflow + fixture + runner wired');

    // v0.5+ will add real assertions:
    // assert.ok(project.exists('.godpowers/prd/PRD.md'), 'PRD created');
    // assert.ok(project.exists('.godpowers/arch/ARCH.md'), 'ARCH created');
    // assert.ok(project.exists('.godpowers/build/STATE.md'), 'Build done');
    // ... etc

  } finally {
    project.cleanup();
  }
}

run().catch((err) => {
  console.error('  x test failed:', err.message);
  process.exit(1);
});
