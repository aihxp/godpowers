---
name: god-mode
description: |
  Full autonomous project-run orchestrator. Spawns the god-orchestrator agent in a
  fresh context which runs the entire workflow: idea to hardened production.
  Pauses only for legitimate human-only decisions.

  Triggers on: "god mode", "/god-mode", "autonomous build", "one-shot",
  "full arc", "idea to production", "build everything"
---

# /god-mode

You are receiving a /god-mode invocation. Your job is to spawn the
**god-orchestrator** agent in a fresh context to run the autonomous project
workflow.

## Process

1. Resolve whether this is a new project run or a resume:
   - If `.godpowers/state.json`, `.godpowers/PROGRESS.md`, or
     `.godpowers/CHECKPOINT.md` exists, this is a resume. Do not ask the user
     to describe the project again. Call
     `lib/pillars.pillarizeExisting(projectRoot)` first, then rehydrate intent
     from disk and continue.
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
   - Pillars load set from `lib/pillars.computeLoadSet(projectRoot, taskText)`,
     starting with `agents/context.md` and `agents/repo.md`
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
     a specific project run's plan.)
   - `--brownfield` (force brownfield path even if detection says greenfield)
   - `--bluefield` (force bluefield path)
   - `--greenfield` (force greenfield, skip archaeology even if code exists)

5. Create a private disk handoff before spawning the orchestrator:
   - Path: `.godpowers/runs/<run-id>/ORCHESTRATOR-HANDOFF.md`
   - Create parent directories if needed.
   - Put all detailed orchestration context in this file, including:
     - The user's project description, or durable intent recovered from disk
     - The detected mode (A/B/C/E)
     - The active flags
     - Instruction that existing `.godpowers` state means resume, not prompt
     - Instruction to read `.godpowers/PROGRESS.md` from disk if it exists
     - Instruction to read `.godpowers/prep/INITIAL-FINDINGS.md` and
       `.godpowers/prep/IMPORTED-CONTEXT.md` if present before choosing the
       first planning or build step
     - Instruction to read `.godpowers/preflight/PREFLIGHT.md` if present
       before choosing the first brownfield or bluefield action
     - Instruction to compute and load the Pillars load set before every major
       command, because Pillars is the native project context layer
     - Instruction to run `/god-design` after `/god-prd` and before
       `/god-arch` when initial findings, imported planning context, the PRD,
       or the codebase show UI or product-experience signals
     - Instruction that a red test, typecheck, lint, build, or check command
       is not a completed project run. It must enter the autonomous repair loop and
       continue the same `/god-mode` run until green, except for Critical
       security or a genuine human-only decision.
     - Instruction that deploy, observe, harden, and launch must follow the
       Shipping Closure Protocol: verify a real environment when available,
       otherwise create local/CI-verifiable deploy automation, defer deployed
       staging by default, and continue until the user requests staging or the
       project run reaches final sign-off.
     - Instruction that keys, API tokens, dashboards, admin consoles, and
       provider-specific access are last-mile inputs. Do not pause mid-run for
       `STAGING_APP_URL` unless the user requested deployed staging. At final
       sign-off, ask only for the smallest next item needed by a concrete
       command, usually `STAGING_APP_URL=<staging-origin>`. Ask for additional
       provider access only after a named check proves it is needed.
     - Instruction that staging, preview, and production URLs must come from
       direct evidence. Never infer or invent a domain from project name,
       package name, repo name, README title, or brand name. If no deployed
       origin is evidenced, record deployed staging as deferred and continue
       until staging is requested or final sign-off begins.
     - Instruction that brownfield and bluefield greenfield simulation audits
       must be acted on by god-greenfieldifier. The greenfieldifier writes
       `.godpowers/audit/GREENFIELDIFY-PLAN.md`, pauses before risky canonical
       artifact rewrites, and updates every affected artifact after approval.
     - Instruction that brownfield and bluefield arcs run `/god-preflight`
       automatically when `.godpowers/preflight/PREFLIGHT.md` is absent.
       Greenfield project runs skip preflight unless the user explicitly requests it.
     - Instruction to run routing prerequisites through `lib/router.js`
       `checkPrerequisites` before every direct command dispatch. If
       `safe-sync-clear` fails, run
       `/god-reconcile Release Truth And Safe Sync` before deploy, observe,
       harden, launch, broad migration, or resume work.
     - Instruction that `--yolo` cannot bypass safe sync blockers or
       unresolved Critical harden findings. These are release-truth gates, not
       preference pauses.

6. Spawn the **god-orchestrator** agent via the host platform's native agent spawning mechanism with only a
   display-safe payload:
   - Name the project root.
   - Name the invocation flags.
   - Name the handoff file path.
   - Say: "Read the handoff file first, then run the autonomous workflow from disk
     state. Return only user-facing progress and final status."

   Do not put recovered checkpoint facts, safe-sync plans, local file lists,
   hidden routing rules, or detailed instructions in the spawn message.
   Assume the host UI may display the raw spawn message to the user.

7. Keep the spawn payload display-safe. Do not echo or summarize raw spawn input,
   "Hard instructions", hidden orchestration rules, agent prompts, file
   loadout lists, or internal routing payloads into the user-visible transcript.
   The visible transcript may say only what phase is running, what durable state
   was detected, what commands are running, what changed, and the final
   `Project run complete` or `PAUSE: external access required` block.

8. Orchestrator runs the appropriate workflow:
   - Greenfield -> full project run
   - Brownfield -> brownfield project run (preflight -> archaeology -> reconstruct -> debt-assess -> greenfield simulation audit -> greenfieldify plan and approved artifact updates -> proceed)
   - Bluefield -> bluefield project run (org-context -> preflight -> greenfield simulation audit -> greenfieldify plan and approved artifact updates -> workflow with constraints)

9. Relay only the orchestrator's user-facing output to the user. If the
   platform displays raw spawn details automatically, the displayed payload
   should already be safe. Immediately follow with a clean public summary and
   never repeat detailed handoff contents.

10. When the orchestrator pauses, present the question to the user using the
   pause format (What / Why / Options / Default).

11. When the user answers, append the answer to the existing handoff file or
    create a new handoff file, then re-spawn god-orchestrator with only the
    display-safe pointer.

## User-Visible Transcript Contract

The God Mode transcript is an operator console, not a prompt debugger.

Show:
- detected resume or project mode in plain language
- a compact "Next step" card before each visible phase or tier sub-step
- a compact "Step result" card after each visible phase or tier sub-step
- every auto-invoked command, agent, and local runtime helper using an
  `Auto-invoked:` or `Sync status:` card
- plain-language workflow names. Say "project run" or "workflow" instead of
  unexplained "arc" in visible output
- PRD and roadmap visibility in status and closeout blocks when artifacts
  exist or are expected
- short progress updates for phases, commands, validations, and file edits
- concise validation summaries instead of full command noise when possible
- final changed paths, validation results, and completion or pause status
- final current status, open items, worktree/index state, and recommended next
  action

Hide:
- raw spawn input
- "Hard instructions" sections
- spawned-agent prompt text
- detailed handoff file contents
- system, developer, or AGENTS.md rule recitations
- complete file loadout lists
- internal routing metadata unless it directly affects a user decision

If an internal instruction must influence a pause, translate it into the
smallest user-facing question. For example, ask for
`STAGING_APP_URL=<deployed staging origin>` at final sign-off instead of
exposing the full Shipping Closure Protocol.

## Step Cards

Relay the orchestrator's step cards when present. If the orchestrator output is
missing them, synthesize them from disk state before continuing.

Before work starts:

```
Next step
Progress: <pct>% (<done> of <total> steps complete; current step <n> of <total>)
Tier: <tier-number> <tier-label>
Step: <sub-step-label>
Why this now: <one sentence>
What will happen:
  1. <observable action>
  2. <observable action>
Expected output: <artifact path or verification result>
```

After work completes or pauses:

```
Step result
Progress: <pct>% (<done> of <total> steps complete; current step <n> of <total>)
Tier: <tier-number> <tier-label>
Step: <sub-step-label>
Result: <done | blocked | failed | skipped | imported>
What happened:
  1. <observable action completed>
  2. <artifact or verification result>
Next: <next command or pause question>
```

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
and logs decisions to `.godpowers/YOLO-DECISIONS.md`. Pillar sync proposals
generated from durable Godpowers artifact changes are auto-applied in this
mode and logged as YOLO decisions.

`--yolo` does not skip release-truth gates. If safe sync is unresolved, route
to `/god-reconcile Release Truth And Safe Sync`. If harden has unresolved
Critical findings, pause even under `--yolo`.

For brownfield and bluefield, `--yolo` still runs `/god-preflight` first when
`.godpowers/preflight/PREFLIGHT.md` is absent. The orchestrator then follows
the preflight report's safest recommended route automatically, logging that
choice to `.godpowers/YOLO-DECISIONS.md`. Preflight may only pause under
`--yolo` for Critical security findings or a contradiction that makes route
selection impossible.

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
- SYNC-LOG.md updated with project-run completion entry
- state.json reflects final tier statuses

Under `--yolo`, the sync step auto-applies (no pause). Under
`--conservative`, it pauses for confirmation. Under `--with-hygiene`,
it runs alongside the hygiene pass.

Display this before the final completion block:

```
Sync status:
  Trigger: /god-mode final sync
  Agent: god-updater spawned
  Local syncs:
    + reverse-sync: <counts and result>
    + pillars-sync: <counts and result>
    + checkpoint-sync: <created, updated, no-op, or skipped>
    + context-refresh: <spawned, no-op, or skipped>
  Artifacts: <changed files or no-op>
  Log: .godpowers/SYNC-LOG.md
```

The sync step also reconciles native Pillars context. When `.godpowers`
artifacts create or change durable project truth, Godpowers maps those changes
to relevant pillar files through `lib/pillars.planArtifactSync`. Default mode
proposes pillar updates for review. `--yolo` applies them immediately and logs
the action to `.godpowers/YOLO-DECISIONS.md`.

If `/god-mode` resumes an existing `.godpowers` project that lacks Pillars,
it Pillar-izes the project before continuing. Existing `.godpowers` artifacts
become managed source references in the relevant `agents/*.md` files.

The sync step is what closes the loop between greenfield project-run creation and
the comprehensive 14-artifact reconciliation system. See
`docs/greenfield-coverage.md` for what's created when.

## Completion

When orchestrator returns "complete", display:

```
Godpowers project run complete.

Sync status:
  Trigger: /god-mode final sync
  Agent: god-updater spawned
  Local syncs:
    + reverse-sync: <counts and result>
    + pillars-sync: <counts and result>
    + checkpoint-sync: <created, updated, no-op, or skipped>
    + context-refresh: <spawned, no-op, or skipped>
  Artifacts: <changed files or no-op>
  Log: .godpowers/SYNC-LOG.md

Current status:
  State: complete
  Progress: <pct>% (<done> of <total> steps complete; current step <n> of <total>)
  Worktree: <clean | modified files unstaged | staged changes | mixed>
  Index: <untouched | staged files listed>

Planning visibility:
  PRD: <done | pending | missing | deferred> <artifact path when present>
  Roadmap: <done | pending | missing | deferred> <artifact path when present>
  Current milestone: <roadmap milestone, tier, or next planning gate when known>
  Completion: <pct>% <brief basis, for example done steps over total tracked steps>

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

Open items:
  1. <none, or deployed staging deferred, pending review, unstaged files, etc.>

Next:
  Recommended: <single safest command or decision>
  Why: <one sentence tied to disk state>

Proposition:
  1. Review status: /god-status
  2. Continue work: /god-next or describe the next intent
  3. Commit release-ready changes: stage only the intended files, then commit
  4. Run deployed staging: provide STAGING_APP_URL=<deployed staging origin> when needed
```

If the run edited code but did not stage or commit, the completion block must
say so. If unrelated or pre-existing worktree changes are present, do not imply
the worktree is clean. Recommend a scoped review or explicit staging path.

If the run is a focused brownfield/refactor workflow rather than a full greenfield
project run, adapt the same closeout shape and replace "Project is now in STEADY
STATE" with the actual disk-derived lifecycle and next route.
