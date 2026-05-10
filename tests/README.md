# Tests

Three test layers for Godpowers. v0.4 has structural tests; v0.5+ adds
integration tests with record/replay.

## Layer 1: Smoke tests (v0.4, current)

Structural validation: do files exist, have frontmatter, reference the right
agents, etc.

```bash
bash scripts/smoke.sh
```

228 checks. Fast (<1 second). Run in CI on every push.

## Layer 2: Skill validation (v0.4, current)

Per-skill checks: trigger phrases, body length, required fields.

```bash
node scripts/validate-skills.js
```

136 checks. Fast. Run in CI.

## Layer 3: Integration tests with record/replay (v0.5+)

End-to-end tests against fixture projects. Mock the LLM layer so tests are
deterministic.

```
tests/
  integration/
    full-arc.test.js          <- /god-mode against fixture
    feature.test.js           <- /god-feature against fixture
    hotfix.test.js
    refactor.test.js
    spike.test.js
    postmortem.test.js
    upgrade.test.js
    docs.test.js
    update-deps.test.js
  fixtures/
    todo-app/                 <- a sample greenfield project
    legacy-monolith/          <- a sample existing project for /god-feature
    flaky-prod/               <- a sample project with simulated incidents
  replay/
    recordings/               <- recorded LLM responses keyed by request hash
    update.sh                 <- re-record after intentional prompt changes
```

### Record/replay layer

Why: deterministic LLM responses are impossible. Record real responses once,
replay forever in tests.

How:
1. First run: `RECORD=1 npm test` calls real Claude API and saves responses
2. Subsequent runs: `npm test` intercepts model calls, returns recorded data
3. After prompt changes: `npm test --update-recordings` re-records affected

Implementation deferred to v0.5 alongside the workflow runtime.

### Fixture projects

Each fixture is a real-ish project layout:

```
tests/fixtures/todo-app/
  package.json
  src/
    server.ts
    db.ts
  tests/
    server.test.ts
  .godpowers/                 <- pre-populated with intent.yaml for the test
```

Tests run `god-mode` (or whichever workflow) against the fixture and assert
on resulting artifacts.

### What we're NOT testing in CI

- Agent intelligence: that's evals, run separately
- Real Claude API behavior: that's record/replay's job
- Performance under load: that's perf testing, separate suite

## Plugin contract tests (v0.8+)

Extensions ship `__tests__/` with fixture inputs. The Godpowers test runner
verifies the extension's contract before allowing publish.

```bash
godpowers test-extension ./extensions/security-pack
```

(Implementation lands when v0.8 ships the extension loader.)
