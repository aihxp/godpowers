---
name: god-deploy
description: |
  Set up deploy pipeline. Spawns the god-deploy-engineer agent in a fresh
  context. Gated on Build.

  Triggers on: "god deploy", "/god-deploy", "deploy this", "CI/CD", "ship it"
---

# /god-deploy

Spawn the **god-deploy-engineer** agent in a fresh context via Task tool.

## Setup

1. Verify build is complete (`.godpowers/build/STATE.md` exists with passing state).
2. Verify all tests pass.
3. Spawn god-deploy-engineer with ARCH and stack DECISION paths.
4. The agent writes `.godpowers/deploy/STATE.md`.

## Verification

After god-deploy-engineer returns:
1. Verify STATE.md exists on disk
2. Verify rollback procedure has been tested (not paper-only)
3. Verify the deploy path is one of:
   - real staging or production target tested
   - local staging harness tested with equivalent health, smoke, and rollback
     commands
   - paused on `.godpowers/deploy/WAITING-FOR-EXTERNAL-ACCESS.md` with one
     exact missing access bundle
4. Update `.godpowers/PROGRESS.md`: Deploy status = done only for a tested real
   target or tested local staging harness. If external access is missing, mark
   Deploy = waiting-for-external-access, not done.

## On Completion

```
Deploy pipeline complete: .godpowers/deploy/STATE.md

Suggested next: /god-observe (wire SLOs, alerts, runbooks)
```

Under `/god-mode --yolo`, do not stop with a provider checklist. Create or
update the deploy scripts, smoke command, rollback command, health endpoints,
env manifest, and local staging harness first. If real external access is still
required, pause on the single access bundle in
`.godpowers/deploy/WAITING-FOR-EXTERNAL-ACCESS.md`.

The single access bundle must be incremental. Ask for the smallest next item
needed to run the next command. If no live target URL is known, ask only for
`STAGING_APP_URL=<staging-origin>` and the exact smoke command that will run.
Do not ask for provider keys, API tokens, dashboards, DNS tokens, production
secrets, admin consoles, or test users until a specific scripted check proves
that exact item is required.


## Re-invocation contract

What happens if `/god-deploy` is run when `.godpowers/deploy/STATE.md` already exists:

| Existing state | Behavior |
|---|---|
| File does not exist | Spawn god-deploy-engineer; produce file; mark sub-step done |
| File exists, passes lint, state.json says `done` | Pause: ask user (A) re-run anyway with diff preview, (B) treat as imported (no-op), (C) cancel |
| File exists, fails lint or have-nots | Spawn god-deploy-engineer in update mode with current file + findings as input. Diff preview before overwrite. |
| File exists, state.json says `pending` | Treat as imported: hash + register, no agent spawn. User can `/god-deploy --force` to re-run. |
| `--force` flag passed | Snapshot existing file to `.godpowers/.trash/god-deploy-<ts>/`. Spawn agent fresh. |
| `--dry-run` flag passed | Show what would happen; touch nothing |

Snapshots in `.trash/` are recoverable via `/god-restore` for 30 days.
The reflog records every god-deploy invocation as `op:god-deploy` for `/god-undo`.

### Idempotency guarantees

- Running `/god-deploy` twice with no user input between them is a no-op
  (second call detects the artifact and pauses).
- Running `/god-deploy --dry-run` is always read-only.
- An interrupted `/god-deploy` (agent crashes mid-run) leaves state.json
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
