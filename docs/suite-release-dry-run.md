# Suite Release Dry-Run

## Purpose

- [DECISION] Mode D suite releases can now plan dependency impact before any
  repository is mutated.
- [DECISION] The dry-run plan lets `god-coordinator` show which sibling repos
  would receive version or dependency updates.
- [DECISION] The plan preserves the Quarterback rule because each repo still
  owns its own release execution.

## Runtime API

`lib/suite-state.js` exposes:

```js
suiteState.planRelease(hubPath, repoName, version)
```

The returned plan includes:

- [DECISION] `mode: dry-run` unless apply mode is explicitly requested.
- [DECISION] `status: ready` when the repo is registered in
  `.godpowers/suite-config.yaml`.
- [DECISION] `status: blocked` with blockers when the repo is not registered.
- [DECISION] `impacted` dependents discovered from sibling `package.json`
  dependency declarations.
- [DECISION] `writes` describing the files that a real release would mutate.

## Tests

```bash
node scripts/test-mode-d.js
node scripts/test-dogfood-runner.js
```

- [DECISION] The Mode D unit test verifies direct dependent impact planning.
- [DECISION] The dogfood suite verifies the same behavior through a fixture
  suite.
