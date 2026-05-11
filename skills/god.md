---
name: god
description: |
  Front door. Take free-text intent from the user, match it to a recipe via
  the Godpowers runtime recipes module, and propose the matching command sequence. If no
  text given, fall back to state-driven suggestion (same as /god-next Mode 3).

  Triggers on: "/god", "god", "/god help", "I want to ...", "how do I ..."
  (when not matched by a more specific command)
---

# /god (front door)

The natural-language entry point. Users describe what they want; this skill
matches the intent to a recipe and suggests the right command sequence. No
agent is spawned here. This is a thin router on top of the Godpowers runtime
recipes module.

## Runtime module resolution

Before calling runtime modules, resolve the Godpowers runtime root:

1. If `<projectRoot>/lib/recipes.js` exists, use the repository checkout runtime at `<projectRoot>`.
2. Otherwise use the installed bundle at `<tool-config-dir>/godpowers-runtime`, where `<tool-config-dir>` is the directory that contains this installed skill, such as `~/.claude`, `~/.codex`, `~/.cursor`, `~/.windsurf`, or `~/.gemini`.
3. Load recipes from `<runtimeRoot>/lib/recipes.js`, routing from `<runtimeRoot>/lib/router.js`, and recipe YAML from `<runtimeRoot>/routing/recipes/`.

## Why this exists

Slash commands are precise but require the user to know the command name.
Recipes are scenario-shaped ("I'm coming back after a week", "production is
broken", "add a feature mid-arc") and match free-text intent. `/god` is the
front door that turns intent into the right slash command.

This skill complements `/god-next` rather than replacing it:

| Skill | Best for |
|-------|----------|
| `/god <free text>` | "I don't know which command, but here's what I want" |
| `/god-next` | "I just finished X, what's next?" or pre-flight checks |
| `/god-status` | "Where are we? what's done?" |
| `/god-init` | "Start a project here" |
| `/god-mode` | "Run the whole arc autonomously" |

## Process

### Step 1: parse the user's intent

Treat everything after `/god` as free text. If empty, treat as state-driven.

```
/god add a feature without breaking the current arc
   text = "add a feature without breaking the current arc"

/god
   text = "" -> state-driven mode
```

### Step 2: dispatch by mode

```
text empty?
  yes -> state-driven: call <runtimeRoot>/lib/recipes.js suggestForState(projectRoot)
         display top 3 recipes ranked by current lifecycle phase
         also call <runtimeRoot>/lib/router.js suggestNext(projectRoot) for structural next

  no  -> intent-driven: call <runtimeRoot>/lib/recipes.js matchIntent(text, projectRoot)
         take top 1-3 matches by score
         if highest score >= 10 (exact phrase match): propose directly
         if highest score 5-9 (all-words match): propose with confirmation
         if no matches: suggest /god-next (state-driven fallback)
```

### Step 3: render the suggestion

For a single high-confidence match (score >= 10):

```
Best match: <recipe.metadata.name>
What this does: <recipe.metadata.description>

Sequence:
  1. <command>   <why>
  2. <command>   <why>
  ...

Run this sequence? (yes / show others / cancel)
```

For multiple matches (top 3):

```
Top matches for "<user text>":

  1. <recipe-name>   (<score>)   <description>
  2. <recipe-name>   (<score>)   <description>
  3. <recipe-name>   (<score>)   <description>

Pick one (1/2/3) or describe more specifically.
```

For state-driven (no text):

```
Where you are: <lifecycle-phase>

Structural next: <command>   <why>

Recipes that fit your current state:
  - <recipe-name>   <description>
  - <recipe-name>   <description>

Run structural next? (yes / pick recipe / cancel)
```

### Step 4: execute or hand off

If user confirms a recipe:
  - Walk the recipe's `default-sequence.steps`
  - For each step, suggest the slash command and let the user invoke it
    (or invoke it directly if it has no destructive side effects)

If user picks the structural next:
  - Hand off to `/god-next --before=<command>` so prereqs are checked first

## Interaction model

This skill is a router, not an orchestrator. It:
- Reads recipes (via `<runtimeRoot>/lib/recipes.js`)
- Reads state (via `<runtimeRoot>/lib/state.js`)
- Proposes commands

It does NOT:
- Spawn agents directly
- Modify `state.json`, `PROGRESS.md`, or `events.jsonl`
- Run multi-tier work (that's `god-orchestrator`'s job, accessed via `/god-mode`)

The user always sees what command will run. Confirmation is required before
any destructive sequence executes.

## Examples

### Example 1: high-confidence intent match

```
User: /god production is broken

Match: production-broken (score: 30)
What this does: P0 incident response with rollback-first triage

Sequence:
  1. /god-hotfix     Spawn god-debugger for fast triage
  2. /god-deploy     Push the fix once green
  3. /god-postmortem Schedule the incident review

Run this sequence? (yes / show others / cancel)
```

### Example 2: ambiguous intent (multiple matches)

```
User: /god add a new feature

Top matches for "add a new feature":

  1. add-feature-mid-arc-pause       (15)   Pause /god-mode arc, run feature, resume
  2. add-feature-small               (10)   Lightweight feature, no arc context
  3. add-feature-next-milestone      (10)   Defer to next milestone

Pick one (1/2/3) or describe more specifically.
```

### Example 3: state-driven (no text)

```
User: /god

Where you are: tier-1 in progress (PRD done, ARCH pending)

Structural next: /god-arch
Why: PRD is complete; architecture is the next gate

Recipes that fit your current state:
  - whats-next                Show the next logical step with reason
  - rerun-tier                Redo a previous tier with new inputs

Run /god-arch? (yes / pick recipe / cancel)
```

### Example 4: no match

```
User: /god make me a sandwich

No recipe matched. Falling back to state-driven suggestion.

Where you are: tier-3 launched
Structural next: (none, arc complete)

Suggested: /god-next   show all valid next-step options
       or: /god-status   re-derive state from disk
```

## Why a skill, not an agent

The matching and dispatch logic is mechanical (lookups against
`<runtimeRoot>/routing/recipes/*.yaml`) and has no need for fresh-context isolation. Running
it as a skill keeps it fast, lets the user see the proposed commands, and
avoids stacking another orchestrator layer above `god-orchestrator`. See
`docs/concepts.md` (the Quarterback section) for why we don't add a second
orchestrator.

## Output

No new artifacts. This skill only proposes commands and (with confirmation)
hands off to the right slash command. State is updated by the downstream
command, not by `/god`.
