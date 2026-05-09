---
name: god-roadmap
description: |
  Sequence the work into milestones. Spawns the god-roadmapper agent in a
  fresh context. Gated on Architecture.

  Triggers on: "god roadmap", "/god-roadmap", "sequence the work", "milestone plan"
---

# /god-roadmap

Spawn the **god-roadmapper** agent in a fresh context via Task tool.

## Setup

1. Verify `.godpowers/arch/ARCH.md` exists. If not, tell user to run `/god-arch` first.
2. Spawn god-auditor briefly to verify ARCH passes have-nots.
3. Spawn god-roadmapper with PRD and ARCH paths.
4. The agent writes `.godpowers/roadmap/ROADMAP.md`.

## Verification

After god-roadmapper returns:
1. Verify ROADMAP.md exists on disk
2. Spawn god-auditor to verify have-nots pass
3. Update `.godpowers/PROGRESS.md`: Roadmap status = done

## On Completion

```
Roadmap complete: .godpowers/roadmap/ROADMAP.md

Suggested next: /god-stack (pick the tech) if not already done,
                otherwise /god-repo (scaffold the repo)
```
