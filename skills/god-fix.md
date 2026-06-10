---
name: god-fix
description: |
  Fix verb dispatcher. Routes bug, regression, and production outage intent
  to the existing debug or hotfix leaf commands.

  Triggers on: "god fix", "/god-fix", "fix this bug", "debug this",
  "production is broken", "hotfix"
---

# /god-fix

Route fix intent to the smallest existing repair command.

## Runtime module resolution

Resolve the Godpowers runtime root before inspecting routes:

1. If `<projectRoot>/routing/god-debug.yaml` exists, use the repository checkout runtime at `<projectRoot>`.
2. Otherwise use the installed bundle at `<tool-config-dir>/godpowers-runtime`.
3. Read routing metadata from `<runtimeRoot>/routing/`.

## Dispatch

| Signal | Hand off to |
|---|---|
| `hotfix`, `production`, `outage`, `urgent`, `down` | `/god-hotfix` |
| `debug`, `bug`, `failing`, `error`, `regression` | `/god-debug` |

Default to `/god-debug` when urgency is unclear.

## Process

1. Select the target leaf command from the table.
2. Read the selected leaf route YAML so prerequisites and next-step metadata stay source-controlled.
3. Show the selected command, the matched signal, and whether production urgency was detected.
4. Hand off to the selected leaf command after user confirmation.

## Guardrails

- Do not edit code directly from this dispatcher.
- Do not skip regression-test expectations from `/god-debug` or `/god-hotfix`.
- Keep both leaf commands callable as direct shortcuts.
