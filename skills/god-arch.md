---
name: god-arch
description: |
  Design system architecture. Spawns the god-architect specialist agent in a
  fresh context. Gated on PRD.

  Triggers on: "god arch", "/god-arch", "design architecture", "system design"
---

# /god-arch

Spawn the **god-architect** agent in a fresh context via Task tool.

## Setup

1. Verify `.godpowers/prd/PRD.md` exists. If not, tell user to run `/god-prd` first.
2. Spawn god-auditor briefly to verify PRD passes have-nots. If fails, report and stop.
3. Spawn god-architect with the PRD path and full context window
4. The agent writes `.godpowers/arch/ARCH.md` and ADRs to `.godpowers/arch/adr/`

## Verification

After god-architect returns:
1. Verify ARCH.md and ADRs exist on disk
2. Spawn god-auditor to verify have-nots pass
3. Update `.godpowers/PROGRESS.md`: Architecture status = done

## Pause Format

Relay any pauses from god-architect using the standard format (What/Why/Options/Default).

## On Completion

```
Architecture complete: .godpowers/arch/ARCH.md

Suggested next: /god-roadmap (sequence the work) or /god-stack (pick the tech)
Both are gated on ARCH and can run in either order.
```
