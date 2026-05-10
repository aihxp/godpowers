---
name: god-sync
description: |
  Sync all affected artifacts after feature work. Updates PRD, ARCH, ROADMAP,
  STACK, DEPLOY, OBSERVE, HARDEN, LAUNCH, BACKLOG, SEEDS, TODOS, THREADS
  based on what the work actually touched. Closes the loop after
  /god-reconcile + feature execution.

  Triggers on: "god sync", "/god-sync", "sync everything", "update all",
  "close the loop", "post-work sync"
---

# /god-sync

Update all artifacts after feature work.

## When auto-invoked

End of feature-addition recipes. After feature work completes, /god-sync
runs to ensure no artifact drifts.

## When manually invoked

User runs `/god-sync` after manual changes. Useful for:
- After making code changes outside the recipe flow
- Periodic sync to catch drift
- Before declaring a milestone complete

## Setup

1. Verify `.godpowers/` exists
2. Spawn god-updater in fresh context with:
   - The reconciliation verdict (if available from a prior /god-reconcile)
   - Or: re-run reconciliation against current state to detect what changed
   - Recent commits for context

## Verification

After god-updater returns:
1. Verify each touched artifact passes its tier's have-nots
2. Verify SYNC-LOG.md was appended
3. Verify state.json reflects new tier statuses
4. Display summary of what changed

## Output

```
Sync complete.

Updated:
  - prd/PRD.md (added requirement P-MUST-12)
  - arch/ARCH.md (added ADR-007)
  - roadmap/ROADMAP.md (Milestone 2 marked complete)
  - deploy/STATE.md (new env var)
  - observe/STATE.md (new SLO)
  - backlog/BACKLOG.md (entry resolved)
  - todos/TODOS.md (1 todo marked done)
  - threads/auth-migration.md (progress note)

Have-nots: all passing
SYNC-LOG.md updated.

Suggested next: /god-status
```

## What this prevents

| Drift type | How /god-sync catches it |
|---|---|
| Roadmap drift | Marks milestones complete; appends new entries |
| PRD-roadmap divergence | Flags if roadmap added work not in PRD |
| Stale ARCH | Adds ADR for new architectural decisions |
| Forgotten SLOs | New endpoints/features get SLO entries |
| Backlog cruft | Resolved entries linked to commits |
| Orphan todos | Closes superseded todos |
| Lost threads | Active threads get progress notes |

The loop:

```
  /god-reconcile  ->  recipe execution  ->  /god-sync
      (before)         (the actual work)       (after)
```

Both bookends run automatically in feature-addition recipes. Both can be
invoked manually for spot-checks.
