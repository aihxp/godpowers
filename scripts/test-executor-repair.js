#!/usr/bin/env node

const repair = require('../lib/executor-repair');
const { test, assert, report } = require('./test-harness');

test('classifyFailure retries mechanical failures', () => {
  const result = repair.classifyFailure({ error: 'Cannot find module ./auth', attempts: 0 });
  assert(result.strategy === repair.STRATEGIES.RETRY, `strategy: ${result.strategy}`);
});

test('classifyFailure decomposes broad criteria', () => {
  const result = repair.classifyFailure({
    doneCriteria: 'create account and login and reset password',
    error: 'partial implementation'
  });
  assert(result.strategy === repair.STRATEGIES.DECOMPOSE, `strategy: ${result.strategy}`);
});

test('classifyFailure prunes infeasible work', () => {
  const result = repair.classifyFailure({ error: 'blocked by missing prerequisite outside this slice' });
  assert(result.strategy === repair.STRATEGIES.PRUNE, `strategy: ${result.strategy}`);
});

test('classifyFailure escalates on exhausted budget', () => {
  const result = repair.classifyFailure({ error: 'still failing', attempts: 2, budget: 2 });
  assert(result.strategy === repair.STRATEGIES.ESCALATE, `strategy: ${result.strategy}`);
});

test('renderRepairLog produces review-visible history', () => {
  const result = repair.renderRepairLog('Task 2', {
    strategy: repair.STRATEGIES.RETRY,
    reason: 'mechanical import fix'
  });
  assert(result.includes('[Executor Repair - RETRY]'), result);
});

report('Executor repair behavioral tests');
