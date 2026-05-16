---
name: god-version
description: |
  Print installed Godpowers version and a one-line capability summary.
  Useful for bug reports, troubleshooting, and verifying upgrades.

  Triggers on: "god version", "/god-version", "what version of godpowers"
---

# /god-version

Print version and a short capability summary.

## Output

```
Godpowers v1.6.4
Install: /Users/.../.claude/  (matches package.json)
Surface: 106 skills, 39 agents, 13 workflows, 36 recipes
Schema: intent.v1, state.v1, events.v1, workflow.v1, routing.v1, recipe.v1
External integrations available: impeccable, agent-browser (others lazy)
```

## Subcommands

### `/god-version --json`
Machine-readable output.

### `/god-version --check-updates`
Hit npm to see if a newer version is available (network-aware; fails
soft if offline).

## Implementation

Built-in, no spawned agent. Reads:
- `<runtime>/GODPOWERS_VERSION`
- File counts in `<runtime>/skills/`, `<runtime>/agents/`, `<runtime>/godpowers-runtime/workflows/`, and `<runtime>/godpowers-runtime/routing/recipes/`
