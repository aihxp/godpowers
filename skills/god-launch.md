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
