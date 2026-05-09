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
