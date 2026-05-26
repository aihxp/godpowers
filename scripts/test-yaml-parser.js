#!/usr/bin/env node
/**
 * Dedicated coverage for the dependency-free YAML subset parser.
 */

const { test, assert, report } = require('./test-harness');
const intent = require('../lib/intent');

console.log('\n  YAML parser behavioral tests\n');

test('preserves quoted colon values', () => {
  const parsed = intent.parseSimpleYaml('metadata:\n  description: "agent: planner"\n');
  assert(parsed.metadata.description === 'agent: planner',
    `description: ${parsed.metadata.description}`);
});

test('preserves hashes inside quoted strings', () => {
  const parsed = intent.parseSimpleYaml('metadata:\n  name: "demo #1" # comment\n');
  assert(parsed.metadata.name === 'demo #1',
    `name: ${parsed.metadata.name}`);
});

test('parses inline arrays with quoted commas', () => {
  const parsed = intent.parseSimpleYaml('commands: ["/god-prd", "label, with comma", 3, true]\n');
  assert(parsed.commands.length === 4, `commands: ${JSON.stringify(parsed.commands)}`);
  assert(parsed.commands[1] === 'label, with comma',
    `quoted comma: ${parsed.commands[1]}`);
  assert(parsed.commands[2] === 3, `number: ${parsed.commands[2]}`);
  assert(parsed.commands[3] === true, `boolean: ${parsed.commands[3]}`);
});

test('parses arrays of scalars under a key', () => {
  const parsed = intent.parseSimpleYaml('on:\n  - /god-init\n  - /god-prd\n');
  assert(Array.isArray(parsed.on), `on: ${JSON.stringify(parsed.on)}`);
  assert(parsed.on[0] === '/god-init', `first: ${parsed.on[0]}`);
  assert(parsed.on[1] === '/god-prd', `second: ${parsed.on[1]}`);
});

test('parses arrays of objects with sibling fields', () => {
  const parsed = intent.parseSimpleYaml(`jobs:
  - id: plan
    uses: god-planner
    needs: [prd, arch]
  - id: build
    uses: god-executor
`);
  assert(Array.isArray(parsed.jobs), `jobs: ${JSON.stringify(parsed.jobs)}`);
  assert(parsed.jobs[0].id === 'plan', `id: ${parsed.jobs[0].id}`);
  assert(parsed.jobs[0].uses === 'god-planner', `uses: ${parsed.jobs[0].uses}`);
  assert(parsed.jobs[0].needs[1] === 'arch', `needs: ${JSON.stringify(parsed.jobs[0].needs)}`);
  assert(parsed.jobs[1].id === 'build', `second id: ${parsed.jobs[1].id}`);
});

test('folded block scalars collapse internal whitespace', () => {
  const parsed = intent.parseSimpleYaml(`metadata:
  description: >
    Line one
    line two
`);
  assert(parsed.metadata.description === 'Line one line two',
    `description: ${JSON.stringify(parsed.metadata.description)}`);
});

report('YAML parser behavioral tests');
