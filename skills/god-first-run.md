---
name: god-first-run
description: |
  Guide a first-time user through the first 10 minutes of Godpowers with one
  recommended command and a few concrete alternatives. Never list the full
  command catalog by default.

  Triggers on: "god first run", "/god-first-run", "first time",
  "getting started", "start using godpowers"
---

# /god-first-run

Guide the user through the first 10 minutes. Keep the response short,
decisive, and state-aware. Do not list the full catalog unless the user asks
for `/god-help all`.

## Process

1. Check whether `.godpowers/state.json` exists.
2. If no project state exists, recommend `/god-demo` first when the user wants
   proof, otherwise recommend `/god-init`.
3. If project state exists, recommend `/god-next`.
4. Mention at most three alternatives.
5. End with `Next commands:`.

## Output Shape

For a fresh directory:

```text
You have not initialized Godpowers here yet, so the first useful move is a safe proof or project init.

Next commands:
- /god-demo: Try the shipped sandbox without touching this repo.
- /god-init: Initialize Godpowers in this project now.
- /god-surface --profile=core --dry-run: Preview the smallest installed command surface.
- /god-help all: Show the complete catalog only if you want it.
```

For an initialized project:

```text
Godpowers state already exists here, so continue from disk instead of starting over.

Next commands:
- /god-next: Continue with the safest state-derived next step.
- /god-status --full: Inspect the complete dashboard and proactive checks.
- /god-help continue: See continue commands only.
```

## Rules

- Do not explain routing internals.
- Do not show more than four commands.
- Do not show every installed command.
- Prefer `/god-demo` when the user asks for proof or is unsure.
- Prefer `/god-init` when the user says they are ready to use the current repo.
- Prefer `/god-next` when `.godpowers/state.json` exists.

## Implementation

Built-in, no spawned agent. Reads `.godpowers/state.json` and may call
`<runtimeRoot>/lib/dashboard.js` for the next route when state exists.
