---
name: god-observe
description: |
  Wire observability. Spawns the god-observability-engineer agent in a fresh
  context. Gated on Deploy.

  Triggers on: "god observe", "/god-observe", "add monitoring", "SLOs", "alerting"
---

# /god-observe

Spawn the **god-observability-engineer** agent in a fresh context via Task tool.

## Setup

1. Verify `.godpowers/deploy/STATE.md` exists. App is deployed.
2. Spawn god-observability-engineer with PRD (for success metrics) and ARCH paths.
3. The agent writes `.godpowers/observe/STATE.md`.

## Verification

After god-observability-engineer returns:
1. Verify STATE.md exists on disk
2. Verify each SLO has an error budget policy
3. Verify each alert has a runbook
4. Update `.godpowers/PROGRESS.md`: Observe status = done

## On Completion

```
Observability complete: .godpowers/observe/STATE.md

Suggested next: /god-harden (adversarial security review, gates Launch)
```


## Re-invocation contract

What happens if `/god-observe` is run when `.godpowers/observe/STATE.md` already exists:

| Existing state | Behavior |
|---|---|
| File does not exist | Spawn god-observability-engineer; produce file; mark sub-step done |
| File exists, passes lint, state.json says `done` | Pause: ask user (A) re-run anyway with diff preview, (B) treat as imported (no-op), (C) cancel |
| File exists, fails lint or have-nots | Spawn god-observability-engineer in update mode with current file + findings as input. Diff preview before overwrite. |
| File exists, state.json says `pending` | Treat as imported: hash + register, no agent spawn. User can `/god-observe --force` to re-run. |
| `--force` flag passed | Snapshot existing file to `.godpowers/.trash/god-observe-<ts>/`. Spawn agent fresh. |
| `--dry-run` flag passed | Show what would happen; touch nothing |

Snapshots in `.trash/` are recoverable via `/god-restore` for 30 days.
The reflog records every god-observe invocation as `op:god-observe` for `/god-undo`.

### Idempotency guarantees

- Running `/god-observe` twice with no user input between them is a no-op
  (second call detects the artifact and pauses).
- Running `/god-observe --dry-run` is always read-only.
- An interrupted `/god-observe` (agent crashes mid-run) leaves state.json
  with `status: failed` and the artifact path either missing or marked
  for `/god-repair` review. Re-running picks up cleanly.


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
