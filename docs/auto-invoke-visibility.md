# Auto-Invoke Visibility

Godpowers has two kinds of automatic work:

- Agent work: the host AI tool spawns a specialist such as `god-updater`,
  `god-context-writer`, `god-design-reviewer`, or `god-standards-check`.
- Local runtime work: JavaScript helpers update disk directly, such as
  `lib/reverse-sync.run`, `lib/pillars.applyArtifactSync`, or
  `lib/checkpoint.syncFromState`.

Both must be visible to the user. Local runtime work is not a background agent.

## Required Status Shape

```text
Auto-invoked:
  Trigger: <what caused the automatic step>
  Agent: <agent name, or none, local runtime only>
  Local syncs:
    + <helper>: <result>
  Artifacts: <changed files, no-op, or deferred>
  Log: <path, or none>
```

Use `Sync status:` when the automatic work is part of `/god-sync`,
`/god-scan`, or a final `/god-mode` sync.

## Godpowers Dashboard

Every command that completes, pauses, or proposes work must finish with the
same status model:

When the runtime bundle is available, this model is computed by
`lib/dashboard.js`:

```js
const dashboard = require('./lib/dashboard');
const result = dashboard.compute(projectRoot);
console.log(dashboard.render(result));
```

```text
Godpowers Dashboard

Current status:
  State: <complete | partial | blocked | proposal>
  Phase: <plain-language phase> (tier <human ordinal> of <human total>)
  Step: <sub-step label> (step <n> of <total steps>)
  Progress: <pct>% (<done> of <total> steps complete)

Planning visibility:
  PRD: <done | pending | missing | deferred> <path when present>
  Roadmap: <done | pending | missing | deferred> <path when present>
  Current milestone: <roadmap milestone, phase, or next gate>
  Completion: <pct>% <basis>

Proactive checks:
  Checkpoint: <fresh | refreshed | missing | stale>
  Reviews: <none | N pending, suggest /god-review-changes>
  Sync: <fresh | suggest /god-sync | local helper ran>
  Docs: <fresh | possible drift, suggest /god-docs>
  Runtime: <not-applicable | known URL, suggest /god-test-runtime>
  Security: <clear | sensitive files changed, suggest /god-harden>
  Dependencies: <clear | dependency files changed, suggest /god-update-deps>
  Hygiene: <fresh | stale, suggest /god-hygiene>

Open items:
  1. <none, blocker, deferred verification, or pending review>

Next:
  Recommended: <one command or user decision>
  Why: <one sentence tied to disk state>
```

This dashboard is required for `/god-status`, `/god-next`, `/god-mode`, and
workflow closeouts so the user can always see where Godpowers is, how close it
is to completion, and what happens next.

## Already Automatic

| Area | Current trigger | Visibility requirement |
|---|---|---|
| Final sync | `/god-mode` completion | Show `god-updater` spawn and local sync counts |
| Feature sync | Feature-addition recipes | Show `/god-sync` trigger and `SYNC-LOG.md` path |
| Reverse-sync | `/god-sync`, `/god-scan`, code-touching workflows | Show whether an agent ran or local runtime only |
| Pillars sync | Artifact truth changes | Show changed pillar files or no-op |
| Checkpoint sync | State mutation checkpoints | Show `.godpowers/CHECKPOINT.md` created, updated, no-op, or skipped |
| Context refresh | `/god-sync`, `/god-init`, `/god-context` | Show `god-context-writer` spawn or no-op |
| Standards checks | Routed stage boundaries | Show gate, artifact, pass/fail, and next route |
| Preflight | Brownfield and bluefield starts | Show why it ran and which route it unlocked |
| DESIGN/PRODUCT gate | Design or product artifact changed | Show `god-design-reviewer` verdict before propagation |

## Good Auto-Invoke Candidates

| Candidate | Trigger | Benefit | Guardrail |
|---|---|---|---|
| `/god-status` summary | After `/god-sync`, `/god-scan`, and `/god-mode` | Confirms disk-derived status without user asking | Read-only only |
| `/god-next` route | After any successful standalone command | Prevents dead-stop endings | Must include proposition when no work starts |
| `/god-scan --linkage-only` | After code edits that include `Implements:` or `Source:` annotations | Keeps linkage current without full sync | Report local runtime only |
| Checkpoint refresh | After any state.json write | Makes new sessions resume accurately | Never overwrite user content outside checkpoint |
| Context refresh dry-run | After AGENTS.md or pillar changes | Shows whether tool pointers would change | Default to no-op unless configured |
| `/god-review-changes` suggestion | When REVIEW-REQUIRED.md gains entries | Gives the user a concrete review path | Do not auto-clear review items |
| `/god-hygiene` suggestion | After a full project run or every 30 days | Keeps docs, deps, and quality current | Suggest by default, auto-run only when requested |
| Runtime verification | After frontend-visible changes | Catches blank screens and layout regressions | Auto-run only when local app target is known |

## Proactive Matrix

| Level | Behavior | Default action | Examples |
|---|---|---|---|
| 1 | Read-only suggestion | Run by default | `/god-next` route, status summary, hygiene suggestion |
| 2 | Local helper | Run when directly triggered | checkpoint sync, linkage scan, Pillars sync plan |
| 3 | Scoped specialist agent | Spawn only with bounded evidence | design review, docs drift check, browser test with known URL |
| 4 | Human-owned action | Require explicit approval | production launch, publish, destructive repair |

## Level 1 Auto-Suggest

Run or compute these by default in closeouts:

- `/god-next` after successful commands.
- `/god-status` style summary after `/god-sync`, `/god-scan`, and `/god-mode`.
- `/god-review-changes` suggestion when `REVIEW-REQUIRED.md` has pending
  entries.
- `/god-hygiene` suggestion after full project runs, long idle periods, or stale
  review queues.
- `/god-locate` suggestion when `CHECKPOINT.md` is missing, stale, or conflicts
  with `state.json`.

## Level 2 Auto-Run Local Helpers

Run these automatically when the trigger is direct, then display an
`Auto-invoked:` card:

- `lib/checkpoint.syncFromState` after `state.json` or `PROGRESS.md` changes.
- Lightweight reverse-sync or linkage scan after code or artifact edits.
- Pillars sync planning after durable artifact truth changes.
- Context refresh dry-run after AI tool instruction files change.
- Progress recomputation after commands that change artifacts.

## Level 3 Auto-Spawn Agents

Spawn these only when the scope is bounded and the trigger is visible:

- `god-design-reviewer` after `DESIGN.md` or `PRODUCT.md` changes.
- `god-updater` after feature, hotfix, refactor, build, deploy, observe,
  launch, harden, docs, upgrade, or dependency workflows change code or
  artifacts.
- `god-docs-writer` in drift-check mode when docs changed after code changed,
  or code changed after docs that claim current behavior.
- `god-browser-tester` when frontend-visible files changed and a known local,
  preview, staging, or production URL is evidenced.
- `god-harden-auditor` inside security workflows, or as a suggestion after
  security-sensitive files changed.
- `god-deps-auditor` inside dependency workflows, or as a suggestion after
  dependency files changed.
- `/god-automation-status` as a read-only provider report when automation
  support may be available.

## Non-Candidates

Do not auto-invoke these without explicit user intent:

- deployed staging against a guessed URL
- provider dashboard or credential checks
- production launch
- broad dependency upgrades
- destructive repairs
- review item clearing
- git stage, commit, push, or publish
- schedule, routine, background agent, API trigger, or CI workflow creation
  without explicit user approval

## User Promise

If Godpowers does something automatically, the user should see:

- why it ran
- whether an agent was spawned
- which local helpers ran
- what changed on disk
- where to inspect the log
- what to do next
