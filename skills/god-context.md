---
name: god-context
description: |
  Manage native Pillars project context plus the Godpowers fenced section in
  project-level AI instruction files (AGENTS.md, CLAUDE.md, GEMINI.md,
  .cursor/rules/, .windsurfrules, .github/copilot-instructions.md,
  .clinerules, .roo/, .continue/).

  Triggers on: "god context", "/god-context", "tell ai tools", "ai instructions",
  "context off", "context status", "agents.md", "claude.md", "gemini.md"
---

# /god-context

Tell your AI coding tools that this is a Godpowers project. Godpowers projects
use Pillars as the native project context layer: root `AGENTS.md` plus
`agents/*.md` pillar files. This skill keeps that layer present and writes a
Godpowers fenced section to `AGENTS.md` plus 1-line pointer fences to any
detected tool's instruction file (CLAUDE.md, GEMINI.md, etc.). You can turn
the Godpowers fences off, check status, or refresh on demand.

## Subcommands

| Form | What it does |
|---|---|
| `/god-context` (no args) | Same as `status`. |
| `/god-context on` | Ensure Pillars exists, then write AGENTS.md and pointers for any detected AI tools. |
| `/god-context off` | Remove the Godpowers fence from every target file. Leave Pillars intact. |
| `/god-context status` | Show Pillars health, which targets have a fence, and which tools were detected. |
| `/god-context refresh` | Same as `on`. Re-derives content from current state. |

## Process

1. Verify `.godpowers/` exists. If not, suggest `/god-init` first.
2. Read `.godpowers/state.json`.
3. Call `lib/pillars.detect(projectRoot)`.
4. If Pillars is absent or partial, call `lib/pillars.init(projectRoot)`.
5. Spawn `god-context-writer` agent with the requested mode.
6. Report results.

## What gets written

**Always (native project context):**

- `AGENTS.md` - Pillars loading protocol plus the Godpowers fenced section
- `agents/context.md` - always-loaded project identity and product invariants
- `agents/repo.md` - always-loaded repository layout and naming conventions
- Core pillar stubs for `stack`, `arch`, `data`, `api`, `ui`, `auth`,
  `quality`, `deploy`, and `observe`

**Godpowers managed fence:**

- `AGENTS.md` - full Godpowers section (under 30 lines), inside the
  `godpowers` fence

**Only if detected (pointer):**

| Tool detected via | Pointer target |
|---|---|
| `.claude/` directory | `CLAUDE.md` |
| `.gemini/` directory or existing `GEMINI.md` | `GEMINI.md` |
| `.cursor/` directory | `.cursor/rules/godpowers.mdc` |
| `.cursorrules` file | `.cursorrules` |
| `.windsurf/` directory | `.windsurf/rules/godpowers.md` |
| `.windsurfrules` file | `.windsurfrules` |
| `.github/copilot-instructions.md` | same |
| `.clinerules` file | same |
| `.roo/` directory | `.roo/rules/godpowers.md` |
| `.continue/` directory | `.continue/rules/godpowers.md` |

If none of these are detected, only `AGENTS.md` is written (which is the
universal standard).

## Fence rules

The Godpowers section is wrapped in:

```
<!-- godpowers:begin -->
...
<!-- godpowers:end -->
```

Anything outside the fence is yours and is never touched. If you have your
own AGENTS.md content, keep it. The fence inserts itself either at the end
of an existing file or in a new one.

## Examples

### First-time setup

```
$ /god-context on

Detecting AI tools...
  + Claude Code (.claude/)
  + Cursor (.cursor/)

Writing context files:
  + AGENTS.md           (created, canonical)
  + CLAUDE.md           (created, pointer)
  + .cursor/rules/godpowers.mdc   (created, pointer)

Done. AI tools opening this project will now see Godpowers context.
```

### Status

```
$ /god-context status

AGENTS.md          fence present
CLAUDE.md          fence present
GEMINI.md          not detected (.gemini/ missing)
.cursor/rules/...  fence present
.windsurfrules     not detected

Run /god-context refresh to re-derive content from current state.
```

### Off

```
$ /god-context off

Removing context fences:
  - AGENTS.md     (kept, user content remained)
  - CLAUDE.md     (deleted, was Godpowers-only)

Done. AI tools will no longer see Godpowers context on this project.
```

## Auto-refresh

When `/god-sync` runs (after a project run, or any sync), `god-updater` calls this skill
with `refresh` to keep `AGENTS.md` content aligned with the latest project
state (mode, scale, completed tiers, active artifacts).

You can disable the Godpowers fences by running `/god-context off`. Pillars
remains because it is the native context contract for Godpowers projects.

## Privacy / portability

The fenced content contains:
- Project name (from state.json)
- Mode (greenfield/brownfield/audit) and scale
- A short list of completed-tier artifact paths
- Quarterback rule reminder
- Top 4 useful slash commands

It does NOT contain:
- Secrets, credentials, API keys
- PRD body, ARCH body, or any artifact full text
- User PII

Heavy content stays in `.godpowers/`. The fence just points to it.

## Output

This skill produces no new artifacts under `.godpowers/`. It modifies
project-root files (AGENTS.md and tool-specific pointers) only.
