---
name: god-docs
description: |
  Write or update project documentation. Verifies every claim against the
  codebase. Detects docs that lie. Substitution test on every claim,
  three-label test on every sentence.

  Triggers on: "god docs", "/god-docs", "update docs", "write docs",
  "documentation", "fix readme", "verify docs"
---

# /god-docs

Documentation work. Docs that don't lie.

## When to use

- README is out of date
- API docs missing or stale
- New feature shipped, docs need updating
- Onboarding new contributors and docs are insufficient
- Verifying existing docs for drift

## Orchestration

Spawn **god-docs-writer** in fresh context.

The agent:
1. Inventories existing docs vs code surface
2. Verifies every claim in existing docs against code
3. Identifies gaps and drift
4. Writes/updates docs
5. Substitution test + three-label test on every claim
6. Writes UPDATE-LOG.md summarizing changes

## On Completion

```
Docs updated.

Verified: N claims across M docs
Drift found and corrected: N
New docs created: N
Existing docs updated: N

Update log: .godpowers/docs/UPDATE-LOG.md

Suggested next: /god-status or continue with feature work
```

## Have-Nots

Docs FAIL if:
- Any claim contradicts the code
- Examples don't actually run
- Substitution test passes (reads generic)
- Runbooks not tested before commit
- Diagrams represent past or future state, not current
