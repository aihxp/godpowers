---
name: god-launch
description: |
  Launch the product. Spawns the god-launch-strategist agent in a fresh
  context. Gated on Harden (no unresolved Critical findings).

  Triggers on: "god launch", "/god-launch", "go live", "Product Hunt", "landing page"
---

# /god-launch

Spawn the **god-launch-strategist** agent in a fresh context via Task tool.

## Setup

1. Verify `.godpowers/harden/FINDINGS.md` exists with NO unresolved Critical findings.
2. If Critical findings exist: REFUSE to proceed. Tell user to resolve or
   explicitly accept the risk first.
3. Spawn god-launch-strategist with PRD path and harden FINDINGS.md path.
4. The agent writes `.godpowers/launch/STATE.md` plus landing copy artifacts.

## Verification

After god-launch-strategist returns:
1. Verify STATE.md exists on disk
2. Verify landing copy passes substitution test
3. Verify OG cards rendered (not just meta tags)
4. Update `.godpowers/PROGRESS.md`: Launch status = done

## Pause Conditions

Relay any pauses from god-launch-strategist. Brand voice and final headline
approval require human input.

## On Completion

```
Launch complete: .godpowers/launch/STATE.md

All Godpowers tiers done. Project is live.

Suggested next: /god-audit (score all artifacts retrospectively)
Or: /god-status (see the final state)
```


## Re-invocation contract

What happens if `/god-launch` is run when `.godpowers/launch/STATE.md` already exists:

| Existing state | Behavior |
|---|---|
| File does not exist | Spawn god-launch-strategist; produce file; mark sub-step done |
| File exists, passes lint, state.json says `done` | Pause: ask user (A) re-run anyway with diff preview, (B) treat as imported (no-op), (C) cancel |
| File exists, fails lint or have-nots | Spawn god-launch-strategist in update mode with current file + findings as input. Diff preview before overwrite. |
| File exists, state.json says `pending` | Treat as imported: hash + register, no agent spawn. User can `/god-launch --force` to re-run. |
| `--force` flag passed | Snapshot existing file to `.godpowers/.trash/god-launch-<ts>/`. Spawn agent fresh. |
| `--dry-run` flag passed | Show what would happen; touch nothing |

Snapshots in `.trash/` are recoverable via `/god-restore` for 30 days.
The reflog records every god-launch invocation as `op:god-launch` for `/god-undo`.

### Idempotency guarantees

- Running `/god-launch` twice with no user input between them is a no-op
  (second call detects the artifact and pauses).
- Running `/god-launch --dry-run` is always read-only.
- An interrupted `/god-launch` (agent crashes mid-run) leaves state.json
  with `status: failed` and the artifact path either missing or marked
  for `/god-repair` review. Re-running picks up cleanly.
