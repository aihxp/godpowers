---
name: god-plan
description: |
  Planning verb dispatcher. Routes planning intent to PRD, design,
  architecture, roadmap, stack, or reconstruction leaf commands without
  replacing those commands.

  Triggers on: "god plan", "/god-plan", "plan this", "write the prd",
  "choose architecture", "roadmap this", "pick stack"
---

# /god-plan

Route planning intent to the smallest existing planning command.

## Runtime module resolution

Resolve the Godpowers runtime root before inspecting routes:

1. If `<projectRoot>/routing/god-prd.yaml` exists, use the repository checkout runtime at `<projectRoot>`.
2. Otherwise use the installed bundle at `<tool-config-dir>/godpowers-runtime`.
3. Read routing metadata from `<runtimeRoot>/routing/`.

## Dispatch

Use the first explicit argument when present. Otherwise classify the user text.

| Signal | Hand off to |
|---|---|
| `prd`, `requirements`, `spec` | `/god-prd` |
| `design`, `product`, `ux` | `/god-design` |
| `arch`, `architecture`, `system` | `/god-arch` |
| `roadmap`, `milestone`, `sequence` | `/god-roadmap` |
| `stack`, `technology`, `dependency choice` | `/god-stack` |
| `reconstruct`, `brownfield plan`, `existing code` | `/god-reconstruct` |

Default to `/god-prd` when no stronger signal exists.

## Process

1. Select the target leaf command from the table.
2. Read the selected leaf route YAML so prerequisites and next-step metadata stay source-controlled.
3. Show the selected command, the matched signal, and the next command from the selected route.
4. Hand off to the selected leaf command after user confirmation.

## Guardrails

- Do not create planning artifacts directly.
- Do not spawn planning agents from this dispatcher.
- Do not bypass executable gates declared by the selected leaf route.
- Keep the selected leaf command callable as a direct shortcut.
