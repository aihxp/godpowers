---
name: god-stack
description: |
  Pick the technology stack. Spawns the god-stack-selector agent in a fresh
  context. Gated on Architecture.

  Triggers on: "god stack", "/god-stack", "pick the stack", "what stack"
---

# /god-stack

Spawn the **god-stack-selector** agent in a fresh context via Task tool.

## Setup

1. Verify `.godpowers/arch/ARCH.md` exists. If not, tell user to run `/god-arch` first.
2. Spawn god-stack-selector with the ARCH path.
3. The agent writes `.godpowers/stack/DECISION.md`.

## Verification

After god-stack-selector returns:
1. Verify DECISION.md exists on disk
2. Update `.godpowers/PROGRESS.md`: Stack status = done

## On Completion

```
Stack decision complete: .godpowers/stack/DECISION.md

Suggested next: /god-repo (scaffold the repo with the chosen stack)
```
