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
3. Update `.godpowers/PROGRESS.md`: Deploy status = done

## On Completion

```
Deploy pipeline complete: .godpowers/deploy/STATE.md

Suggested next: /god-observe (wire SLOs, alerts, runbooks)
```
