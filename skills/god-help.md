---
name: god-help
description: |
  Discoverable contextual help for Godpowers. Lists all skills grouped
  by category, with the current project state and what's suggested next.
  Different from /god (front door): /god proposes a command sequence;
  /god-help lists the catalog.

  Triggers on: "god help", "/god-help", "what can godpowers do",
  "list commands", "show help"
---

# /god-help

List Godpowers commands organized by family first, then by full catalog
category. Show the map without hiding any installed command.

## Output sections

### 1. Where you are
One line summary of project state from `state.json`:
- Mode (A/B/C/E + suite flag), scale, current tier, last command

### 2. Suggested next
The same suggestion `/god-next` would make. One command.

### 3. Command families
Load `<runtimeRoot>/lib/command-families.js` and render family cards before the
full catalog:

- Start: start or import a project.
- Continue: understand state and choose the next move.
- Build: plan, implement, test, and ship product work.
- Verify: check artifacts, code, runtime behavior, and release readiness.
- Operate: deploy, observe, harden, launch, and respond in production.
- Maintain: keep artifacts, docs, dependencies, context, and repo surfaces current.
- Capture: save thoughts, tasks, backlog items, seeds, and learnings.
- Recover: undo, repair, restore, skip, or diagnose broken state.
- Extend: install, inspect, test, remove, or author extension packs.
- Collaborate: coordinate people, workstreams, suites, sprints, and pull requests.
- Configure: tune settings, budgets, cache, profiles, help, and version info.

### 4. Decision ladders
Show the compact ladders when the user asks about capture, work size, or
verification:

- Capture ladder: `/god-note`, `/god-add-todo`, `/god-add-backlog`, `/god-plant-seed`.
- Work size ladder: `/god-fast`, `/god-quick`, `/god-story`, `/god-feature`, `/god-build`, `/god-debug`, `/god-hotfix`.
- Verification ladder: `/god-lint`, `/god-standards`, `/god-review`, `/god-test-runtime`, `/god-audit`, `/god-hygiene`, `/god-preflight`, `/god-dogfood`.

### 5. Status views
Present `/god-status` as the hub view and list the direct shortcuts:
`/god-progress`, `/god-lifecycle`, `/god-locate`, and `/god-next`.

### 6. Full catalog
All installed skills grouped by category. Categories match
`docs/reference.md` order.

### 7. Where to go for more
- Full reference: https://github.com/aihxp/godpowers/blob/main/docs/reference.md
- Concepts: https://github.com/aihxp/godpowers/blob/main/docs/concepts.md
- Roadmap: https://github.com/aihxp/godpowers/blob/main/docs/ROADMAP.md
- Installed have-nots catalog: `<runtime>/godpowers-references/HAVE-NOTS.md`

## Subcommands

### `/god-help`
Full catalog with categories.

### `/god-help <command>`
Description of one specific command (reads the skill's frontmatter description).

### `/god-help search <keyword>`
Filter the catalog by keyword match against descriptions.

### `/god-help <family>`
Show one family card plus its leaf commands. Valid families are start,
continue, build, verify, operate, maintain, capture, recover, extend,
collaborate, and configure.

### `/god-help --category=<name>`
Show only one category (lifecycle, planning, building, shipping, etc.).

## Implementation

Built-in, no spawned agent. Reads:
- `<runtime>/skills/*.md` frontmatter
- `.godpowers/state.json` (for current state line)
- `<runtimeRoot>/lib/recipes.js` (for suggested next)
- `<runtimeRoot>/lib/command-families.js` (for family cards and ladders)

Resolve `<runtimeRoot>` as `<projectRoot>` when `<projectRoot>/lib/recipes.js` exists. Otherwise use the installed bundle at `<tool-config-dir>/godpowers-runtime`, where `<tool-config-dir>` is the directory that contains this installed skill.

## When to use

- First time using Godpowers and need an overview
- Forgot the exact name of a command
- Want to discover commands relevant to the current state

## When NOT to use

- You know exactly what you want -> just run that command
- You want intent-to-command matching -> use `/god` (front door)
- You want a single next-step suggestion -> use `/god-next`
