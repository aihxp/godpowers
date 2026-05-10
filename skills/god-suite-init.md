---
name: god-suite-init
description: |
  Register a multi-repo suite (Mode D). Prompts for siblings,
  byte-identical files, version table, and shared standards; writes
  `.godpowers/suite-config.yaml` to the hub; updates each sibling's
  state.json to point at the hub.

  Triggers on: "god suite init", "/god-suite-init", "register multi-repo",
  "set up suite", "mode d"
---

# /god-suite-init

One-time registration for a multi-repo workspace. Per the locked
answer to plan question Q1: explicit declaration only. Sibling repos
are listed manually; godpowers does NOT auto-walk parent dirs.

## Forms

| Form | Action |
|---|---|
| `/god-suite-init` | Interactive setup; prompts for all fields |
| `/god-suite-init --hub <path>` | Use a specific dir as the hub |

## Process

1. Verify the working dir is intended as the hub (or `--hub` resolves to one).
2. Prompt for:
   - Suite name
   - Sibling repo paths (one per line, relative or absolute)
   - Byte-identical files to track (one per line; e.g., LICENSE, .editorconfig)
   - Version-table entries (optional; can be added later)
   - Shared standards (node-version, linter; optional)
3. Spawn `god-coordinator` agent in `init` mode with collected inputs.
4. god-coordinator writes `.godpowers/suite-config.yaml` and updates
   each sibling's state.json with `suite.hubPath`.
5. Initial `lib/suite-state.refreshFromRepos` runs to populate
   `.godpowers/suite/state.json` and `STATE.md`.
6. Report registration complete; suggest `/god-suite-status` next.

## Output

- `.godpowers/suite-config.yaml` (hub)
- `.godpowers/suite/state.json` (hub; aggregate)
- `.godpowers/suite/STATE.md` (hub; human-readable)
- Updates to each sibling's `state.json` (`suite.hubPath` field)

## Suite-config schema

```yaml
name: my-suite
siblings:
  - repo-a
  - repo-b
  - { name: external-repo, path: ../external-repo }
byte-identical:
  - .editorconfig
  - LICENSE
  - .github/workflows/ci.yml
version-table:
  shared-libs:
    repo-a: 1.2.3
    repo-b: 1.2.3
shared-standards:
  node-version: 20
  linter: biome
```

## What this does NOT do

- Modify any repo's source code
- Run an arc on any repo
- Override existing per-repo state.json beyond adding the
  `suite.hubPath` pointer
