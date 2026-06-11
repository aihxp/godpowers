---
name: god-demo
description: |
  Run a safe Godpowers sandbox proof using the shipped quick-proof fixture.
  Shows disk-derived state, missing artifacts, host guarantees, and the next
  command without modifying the user's project.

  Triggers on: "god demo", "/god-demo", "show me a demo", "sandbox",
  "try godpowers safely"
---

# /god-demo

Show a safe sandbox proof before the user touches their project. This command
uses the shipped quick-proof fixture and does not write to the user's project.

## Process

1. Resolve `<runtimeRoot>/lib/quick-proof.js`.
2. Call `quickProof.compute(projectRoot)`.
3. Render `quickProof.render(result, { brief: true })` by default.
4. If the user asks for full detail, render without `brief`.
5. End with `Next commands:`.

## Output Shape

```text
The sandbox proof read a shipped fixture from disk and computed the next command without changing this repo.

Changed:
- No project files were modified.

Validation:
- quick-proof fixture: rendered disk state, missing PRD, host guarantees, and next command.

Next commands:
- /god-first-run: Continue the guided first-run path.
- /god-init: Initialize Godpowers in this project.
- /god-status --full: Inspect full status once a project exists.
```

## Terminal Equivalent

```bash
npx godpowers demo --project=.
```

## Rules

- Never write to the current project.
- Prefer compact proof output.
- Keep fixture state separate from the user's project state.
- Mention host guarantees separately from fixture progress.
