#!/usr/bin/env node
/**
 * Tests for lib/workflow-runner.js (v0.14 workflow executor).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const runner = require('../lib/workflow-runner');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  + ${name}`); passed++; }
  catch (e) { console.error(`  x ${name}: ${e.message}`); failed++; }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function mkProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-wfr-'));
  fs.mkdirSync(path.join(tmp, '.godpowers'), { recursive: true });
  return tmp;
}

function mkWorkflowDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-wf-'));
  fs.writeFileSync(path.join(dir, 'simple.yaml'), `apiVersion: godpowers/v1
kind: Workflow
metadata:
  name: simple
  version: 1.0.0
  description: minimal test workflow

on: [/god-mode]

jobs:
  prd:
    tier: 1
    uses: god-pm@^1.0.0
  arch:
    tier: 1
    needs: prd
    uses: god-architect@^1.0.0
  stack:
    tier: 1
    needs: arch
    uses: god-stack-selector@^1.0.0
`);
  return dir;
}

console.log('\n  Workflow runner behavioral tests\n');

test('listWorkflows returns shipped workflows from default dir', () => {
  const all = runner.listWorkflows();
  assert(Array.isArray(all) && all.length > 0,
    `no workflows found in default dir`);
  const names = all.map(w => w.name);
  assert(names.includes('full-arc'), `full-arc missing: ${names}`);
});

test('listWorkflows respects opts.dir', () => {
  const dir = mkWorkflowDir();
  const all = runner.listWorkflows({ dir });
  assert(all.length === 1, `expected 1, got ${all.length}`);
  assert(all[0].name === 'simple', `name: ${all[0].name}`);
});

test('loadByName finds workflow by metadata.name', () => {
  const dir = mkWorkflowDir();
  const wf = runner.loadByName('simple', { dir });
  assert(wf.metadata.name === 'simple', `name: ${wf.metadata.name}`);
  assert(wf.jobs.prd, 'prd job missing');
});

test('loadByName throws on missing workflow', () => {
  const dir = mkWorkflowDir();
  try {
    runner.loadByName('nonexistent', { dir });
    throw new Error('should have thrown');
  } catch (e) {
    assert(/not found/.test(e.message), `unexpected: ${e.message}`);
  }
});

test('plan returns steps in dependency order via waves', () => {
  const dir = mkWorkflowDir();
  const wf = runner.loadByName('simple', { dir });
  const p = runner.plan(wf);
  assert(p.waves.length === 3, `waves: ${p.waves.length}`);
  // Wave 1 = prd, wave 2 = arch, wave 3 = stack
  assert(p.waves[0].includes('prd'), `wave 1: ${p.waves[0]}`);
  assert(p.waves[1].includes('arch'), `wave 2: ${p.waves[1]}`);
  assert(p.waves[2].includes('stack'), `wave 3: ${p.waves[2]}`);
});

test('plan extracts agent name from uses string', () => {
  const dir = mkWorkflowDir();
  const wf = runner.loadByName('simple', { dir });
  const p = runner.plan(wf);
  const prdStep = p.steps.find(s => s.jobKey === 'prd');
  assert(prdStep.agent === 'god-pm', `agent: ${prdStep.agent}`);
});

test('plan summary contains a wave description', () => {
  const dir = mkWorkflowDir();
  const wf = runner.loadByName('simple', { dir });
  const p = runner.plan(wf);
  assert(/Wave 1:/.test(p.summary), 'no Wave 1 in summary');
  assert(/Wave 3:/.test(p.summary), 'no Wave 3 in summary');
  assert(/god-pm/.test(p.summary), 'god-pm not in summary');
});

test('writePlan creates .godpowers/runs/<id>/plan.yaml', () => {
  const tmp = mkProject();
  const dir = mkWorkflowDir();
  const wf = runner.loadByName('simple', { dir });
  const p = runner.plan(wf);
  const file = runner.writePlan(tmp, '2026-05-10T00-00-00-test', p);
  assert(fs.existsSync(file), `${file} not created`);
  const text = fs.readFileSync(file, 'utf8');
  assert(/^workflow: simple/m.test(text), 'workflow name not in plan');
  assert(/wave-count: 3/.test(text), 'wave-count not in plan');
});

test('readPlan returns null when missing', () => {
  const tmp = mkProject();
  assert(runner.readPlan(tmp, 'no-such-run') === null);
});

test('readPlan returns serialized plan text', () => {
  const tmp = mkProject();
  const dir = mkWorkflowDir();
  const wf = runner.loadByName('simple', { dir });
  const p = runner.plan(wf);
  runner.writePlan(tmp, 'run-x', p);
  const got = runner.readPlan(tmp, 'run-x');
  assert(got && /workflow: simple/.test(got),
    `unexpected: ${got && got.slice(0, 60)}`);
});

test('plan handles single-job workflow', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-wf-min-'));
  fs.writeFileSync(path.join(dir, 'just-one.yaml'), `apiVersion: godpowers/v1
kind: Workflow
metadata:
  name: just-one
  version: 1.0.0
  description: single job
on: [/god-mode]
jobs:
  only:
    tier: 0
    uses: god-status@^1.0.0
`);
  const wf = runner.loadByName('just-one', { dir });
  const p = runner.plan(wf);
  assert(p.waves.length === 1, `waves: ${p.waves.length}`);
  assert(p.steps.length === 1, `steps: ${p.steps.length}`);
});

test('plan can be loaded by filename ending in .yaml', () => {
  const dir = mkWorkflowDir();
  const wf = runner.loadByName(path.join(dir, 'simple.yaml'));
  assert(wf.metadata.name === 'simple');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
