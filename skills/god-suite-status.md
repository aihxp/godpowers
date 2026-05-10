---
name: god-suite-status
description: |
  Show all repos' status side-by-side in a Mode D suite. Refreshes
  per-repo state, runs meta-linter, displays aggregate metrics.

  Triggers on: "god suite status", "/god-suite-status", "suite status",
  "all repos status"
---

# /god-suite-status

The `/god-status` equivalent for the whole suite. Refreshes each
repo's state, runs cross-repo invariants, prints a single aggregated
report.

## Process

1. Verify `.godpowers/suite-config.yaml` exists (or sibling's
   state.json points at a hub).
2. Spawn `god-coordinator` in `status` mode.
3. god-coordinator runs:
   - `lib/suite-state.refreshFromRepos(hubPath)` to aggregate state
   - `lib/meta-linter.runAll(hubPath)` to check invariants
   - `lib/cross-repo-linkage.collectAllIds(hubPath)` to count IDs
4. Prints the formatted report.

## Output (example)

```
Suite: my-products

Aggregate
  Total artifacts complete: 42
  Total drift findings: 3
  Pending reviews: 5
  Average linkage coverage: 87%

Per-repo
| Repo      | Mode | Phase     | Artifacts | Coverage | Drift | Reviews |
|-----------|------|-----------|-----------|----------|-------|---------|
| dashboard | A    | in-arc    | 12        | 92%      | 0     | 1       |
| api       | A    | steady    | 18        | 85%      | 2     | 2       |
| docs      | A    | steady    | 12        | 84%      | 1     | 2       |

Meta-lint findings (3):
  [WARNING] byte-identical-drift: .editorconfig differs across repos
  [WARNING] version-table-drift: api 2.4 declared, package.json has 2.3
  [WARNING] shared-standard-drift: docs uses eslint, suite declares biome

Suggested next:
  /god-suite-sync   to address byte-identical drift
  /god-review-changes  in dashboard repo (1 pending)
  /god-review-changes  in api repo (2 pending)
```

## Forms

| Form | Action |
|---|---|
| `/god-suite-status` | Default report |
| `/god-suite-status --json` | Structured JSON |
| `/god-suite-status --strict` | Promote warnings to errors (per Q2 lock) |
