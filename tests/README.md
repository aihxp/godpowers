# Tests

Godpowers uses fast structural tests, runtime behavioral tests, fixture-backed
integration tests, and package smoke tests.

## Smoke tests

Structural validation: do files exist, have frontmatter, reference the right
agents, etc.

```bash
bash scripts/smoke.sh
```

Fast structural coverage. Run in CI on every push through `npm test`.

## Skill validation

Per-skill checks: trigger phrases, body length, required fields.

```bash
node scripts/validate-skills.js
```

Fast command-surface coverage. Run in CI through `npm test`.

## Runtime behavioral tests

Runtime modules under `lib/` have focused behavioral tests in `scripts/`.
These cover routing, recipes, state, events, workflow parsing, workflow plan
generation, artifact linting, extension loading, browser bridges, cost tracking,
and OpenTelemetry export.

```bash
npm test
```

## E2E smoke tests

Fixture-backed smoke tests live under `tests/integration/`. They verify that a
copied fixture project can load a shipped workflow, generate deterministic agent
waves, and write the plan artifact.

```bash
npm run test:e2e
```

```
tests/
  integration/
    full-arc.test.js          <- /god-mode plan smoke against fixture
  fixtures/
    todo-app/                 <- a sample greenfield project
  replay/
    recordings/               <- future recorded LLM responses
    update.sh                 <- future re-record helper
```

### Future record/replay layer

Why: deterministic LLM responses are impossible. Record real responses once,
replay forever in tests.

How:

1. First run: `RECORD=1 npm test` calls real Claude API and saves responses
2. Subsequent runs: `npm test` intercepts model calls, returns recorded data
3. After prompt changes: `npm test --update-recordings` re-records affected

This layer is not required for the current plan-mode E2E smoke test.

### Fixture projects

Each fixture is a small project layout:

```
tests/fixtures/todo-app/
  INTENT.md
  README.md
```

Tests copy the fixture to a temp directory, run the workflow planner against
that copy, and assert on generated `.godpowers/runs/<id>/plan.yaml`.

### What CI does not test

- Agent intelligence: that belongs in evals.
- Real Claude API behavior: that belongs in a record/replay layer.
- Performance under load: that belongs in a separate performance suite.

## Extension contract tests

Extensions ship `__tests__/` with fixture inputs. The Godpowers test runner
verifies extension package readiness through `scripts/test-extensions-publish.js`.

```bash
npm test
```
