---
name: god-next
description: |
  Decision engine. For any command intent, checks prerequisites, proposes
  auto-completion of missing prerequisites, runs standards checks at gates,
  and suggests next commands after success. Backed by runtime routing YAML
  configurations.

  Triggers on: "god next", "/god-next", "what's next", "what should I do next",
  "next step", "continue"
---

# /god-next

The unified decision engine. Routes between commands based on disk state,
routing definitions, and user intent.

## Runtime module resolution

Before reading routing data or calling runtime modules, resolve the Godpowers runtime root:

1. If `<projectRoot>/lib/router.js` exists, use the repository checkout runtime at `<projectRoot>`.
2. Otherwise use the installed bundle at `<tool-config-dir>/godpowers-runtime`, where `<tool-config-dir>` is the directory that contains this installed skill, such as `~/.claude`, `~/.codex`, `~/.cursor`, `~/.windsurf`, or `~/.gemini`.
3. Read routing definitions from `<runtimeRoot>/routing/*.yaml` and recipes from `<runtimeRoot>/routing/recipes/*.yaml`.

## Three modes of invocation

### Mode 1: After a command (post-completion routing)
The completing skill calls /god-next to determine what's next.
Reads `<runtimeRoot>/routing/<just-completed>.yaml`, gets `success-path.next-recommended`,
suggests it.

### Mode 2: Before a command (pre-flight)
User wants to run /god-X. /god-next checks prerequisites first.
Reads `<runtimeRoot>/routing/<X>.yaml`, evaluates prerequisites, proposes auto-completion
if any are missing.

### Mode 3: Standalone (state-driven)
User just ran /god-next. Auto-detects current project phase and suggests
the next logical command.

Before suggesting, read `.godpowers/prep/INITIAL-FINDINGS.md` and
`.godpowers/prep/IMPORTED-CONTEXT.md` if present. Use them to explain why the
next step is safe or why a migration-aware step such as `/god-prd`,
`/god-map-codebase`, or `/god-mode` is better. Prep artifacts are context only;
state.json and completed Godpowers artifacts remain authoritative.

If PRD is complete, DESIGN is missing, and initial findings, imported context,
the PRD, or the codebase show UI or product-experience signals, suggest
`/god-design` before `/god-arch`. DESIGN.md is early preparation for visible
workflows, not a replacement for architecture.

## Process for Mode 1 (post-completion)

```
A skill completes (e.g., /god-prd just finished)
   |
   v
Skill calls: /god-next --after=/god-prd
   |
   v
Read <runtimeRoot>/routing/god-prd.yaml
   |
   v
Get success-path.next-recommended (e.g., "/god-arch"), then apply any
conditional-next rule such as UI-detected -> "/god-design"
   |
   v
Display: "PRD complete: .godpowers/prd/PRD.md
          Suggested next: /god-arch (design the architecture)"
```

If standards-check is configured at the gate:
```
   |
   v
Spawn god-standards-check on the produced artifact
   |
   v
If standards FAIL:
   - Display failures with line refs and suggested fixes
   - Suggest /god-redo with feedback OR /god-skip with reason
   - Do NOT auto-progress
   |
If standards PASS:
   - Update state.json: tier.sub-step.status = done
   - Display "Suggested next: /god-arch"
```

## Process for Mode 2 (pre-flight)

```
User types: /god-arch
   |
   v
The /god-arch skill calls: /god-next --before=/god-arch
   |
   v
Read <runtimeRoot>/routing/god-arch.yaml
   |
   v
For each prerequisite in prerequisites.required:
   - Evaluate the check predicate
   - If false: prerequisite is missing
   |
   v
If all prereqs satisfied: proceed with /god-arch
   |
If some prereqs missing AND auto-completable:
   - Display:
     "/god-arch requires PRD to be complete (prereq missing).
      The routing has auto-complete: /god-prd
      Run /god-prd first? (yes/no)"
   - If yes: invoke /god-prd, then return to /god-arch
   - If no: abort or show what user needs to do manually
   |
If prereqs missing and NOT auto-completable:
   - Display what's needed
   - Show how to fix manually
   - Suggest /god-doctor for diagnosis
```

## Process for Mode 3 (standalone)

```
User types: /god-next
   |
   v
Read .godpowers/state.json (or PROGRESS.md as fallback)
   |
   v
Use <runtimeRoot>/lib/router.js suggestNext(projectRoot)  <- structural next
   |
   v
For each tier in order:
   - Find first non-done sub-step
   - That's the suggested next command
   |
   v
If all tiers done:
   - Use <runtimeRoot>/lib/recipes.js suggestForState(projectRoot)  <- scenario-aware
   - Returns recipes matching current lifecycle phase
   |
   v
Display: "Suggested next: /god-arch
          Why: PRD is complete; architecture is the next gate"
```

## Process for Mode 4 (intent-based)

```
User says: "I need to add a new feature mid-development"
   |
   v
/god-next consults <runtimeRoot>/lib/recipes.js matchIntent(text, projectRoot)
   |
   v
Returns ranked recipes matching:
   - Intent keywords ("add new feature", "mid-development")
   - State conditions (lifecycle-phase == in-arc)
   |
   v
Display top match with the recipe's sequence:
   "Best match: add-feature-mid-arc-pause
    Sequence:
      1. /god-pause-work  (Save current /god-mode arc state)
      2. /god-feature     (Run feature workflow)
      3. /god-resume-work (Restore arc)
    
    Run this sequence? Or see other matches?"
```

This is the recipe-driven decision support: agents consult `<runtimeRoot>/routing/recipes/`
when user intent is fuzzy or doesn't map to a single command.

## Routing data

Routing definitions live in `<runtimeRoot>/routing/*.yaml`. Each command has a file:
- `<runtimeRoot>/routing/god-prd.yaml`
- `<runtimeRoot>/routing/god-arch.yaml`
- ...

These define prerequisites, execution, success-path, failure-path, and
endoff for each command.

The `<runtimeRoot>/lib/router.js` JS module provides programmatic queries:
- `getRouting(command)` - load a command's routing
- `checkPrerequisites(command, projectRoot)` - prereq check
- `getNextCommand(command)` - get success-path next
- `getStandards(command)` - get standards checks
- `suggestNext(projectRoot)` - state-driven suggestion

## Decision Tree

```
                    /god-next invoked
                          |
                          v
              ┌────── What flag? ──────┐
              |                          |
              v                          v
          --before=X              --after=X        (no flag)
              |                          |              |
              v                          v              v
        Check X's prereqs       Get X's next      Use suggestNext
              |                          |              |
              v                          v              |
        Pass: proceed           Standards check        |
        Fail+autocomp:            on artifact          |
        offer to run                   |                |
        prereq cmd                Pass: announce next  |
        Fail no autocomp:        Fail: pause           |
        explain                                         |
              |                          |              |
              └──────────────┬───────────┴──────────────┘
                             v
                 Display suggestion + why
```

## Edge cases

### User wants to skip a prereq
`/god-arch --skip-prereqs` (advanced flag)
- Logs the skip with reason in events.jsonl
- Proceeds anyway
- Marks state as `re-invoked` flag if upstream artifacts are stale

### Multiple non-done sub-steps (parallel-safe)
e.g., after /god-arch, both /god-roadmap and /god-stack are eligible.
Display both with: "Run in any order. /god-roadmap is critical-path."

### State drift (artifact missing but state says done)
Detected by lib/state.detectDrift(). Suggest /god-repair.

### Steady state with multiple workflow options
If lifecycle-phase = steady-state-active, route by user intent if provided
(use the User Intent Map below).

## Steady-state User Intent Map

When in steady state, match keywords to workflows:

| Keyword | Suggest |
|---------|---------|
| feature, add, new functionality | /god-feature |
| production down, urgent, p0 | /god-hotfix |
| bug, broken, doesn't work | /god-debug |
| refactor, clean up, rename | /god-refactor |
| POC, prototype, spike, research | /god-spike |
| postmortem, RCA, incident review | /god-postmortem |
| upgrade, migrate, bump major | /god-upgrade |
| docs, documentation, README | /god-docs |
| deps, dependencies, audit | /god-update-deps |
| audit, score, quality check | /god-audit |
| health check, hygiene | /god-hygiene |

## Output Format

```
Godpowers Next

Current state: [where we are]
Suggested next: [/god-X]

Why: [one-line reason]

[If prereqs missing]:
Pre-flight: missing [prereq]
Auto-complete available: /god-Y
Run /god-Y first? (yes/no/manual-info)

[If standards-check on previous tier failed]:
Previous tier had standards failures. Address before proceeding:
  - [failure 1]
  - [failure 2]
Suggested: /god-redo [tier] OR /god-skip [tier] --reason="..."
```
