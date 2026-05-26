#!/usr/bin/env node
/**
 * Behavioral tests for executable workflow agent references.
 */

const fs = require('fs');
const path = require('path');

const refs = require('../lib/agent-refs');
const workflow = require('../lib/workflow-runner');
const parser = require('../lib/workflow-parser');
const { test, assert, report } = require('./test-harness');

console.log('\n  Agent reference tests\n');

test('parseAgentRef splits agent and range', () => {
  const parsed = refs.parseAgentRef('god-pm@^1.0.0');
  assert(parsed.agent === 'god-pm', `agent: ${parsed.agent}`);
  assert(parsed.range === '^1.0.0', `range: ${parsed.range}`);
});

test('validateAgentRef accepts compatible ranges', () => {
  const result = refs.validateAgentRef('god-executor@^1.0.0');
  assert(result.valid, `expected valid: ${result.errors.join('; ')}`);
});

test('validateAgentRef rejects incompatible ranges', () => {
  const result = refs.validateAgentRef('god-executor@^2.0.0');
  assert(!result.valid, 'expected incompatible range');
  assert(result.errors.some((error) => /contract/.test(error)), result.errors.join('; '));
});

test('workflow plan exposes validated agent range metadata', () => {
  const wf = parser.parse(`apiVersion: godpowers/v1
kind: Workflow
metadata:
  name: agent-ref-demo
  version: 1.0.0
on: [/god-mode]
jobs:
  prd:
    tier: 1
    uses: god-pm@^1.0.0
`);
  const plan = workflow.plan(wf);
  assert(plan.steps[0].agent === 'god-pm', `agent: ${plan.steps[0].agent}`);
  assert(plan.steps[0].agentRange === '^1.0.0', `range: ${plan.steps[0].agentRange}`);
});

test('all shipped workflow agent ranges satisfy the current contract', () => {
  const dir = path.join(__dirname, '..', 'workflows');
  const bad = [];
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.yaml'))) {
    const wf = parser.parseFile(path.join(dir, file));
    for (const [jobKey, job] of Object.entries(wf.jobs || {})) {
      const result = refs.validateAgentRef(job.uses);
      if (!result.valid) bad.push(`${file}:${jobKey}: ${result.errors.join('; ')}`);
    }
  }
  assert(bad.length === 0, bad.join('\n'));
});

report();
