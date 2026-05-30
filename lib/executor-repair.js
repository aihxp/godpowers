const STRATEGIES = Object.freeze({
  RETRY: 'retry',
  DECOMPOSE: 'decompose',
  PRUNE: 'prune',
  ESCALATE: 'escalate'
});

function classifyFailure(input = {}) {
  const attempts = Number(input.attempts || 0);
  const budget = Number(Object.prototype.hasOwnProperty.call(input, 'budget') ? input.budget : 2);
  const error = String(input.error || '').toLowerCase();
  const criteria = String(input.doneCriteria || '').toLowerCase();

  if (attempts >= budget) {
    return {
      strategy: STRATEGIES.ESCALATE,
      reason: 'repair budget exhausted'
    };
  }

  if (/architecture|product decision|ambiguous|human/.test(error)) {
    return {
      strategy: STRATEGIES.ESCALATE,
      reason: 'failure requires a human or architecture decision'
    };
  }

  if (/not found|enoent|missing dependency|cannot find module|wrong path|permission|timeout|network|econn/.test(error)) {
    return {
      strategy: STRATEGIES.RETRY,
      reason: 'failure looks environmental or mechanical'
    };
  }

  if (/and|multiple|all of|end-to-end|full flow/.test(criteria) || /too broad|partial|only.*part/.test(error)) {
    return {
      strategy: STRATEGIES.DECOMPOSE,
      reason: 'done criteria appears too broad for one verified step'
    };
  }

  if (/out of scope|blocked by missing prerequisite|unsupported|cannot be implemented/.test(error)) {
    return {
      strategy: STRATEGIES.PRUNE,
      reason: 'task appears infeasible in the current slice'
    };
  }

  return {
    strategy: STRATEGIES.RETRY,
    reason: 'default to one focused retry before broader action'
  };
}

function renderRepairLog(task, decision) {
  const name = task || 'task';
  const strategy = decision.strategy.toUpperCase();
  return `[Executor Repair - ${strategy}] ${name}: ${decision.reason}`;
}

module.exports = {
  STRATEGIES,
  classifyFailure,
  renderRepairLog
};
