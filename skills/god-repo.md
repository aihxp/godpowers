---
name: god-repo
description: |
  Scaffold a production-grade repository. Spawns the god-repo-scaffolder agent
  in a fresh context. Gated on Stack.

  Triggers on: "god repo", "/god-repo", "scaffold the repo", "set up the repo"
---

# /god-repo

Spawn the **god-repo-scaffolder** agent in a fresh context via Task tool.

## Setup

1. Verify `.godpowers/stack/DECISION.md` exists. If not, tell user to run `/god-stack` first.
2. Spawn god-repo-scaffolder with the stack DECISION path.
3. The agent scaffolds the repo and writes `.godpowers/repo/AUDIT.md`.

## Verification

After god-repo-scaffolder returns:
1. Verify AUDIT.md exists on disk
2. Verify CI passes on the empty scaffold
3. Update `.godpowers/PROGRESS.md`: Repo status = done

## On Completion

```
Repo scaffolded: .godpowers/repo/AUDIT.md

Suggested next: /god-build (start building the first milestone)
```


## Locking

The orchestrator acquires a state-lock before this skill mutates anything,
scoped to the smallest affected unit (e.g. `tier-1.prd` for `/god-prd`,
`linkage` for `/god-scan`). Lock TTL is 5 minutes; reentrant for the
same holder; force-reclaimable if stale via `/god-repair`.

Read-only inspection commands (`/god-status`, `/god-doctor`,
`/god-locate`) do NOT block on the lock. Concurrent writers on
non-overlapping scopes are allowed; on overlapping scopes, the second
writer pauses or routes elsewhere via `/god-next`.

See [ARCHITECTURE.md "Concurrency contract"](../ARCHITECTURE.md) for
the full contract.
