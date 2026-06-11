---
name: god-extend
description: |
  Extend verb dispatcher. Routes extension installation, inspection, removal,
  testing, and authoring intent to existing extension leaf commands.

  Triggers on: "god extend", "/god-extend", "install extension",
  "list extensions", "remove extension", "scaffold extension"
---

# /god-extend

Route extension intent to the smallest existing extension command.

## Runtime module resolution

Resolve the Godpowers runtime root before inspecting routes:

1. If `<projectRoot>/routing/god-extension-add.yaml` exists, use the repository checkout runtime at `<projectRoot>`.
2. Otherwise use the installed bundle at `<tool-config-dir>/godpowers-runtime`.
3. Read routing metadata from `<runtimeRoot>/routing/`.

## Dispatch

| Signal | Hand off to |
|---|---|
| `scaffold`, `author`, `create pack` | `/god-extension-scaffold` |
| `add`, `install` | `/god-extension-add` |
| `list`, `installed` | `/god-extension-list` |
| `info`, `inspect`, `details` | `/god-extension-info` |
| `remove`, `uninstall` | `/god-extension-remove` |
| `test`, `verify` | `/god-test-extension` |
| `agent`, `custom agent` | `/god-build-agent` |

Default to `/god-extension-list` when no stronger signal exists.

## Process

1. Select the target leaf command from the table.
2. Read the selected leaf route YAML so prerequisites and next-step metadata stay source-controlled.
3. Show the selected command, the matched signal, and whether the target mutates installed packs.
4. Hand off to the selected leaf command after user confirmation.

## Guardrails

- Do not install, remove, scaffold, or test extension packs directly from this dispatcher.
- Do not bypass package legitimacy checks from extension leaf commands.
- Keep each extension leaf callable as a direct shortcut.
