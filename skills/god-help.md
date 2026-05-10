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

List Godpowers commands organized by category. Show the catalog.

## Output sections

### 1. Where you are
One line summary of project state from `state.json`:
- Mode (A/B/C/E + suite flag), scale, current tier, last command

### 2. Suggested next
The same suggestion `/god-next` would make. One command.

### 3. Catalog
All installed skills grouped by category. Categories match
`docs/reference.md` order.

### 4. Where to go for more
- Full reference: `<runtime>/godpowers-references/reference.md`
- Concepts: `<runtime>/godpowers-references/concepts.md`
- Roadmap: `<runtime>/godpowers-references/ROADMAP.md`

## Subcommands

### `/god-help`
Full catalog with categories.

### `/god-help <command>`
Description of one specific command (reads the skill's frontmatter description).

### `/god-help search <keyword>`
Filter the catalog by keyword match against descriptions.

### `/god-help --category=<name>`
Show only one category (lifecycle, planning, building, shipping, etc.).

## Implementation

Built-in, no spawned agent. Reads:
- `<runtime>/skills/*.md` frontmatter
- `.godpowers/state.json` (for current state line)
- `lib/recipes.js` (for suggested next)

## When to use

- First time using Godpowers and need an overview
- Forgot the exact name of a command
- Want to discover commands relevant to the current state

## When NOT to use

- You know exactly what you want -> just run that command
- You want intent-to-command matching -> use `/god` (front door)
- You want a single next-step suggestion -> use `/god-next`
