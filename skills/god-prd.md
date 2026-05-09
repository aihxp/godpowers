---
name: god-prd
description: |
  Write a Product Requirements Document with mechanical quality enforcement.
  Spawns the god-pm specialist agent in a fresh context.

  Triggers on: "god prd", "/god-prd", "write the prd", "product requirements"
---

# /god-prd

Spawn the **god-pm** agent in a fresh context via Task tool.

## Setup

1. If `.godpowers/PROGRESS.md` does not exist: tell the user to run `/god-init` first
2. Otherwise: spawn god-pm with the user's project description from PROGRESS.md
3. The agent writes `.godpowers/prd/PRD.md`
4. The agent runs have-nots checks before declaring done
5. If god-pm pauses for a human question: relay to user using pause format

## Verification

After god-pm returns:
1. Verify `.godpowers/prd/PRD.md` exists on disk
2. Spawn god-auditor briefly to verify have-nots pass
3. Update `.godpowers/PROGRESS.md`: PRD status = done

## Pause Format

```
PAUSE: [question]
Why: [why only you can answer]
Options:
  A: ... -- [tradeoff]
  B: ... -- [tradeoff]
Default: [if you say "go", I'll pick X because Y]
```
