# Integration Tests

End-to-end smoke tests for shipped workflows. These tests copy a fixture project
to a temp directory, load the production workflow YAML, generate deterministic
agent waves through `lib/workflow-runner.js`, and assert that the plan artifact
is written under `.godpowers/runs/`.

## Current coverage

| Test | Coverage |
|------|----------|
| `full-arc.test.js` | `/god-mode` full-arc workflow loads, plans 10 jobs across 7 waves, and writes `plan.yaml`. |

## Run

```bash
npm run test:e2e
```

## Fixture

| Fixture | Tests |
|---------|-------|
| `todo-app` | Full-arc plan-mode smoke path for a small greenfield project. |

## Boundary

The workflow runtime plans agent execution and writes the plan. It does not
execute LLM agents in CI. Real agent execution should be covered by future
record/replay tests or evals.
