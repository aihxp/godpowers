---
name: god-next
description: |
  Decision engine. For any command intent, checks prerequisites, runs safe
  read-only continuation when possible, and suggests the next concrete command
  after success. Backed by runtime routing YAML configurations.

  Triggers on: "god next", "/god-next", "what's next", "what should I do next",
  "next step", "continue"
---

# /god-next

The unified decision engine. Route between commands based on disk state,
routing definitions, recipes, command families, and user intent. Explain what
you are about to do in one plain sentence, then run the safe next step when the
step is read-only or an explicit local check.

## Runtime module resolution

1. If `<projectRoot>/lib/router.js` exists, use the repository checkout runtime at `<projectRoot>`.
2. Otherwise use the installed bundle at `<tool-config-dir>/godpowers-runtime`.
3. Read routing definitions from `<runtimeRoot>/routing/*.yaml` and recipes from `<runtimeRoot>/routing/recipes/*.yaml`.
4. Load `<runtimeRoot>/lib/command-families.js` before resolving broad intent.
5. Load `<runtimeRoot>/lib/dashboard.js` and render only the compact action brief unless the user asks for `--full`.
6. Prefer the MCP `next` tool when it is available, and fall back to the CLI or runtime module when it is not.
7. If no dashboard module is available, use a manual disk scan quietly and suggest `/god-doctor` only when the fallback changes the recommendation.

## Required references

Read these references before producing a route recommendation:

- `<runtimeRoot>/references/orchestration/GOD-NEXT-RUNBOOK.md` for invocation modes, route detail, and edge cases.
- `<runtimeRoot>/references/shared/DASHBOARD-CONTRACT.md` for the shared status and `Next commands:` shape.

## Invocation modes

- Post-completion: after a command finishes, read its routing file and announce the next gate.
- Pre-flight: before a target command runs, evaluate prerequisites and offer auto-completion when available.
- Standalone: when the user asks what is next, derive the recommendation from disk state and run the safe read-only next step when it has no destructive effect.
- Intent-based: when the user uses fuzzy text, match recipes and command families before raw route order.

## Decision rules

- Disk state beats chat memory.
- state.json and completed artifacts beat prep artifacts.
- INITIAL-FINDINGS.md and IMPORTED-CONTEXT.md explain context but do not override completed Godpowers artifacts.
- If PRD is complete, DESIGN is missing, and UI or product-experience signals exist, suggest `/god-design` before `/god-arch`.
- Safe sync blockers route to `/god-reconcile Release Truth And Safe Sync` before release-facing work.
- Unresolved Critical harden findings block `/god-launch` in default mode and under `--yolo`.
- Missing prerequisites should name the prerequisite, the route that can create it, and the smallest user decision needed.
- Standards failures should suggest `/god-redo` with feedback or `/god-skip` with a reason, then stop.

## Output contract

Render this sequence:

1. One plain sentence describing the selected next step.
2. Suggested next command and one-line reason.
3. Optional blocker detail only when it changes the recommendation.
4. `Next commands:` with the selected command first.

Keep the route preview to three lines unless the user asks for the full plan or
`--full`. Do not print the full dashboard by default.
