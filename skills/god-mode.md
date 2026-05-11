---
name: god-mode
description: |
  Full autonomous arc orchestrator. Spawns the god-orchestrator agent in a
  fresh context which runs the entire workflow: idea to hardened production.
  Pauses only for legitimate human-only decisions.

  Triggers on: "god mode", "/god-mode", "autonomous build", "one-shot",
  "full arc", "idea to production", "build everything"
---

# /god-mode

You are receiving a /god-mode invocation. Your job is to spawn the
**god-orchestrator** agent in a fresh context to run the autonomous arc.

## Process

1. Resolve whether this is a new arc or a resume:
   - If `.godpowers/state.json`, `.godpowers/PROGRESS.md`, or
     `.godpowers/CHECKPOINT.md` exists, this is a resume. Do not ask the user
     to describe the project again. Rehydrate intent from disk and continue.
   - If no durable Godpowers state exists and no project description was
     supplied in the invocation, greet briefly: "God Mode engaged. Describe
     what you want to build."
   - If no durable state exists and the invocation includes a description, use
     that description immediately.

2. **Auto-detect project type in background** (no jargon to user):
   - Scan working directory for code presence (package.json, src/, etc.)
   - Look for org-context.yaml (current dir + parents)
   - Decide: greenfield / brownfield / bluefield (internally A/B/C/E)
   - Announce in plain English what was detected (see god-orchestrator
     "How to announce" section)

3. Load durable resume context before asking anything:
   - `.godpowers/CHECKPOINT.md` first, when present
   - `.godpowers/state.json`
   - `.godpowers/PROGRESS.md`
   - `.godpowers/intent.yaml`, when present
   - `.godpowers/prep/INITIAL-FINDINGS.md`, when present
   - `.godpowers/prep/IMPORTED-CONTEXT.md`, when present
   - Existing tier artifacts on disk

   If these files contain enough information to identify the project and next
   unfinished or red step, continue automatically. If the only missing data is
   a nice-to-have description, use a `[HYPOTHESIS]` from existing artifacts and
   keep moving.

   Ask for a description only when there is no durable intent, no completed
   artifact, and no resumable state.

4. Parse flags from the invocation:
   - `--yolo` (skip pauses, pick defaults)
   - `--conservative` (more checkpoints)
   - `--from=<tier>` (resume from specific tier)
   - `--audit` (score only, build nothing)
   - `--dry-run` (plan only, no agent dispatch)
   - `--workflow=<name>` (v0.14 workflow runtime; load
     `workflows/<name>.yaml`, run via `lib/workflow-runner`)
   - `--plan` (v0.14; emit plan to `.godpowers/runs/<id>/plan.yaml`
     and stop. Same effect as `--dry-run`. Use with `--workflow` for
     a specific arc's plan.)
   - `--brownfield` (force brownfield path even if detection says greenfield)
   - `--bluefield` (force bluefield path)
   - `--greenfield` (force greenfield, skip archaeology even if code exists)

5. Spawn the **god-orchestrator** agent via Task tool with:
   - The user's project description, or durable intent recovered from disk
   - The detected mode (A/B/C/E)
   - The active flags
   - Instruction that existing `.godpowers` state means resume, not prompt
   - Instruction to read `.godpowers/PROGRESS.md` from disk if it exists
   - Instruction to read `.godpowers/prep/INITIAL-FINDINGS.md` and
     `.godpowers/prep/IMPORTED-CONTEXT.md` if present before choosing the
     first planning or build step
   - Instruction to run `/god-design` after `/god-prd` and before `/god-arch`
     when initial findings, imported planning context, the PRD, or the
     codebase show UI or product-experience signals
   - Instruction that a red test, typecheck, lint, build, or check command is
     not a completed arc. It must enter the autonomous repair loop and continue
     the same `/god-mode` run until green, except for Critical security or a
     genuine human-only decision.
   - Instruction that deploy, observe, harden, and launch must follow the
     Shipping Closure Protocol: verify a real environment when available,
     otherwise create local/CI-verifiable deploy automation and pause only for
     one exact external access bundle.
   - Instruction that keys, API tokens, dashboards, admin consoles, and
     provider-specific access are last-mile inputs. The first external pause
     should ask only for the smallest next item needed by a concrete command,
     usually `STAGING_APP_URL=<staging-origin>`. Ask for additional provider
     access only after a named check proves it is needed.
   - Instruction that staging, preview, and production URLs must come from
     direct evidence. Never infer or invent a domain from project name, package
     name, repo name, README title, or brand name. If no deployed origin is
     evidenced, pause for `STAGING_APP_URL=<deployed staging origin>`.

6. Keep the spawn payload private. Do not echo or summarize raw Task input,
   "Hard instructions", hidden orchestration rules, agent prompts, file
   loadout lists, or internal routing payloads into the user-visible transcript.
   The visible transcript may say only what phase is running, what durable state
   was detected, what commands are running, what changed, and the final
   `Arc complete` or `PAUSE: external access required` block.

7. Orchestrator runs the appropriate workflow:
   - Greenfield -> full-arc
   - Brownfield -> brownfield-arc (archaeology -> reconstruct -> debt-assess -> greenfield simulation audit -> proceed)
   - Bluefield -> bluefield-arc (org-context -> greenfield simulation audit -> arc with constraints)

8. Relay only the orchestrator's user-facing output to the user. If the
   platform displays raw spawn details automatically, immediately follow with a
   clean public summary and never repeat the leaked payload.

9. When the orchestrator pauses, present the question to the user using the
   pause format (What / Why / Options / Default).

10. When the user answers, re-spawn god-orchestrator with the answer.

## User-Visible Transcript Contract

The God Mode transcript is an operator console, not a prompt debugger.

Show:
- detected resume or project mode in plain language
- short progress updates for phases, commands, validations, and file edits
- concise validation summaries instead of full command noise when possible
- final changed paths, validation results, and completion or pause status

Hide:
- raw Task input
- "Hard instructions" sections
- spawned-agent prompt text
- system, developer, or AGENTS.md rule recitations
- complete file loadout lists
- internal routing metadata unless it directly affects a user decision

If an internal instruction must influence a pause, translate it into the
smallest user-facing question. For example, ask for
`STAGING_APP_URL=<deployed staging origin>` instead of exposing the full
Shipping Closure Protocol.

## Pause Format (relay from orchestrator)

```
PAUSE: [one-sentence question]

Why only you can answer: [one sentence]

| Option | Tradeoff |
|--------|----------|
| A: ... | ... |
| B: ... | ... |

Default: If you say "go", I'll pick [X] because [Y].
```

## Flags

### --yolo
Pass through to orchestrator. Orchestrator picks defaults at every pause point
and logs decisions to `.godpowers/YOLO-DECISIONS.md`.

### --conservative
Pass through. Orchestrator pauses at every tier boundary.

### --from=<tier>
Pass through. Orchestrator re-derives state from disk and starts from named tier.

### --audit
Pass through. Orchestrator skips building, runs god-auditor on existing artifacts.

### --dry-run
Pass through. Orchestrator plans but writes nothing.

### --with-hygiene
After Launch, run a post-launch hygiene pass: god-auditor + god-deps-auditor +
god-docs-writer verification. Catches pre-existing CVEs, doc drift, artifact
quality drift before declaring complete.

### --skip-hygiene
Default. Skip the hygiene pass. Use when iterating quickly.

## Mandatory final sync

Regardless of flags, `/god-mode` always runs `/god-sync` before declaring
complete. This ensures all 14 artifact categories are in a consistent state:

- 10 Tier 0-3 artifacts validated (have-nots passing)
- 4 capture artifacts noted as `not-yet-created` (graceful handling)
- SYNC-LOG.md updated with arc completion entry
- state.json reflects final tier statuses

Under `--yolo`, the sync step auto-applies (no pause). Under
`--conservative`, it pauses for confirmation. Under `--with-hygiene`,
it runs alongside the hygiene pass.

The sync step is what closes the loop between greenfield arc creation and
the comprehensive 14-artifact reconciliation system. See
`docs/greenfield-coverage.md` for what's created when.

## Completion

When orchestrator returns "complete", display:

```
Godpowers full-arc complete.

Artifacts on disk:
  + PRD           .godpowers/prd/PRD.md
  + Architecture  .godpowers/arch/ARCH.md
  + Roadmap       .godpowers/roadmap/ROADMAP.md
  + Stack         .godpowers/stack/DECISION.md
  + Repo          .godpowers/repo/AUDIT.md
  + Build         .godpowers/build/STATE.md
  + Deploy        .godpowers/deploy/STATE.md
  + Observe       .godpowers/observe/STATE.md
  + Launch        .godpowers/launch/STATE.md
  + Harden        .godpowers/harden/FINDINGS.md

Built. Tested. Shipped. Hardened.

Project is now in STEADY STATE. From here, use these workflows:

  Adding features:        /god-feature
  Production bugs:        /god-hotfix
  Code cleanup:           /god-refactor
  Research questions:     /god-spike
  Post-incident:          /god-postmortem
  Framework upgrades:     /god-upgrade
  Documentation:          /god-docs
  Dependency updates:     /god-update-deps

Periodic hygiene:
  Quality audit:          /god-audit
  Health check:           /god-hygiene

Or describe what you want and /god-next will route.
```
