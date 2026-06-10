---
name: god-ship
description: |
  Ship verb dispatcher. Routes release, deploy, observability, and launch
  closure intent to existing deploy, observe, and launch leaf commands.

  Triggers on: "god ship", "/god-ship", "ship this", "deploy this",
  "launch this", "wire observability"
---

# /god-ship

Route shipping intent to the smallest existing shipping command.

## Runtime module resolution

Resolve the Godpowers runtime root before inspecting routes:

1. If `<projectRoot>/routing/god-deploy.yaml` exists, use the repository checkout runtime at `<projectRoot>`.
2. Otherwise use the installed bundle at `<tool-config-dir>/godpowers-runtime`.
3. Read routing metadata from `<runtimeRoot>/routing/`.

## Dispatch

| Signal | Hand off to |
|---|---|
| `deploy`, `pipeline`, `environment` | `/god-deploy` |
| `observe`, `observability`, `slo`, `alert`, `runbook` | `/god-observe` |
| `launch`, `release copy`, `go live` | `/god-launch` |

Default to `/god-deploy` when no stronger signal exists.

## Process

1. Select the target leaf command from the table.
2. Read the selected leaf route YAML so prerequisites and next-step metadata stay source-controlled.
3. Show the selected command, the matched signal, and the release gate implied by that leaf.
4. Hand off to the selected leaf command after user confirmation.

## Guardrails

- Do not publish, tag, deploy, or create release notes directly from this dispatcher.
- Do not bypass safe-sync, harden, or launch prerequisites from the selected route.
- Keep deploy, observe, and launch callable as direct shortcuts.
