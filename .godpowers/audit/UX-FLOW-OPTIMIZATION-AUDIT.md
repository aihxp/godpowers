# UX Flow Optimization Audit

- [DECISION] Date: 2026-06-08.
- [DECISION] Scope: UX flows, user journey flows, command flows, workflow YAML flows, intent recipes, installer helper flows, and documentation paths in the Godpowers repository.
- [DECISION] Goal: identify improvements, redundancy, optimization, and consolidation opportunities without removing features.
- [DECISION] This audit is an optimization audit, not a defect audit.

## Evidence Reviewed

- [DECISION] The executable surface contains 112 slash command skills, 112 routing files, 40 core specialist agents, 13 workflow YAML files, 42 intent recipes, and 7 installer CLI helper commands.
- [DECISION] The command and routing surface is mechanically connected because no skill is missing a route and no route is missing a skill.
- [DECISION] The workflow surface is mechanically connected because every core workflow loads and plans through `lib/workflow-runner.js`.
- [DECISION] The recipe surface is mechanically connected because every recipe has `apiVersion: godpowers/v1`, at least one keyword, and at least one sequence step.
- [DECISION] The profile surface is already partially consolidated because `core` installs 15 skills, `builder` installs 33 skills, `maintainer` installs 44 skills, `suite` installs 20 skills, and `full` installs all 112 skills.
- [DECISION] Verification commands run during this audit were `node scripts/test-repo-surface-sync.js`, `node scripts/test-automation-surface-sync.js`, `node scripts/test-router.js`, and `node scripts/test-recipes.js`.
- [DECISION] All four verification commands passed.

## Executive Summary

- [DECISION] Godpowers currently does what it was designed to do: it provides a connected slash-command product system with routes, recipes, agents, workflows, package checks, and release gates.
- [HYPOTHESIS] The strongest remaining UX risk is not missing capability but command-choice overload.
- [HYPOTHESIS] The safest improvement path is to consolidate presentation, routing, and typed outcomes while keeping all existing commands as stable entry points.
- [DECISION] No feature should be removed as part of the first optimization pass.
- [DECISION] Existing commands should become shortcuts, aliases, or explicit modes under clearer family-level journeys.

## Priority Findings

### 1. Primary Surface Is Connected But Still Too Crowded

- [DECISION] Evidence: the public reference lists 112 slash commands and the install profile `full` exposes all 112.
- [DECISION] Evidence: the docs already teach `/god`, `/god-next`, and `/god-status` as sideline commands that read the same playbook.
- [HYPOTHESIS] New users are likely to succeed when they start from `/god`, `/god-mode`, `/god-next`, `/god-status`, or `/god-help`, but they may feel the system is larger than it is if every leaf command looks equally primary.
- [DECISION] Recommendation: keep all 112 commands but make the public UX treat them as a small set of command families.
- [DECISION] Proposed primary families: start, continue, build, verify, operate, capture, recover, maintain, extend, suite.
- [DECISION] Proposed no-loss consolidation: `/god-help` and `/god` should present family cards first, then expose leaf commands only after the user picks a family.
- [DECISION] Implementation risk is low because this can start as docs and help rendering before any routing behavior changes.

### 2. Status, Progress, Lifecycle, Locate, And Next Overlap In User Language

- [DECISION] Evidence: exact trigger overlap exists for `what's done` between `/god-progress` and `/god-status`.
- [DECISION] Evidence: exact trigger overlap exists for `where am i` between `/god-lifecycle` and `/god-locate`.
- [DECISION] Evidence: `/god-status`, `/god-progress`, `/god-lifecycle`, `/god-locate`, and `/god-next` all answer variants of location, completion, and next action.
- [HYPOTHESIS] This family is conceptually sound but can feel redundant because the user is choosing between similar mental questions.
- [DECISION] Recommendation: keep all five commands but make `/god-status` the hub view with explicit subviews.
- [DECISION] Proposed subviews: status overview, progress ledger, lifecycle phase, resume location, and next action.
- [DECISION] Proposed no-loss consolidation: `/god-progress`, `/god-lifecycle`, `/god-locate`, and `/god-next` remain direct shortcuts, while `/god-status` exposes them as named views.
- [DECISION] Suggested implementation: update `skills/god-status.md`, `skills/god-help.md`, `docs/reference.md`, and `docs/recipes.md` to explain the status family as one dashboard with multiple views.

### 3. Capture Commands Are Useful But Need A Ladder

- [DECISION] Evidence: capture commands include `/god-note`, `/god-add-todo`, `/god-add-backlog`, `/god-plant-seed`, and `/god-check-todos`.
- [DECISION] Evidence: recipes already separate `capture-idea` and `capture-todo`.
- [HYPOTHESIS] Users understand capture intent before they understand the difference between a note, todo, backlog item, and seed.
- [DECISION] Recommendation: keep all commands but make `/god` route free-text capture requests through a capture ladder.
- [DECISION] Proposed ladder: note means save only, todo means actionable soon, backlog means optional later, seed means conditional future trigger.
- [DECISION] Proposed no-loss consolidation: do not add a new command until the route and docs prove that a family command would reduce confusion.
- [DECISION] Suggested implementation: add a capture family card to `/god-help` and add trigger precedence guidance so generic `capture this` routes to `/god-note` unless the user names priority, date, trigger, or future condition.

### 4. Small Work Routing Needs One Visible Sizing Decision

- [DECISION] Evidence: small-work commands include `/god-fast`, `/god-quick`, `/god-feature`, `/god-story`, `/god-build`, `/god-debug`, and `/god-hotfix`.
- [DECISION] Evidence: recipes already classify feature additions into tiny, small, deferred, parallel, mid-arc pause, PRD update, and next-milestone paths.
- [HYPOTHESIS] The user journey can be improved if the system shows one sizing card before asking the user to choose a command.
- [DECISION] Recommendation: keep all small-work commands but centralize the decision prompt inside `/god` and `/god-next`.
- [DECISION] Proposed sizing rules: trivial direct edit routes to `/god-fast`, small TDD task routes to `/god-quick`, existing project feature routes to `/god-feature`, fine-grained planned slice routes to `/god-story`, current milestone implementation routes to `/god-build`, non-urgent bug routes to `/god-debug`, and production outage routes to `/god-hotfix`.
- [DECISION] Suggested implementation: add a reusable "work size classifier" section to `skills/god.md`, `skills/god-next.md`, and `docs/recipes.md`.

### 5. Verification Commands Need A Ladder Instead Of A List

- [DECISION] Evidence: verification commands include `/god-lint`, `/god-standards`, `/god-audit`, `/god-hygiene`, `/god-preflight`, `/god-agent-audit`, `/god-test-runtime`, `/god-review`, `/god-review-changes`, and `/god-dogfood`.
- [HYPOTHESIS] This family is powerful but easy to overuse because each command has a different scope and cost.
- [DECISION] Recommendation: present verification as a ladder from cheapest to broadest.
- [DECISION] Proposed ladder: lint one artifact, standards-check one artifact, review code diff, runtime-test live behavior, audit project artifacts, hygiene-check ongoing project, preflight existing repo, dogfood release-readiness scenarios.
- [DECISION] Proposed no-loss consolidation: keep the leaf commands but make `/god-help verify` and `/god` route the user to the cheapest sufficient verification command.
- [DECISION] Suggested implementation: add a verification family card and route examples for "check this doc", "review this diff", "does the app work", "is the repo healthy", and "is release safe".

### 6. Workflow Closeouts Repeat The Same Local Helper Set

- [DECISION] Evidence: workflow plans repeatedly include closeout helpers such as `checkpoint-sync`, `repo-doc-sync`, `repo-surface-sync`, `pillars-sync-plan`, `source-sync-back`, `host-capabilities`, and `feature-awareness`.
- [DECISION] Evidence: `full-arc` contains 10 unique local helpers, and many other workflows repeat a subset of the same helper vocabulary.
- [HYPOTHESIS] Repeating helper lists across workflow YAML files increases drift risk and makes future workflow additions harder to audit.
- [DECISION] Recommendation: keep the helpers but introduce named helper groups in the workflow schema or runner.
- [DECISION] Proposed helper groups: `standard-closeout`, `repo-maintenance-closeout`, `runtime-awareness-closeout`, `release-readiness-closeout`, and `source-sync-closeout`.
- [DECISION] Proposed no-loss consolidation: workflow YAML can reference helper groups while serialized plans still expand the exact helper names for visibility.
- [DECISION] Suggested implementation: add helper-group expansion to `lib/workflow-runner.js` or `lib/workflow-parser.js`, then update workflow YAML files gradually.

### 7. Contextual Route Exits Are Too Vague For A Polished UX

- [DECISION] Evidence: 32 route success paths currently return contextual values such as `varies`, `varies-by-verdict`, `steady-state`, or `session-end`.
- [HYPOTHESIS] These placeholders are safe for internal routing but weaker for user-facing closeouts because the UI cannot always explain the next state concretely.
- [DECISION] Recommendation: replace vague exits with typed outcomes that preserve flexibility.
- [DECISION] Proposed typed outcomes: `contextual`, `verdict-based`, `steady-state`, `session-end`, `requires-selection`, and `no-next-command`.
- [DECISION] Proposed no-loss consolidation: retain current commands and next behavior, but add route metadata fields for title, reason template, allowed next commands, and done-state label.
- [DECISION] Suggested implementation: update route YAML schema, route-quality sync, and dashboard action brief to render typed outcomes.

### 8. Trigger Overlaps Need Explicit Precedence

- [DECISION] Evidence: exact duplicate trigger phrases were found for `continue`, `think through`, `what happened`, `what's done`, and `where am i`.
- [HYPOTHESIS] Exact overlap is acceptable when `/god` is the front door, but direct trigger matching can surprise users if the wrong command wins.
- [DECISION] Recommendation: add trigger precedence rules to routing metadata or generated help.
- [DECISION] Proposed precedence: `continue` should prefer `/god-resume-work` when `HANDOFF.md` exists and `/god-next` otherwise.
- [DECISION] Proposed precedence: `think through` should prefer `/god-discuss` when a concrete decision exists and `/god-explore` when the idea is broad.
- [DECISION] Proposed precedence: `what happened` should prefer `/god-logs` for run history and `/god-postmortem` only when incident state exists.
- [DECISION] Proposed precedence: `what's done` should prefer `/god-progress` for deliverables and `/god-status` for operational state.
- [DECISION] Proposed precedence: `where am i` should prefer `/god-locate` after session resume and `/god-lifecycle` for phase selection.

### 9. Extension Journey Has Current Features But Some Docs Read Like Old Roadmap Notes

- [DECISION] Evidence: `docs/recipes.md` still labels extension channel and compliance examples as `v0.13+` while the current repository version is `2.3.1`.
- [DECISION] Evidence: extension pack files are present under `extensions/security-pack`, `extensions/launch-pack`, and `extensions/data-pack`.
- [HYPOTHESIS] Users may read the examples as future or legacy status even though extension authoring and pack checks are current release surfaces.
- [DECISION] Recommendation: update extension journey docs to say "extension pack required" instead of old version annotations.
- [DECISION] Proposed no-loss consolidation: keep extension commands in packs and keep core extension management commands in the main reference.

### 10. Brownfield Starting Paths Need A Simple Versus Deep Split

- [DECISION] Evidence: `existing-codebase-onboarding` routes through `/god-map-codebase -> /god-init -> /god-status -> /god-next`.
- [DECISION] Evidence: `brownfield-onboarding` routes through `/god-preflight -> /god-archaeology -> /god-reconstruct -> /god-audit -> /god-tech-debt -> /god-feature`.
- [HYPOTHESIS] Both paths are valid, but the docs should name the difference as simple onboarding versus deep inheritance.
- [DECISION] Recommendation: keep both recipes but add route copy that explains when each path is safer.
- [DECISION] Proposed split: simple onboarding is for a known repo with manageable context, while deep inheritance is for unknown ownership, unclear architecture, risky refactor, or missing tests.

### 11. Installer Profiles Are A Strong Consolidation Mechanism But Need Better Journey Copy

- [DECISION] Evidence: the installer profile system already narrows the visible command surface to 15, 33, 44, or 20 commands for role-specific installs.
- [HYPOTHESIS] Profiles can reduce perceived complexity without changing runtime behavior.
- [DECISION] Recommendation: present profiles as user journeys rather than install options only.
- [DECISION] Proposed journey names: "I want the basics", "I build products", "I maintain Godpowers or mature repos", and "I coordinate suites".
- [DECISION] Suggested implementation: update `README.md`, `docs/getting-started.md`, and `docs/reference.md` to show profiles beside the first-run scenarios.

### 12. Suite And Workstream Commands Should Share Collaboration Language

- [DECISION] Evidence: Mode D suite commands and workstream commands both support multi-context coordination.
- [HYPOTHESIS] Users may not know whether parallel work should start with `/god-workstream` or `/god-suite-*`.
- [DECISION] Recommendation: distinguish them by scope in help and recipes.
- [DECISION] Proposed distinction: workstream is same repo parallelism, suite is multi-repo coordination.
- [DECISION] Proposed no-loss consolidation: keep both families but put them under one collaboration card in `/god-help`.

## No-Loss Consolidation Map

- [DECISION] Start family keeps `/god`, `/god-init`, `/god-mode`, `/god-explore`, `/god-discuss`, `/god-preflight`, `/god-map-codebase`, `/god-org-context`, and `/god-migrate`.
- [DECISION] Continue family keeps `/god-status`, `/god-next`, `/god-progress`, `/god-lifecycle`, `/god-locate`, `/god-resume-work`, and `/god-pause-work`.
- [DECISION] Build family keeps `/god-build`, `/god-feature`, `/god-story`, `/god-story-build`, `/god-story-verify`, `/god-story-close`, `/god-fast`, `/god-quick`, `/god-debug`, and `/god-add-tests`.
- [DECISION] Verify family keeps `/god-lint`, `/god-standards`, `/god-review`, `/god-review-changes`, `/god-test-runtime`, `/god-audit`, `/god-agent-audit`, `/god-hygiene`, `/god-dogfood`, and `/god-preflight`.
- [DECISION] Operate family keeps `/god-deploy`, `/god-observe`, `/god-harden`, `/god-launch`, `/god-hotfix`, `/god-postmortem`, `/god-logs`, `/god-metrics`, `/god-trace`, and `/god-export-otel`.
- [DECISION] Maintain family keeps `/god-docs`, `/god-sync`, `/god-scan`, `/god-link`, `/god-reconcile`, `/god-reconstruct`, `/god-tech-debt`, `/god-update-deps`, `/god-upgrade`, `/god-context`, and `/god-context-scan`.
- [DECISION] Capture family keeps `/god-note`, `/god-add-todo`, `/god-check-todos`, `/god-add-backlog`, `/god-plant-seed`, `/god-extract-learnings`, `/god-thread`, and `/god-graph`.
- [DECISION] Recover family keeps `/god-undo`, `/god-redo`, `/god-rollback`, `/god-restore`, `/god-repair`, `/god-skip`, `/god-smite`, and `/god-doctor`.
- [DECISION] Extend family keeps `/god-extension-scaffold`, `/god-extension-add`, `/god-extension-list`, `/god-extension-info`, `/god-extension-remove`, `/god-test-extension`, and `/god-build-agent`.
- [DECISION] Collaborate family keeps `/god-workstream`, `/god-suite-init`, `/god-suite-status`, `/god-suite-sync`, `/god-suite-patch`, `/god-suite-release`, `/god-party`, `/god-sprint`, and `/god-pr-branch`.
- [DECISION] Configuration family keeps `/god-settings`, `/god-set-profile`, `/god-budget`, `/god-cost`, `/god-cache-clear`, `/god-help`, and `/god-version`.

## Suggested Implementation Sequence

- [DECISION] Step 1 should be docs and help consolidation only, because it preserves all behavior and immediately reduces cognitive load.
- [DECISION] Step 2 should be trigger precedence metadata for the five exact overlap phrases.
- [DECISION] Step 3 should be typed route outcomes replacing vague route exits.
- [DECISION] Step 4 should be workflow helper groups with serialized expansion for audit visibility.
- [DECISION] Step 5 should be profile journey copy and first-run command family cards.
- [DECISION] Step 6 should be optional command-family recipes if the first five steps prove useful.

## Risks And Guardrails

- [DECISION] Do not delete existing commands.
- [DECISION] Do not rename existing commands without leaving compatibility aliases.
- [DECISION] Do not hide leaf commands from `docs/reference.md`.
- [DECISION] Do not make `/god` an orchestrator because `god-orchestrator` must remain the single project-run owner.
- [DECISION] Do not auto-run interactive commands such as `/god-review-changes` from a family card.
- [DECISION] Do not collapse runtime helpers into hidden background work because auto-invoke visibility is a core product promise.

## Recommended Next Plan

- [DECISION] The best first implementation is a small, no-loss UX consolidation pass across `/god-help`, `/god`, docs, and route metadata.
- [DECISION] The second implementation should add typed route outcomes and tests for the 32 contextual exits.
- [DECISION] The third implementation should add workflow helper groups if typed route outcomes land cleanly.
- [HYPOTHESIS] This sequence improves user comprehension before touching runtime behavior, which keeps the risk low.

## Implementation Status

- [DECISION] Implemented command family metadata in `lib/command-families.js` for start, continue, build, verify, operate, maintain, capture, recover, extend, collaborate, and configure.
- [DECISION] Implemented capture, work size, verification, status-view, and trigger-precedence helpers without removing any leaf command.
- [DECISION] Added route metadata families to all shipped `routing/god*.yaml` command routes.
- [DECISION] Added typed `success-path.outcome` metadata for contextual, verdict-based, steady-state, session-end, and selection-based route exits.
- [DECISION] Updated `lib/route-quality-sync.js` and `scripts/test-automation-surface-sync.js` so flexible route exits require typed outcome metadata.
- [DECISION] Implemented workflow helper groups in `lib/workflow-helper-groups.js` and expanded them through `lib/workflow-runner.js` serialized plans.
- [DECISION] Updated repeated workflow closeout helper lists to named groups while preserving explicit helper expansion in generated plans.
- [DECISION] Updated `/god-help`, `/god`, `/god-next`, `/god-status`, `SKILL.md`, README, getting-started docs, reference docs, recipes, architecture docs, and auto-invoke visibility docs to present the consolidated UX paths.
- [DECISION] Updated extension recipe copy to describe current extension-pack-required flows instead of old release annotations.
- [DECISION] Added `scripts/test-command-families.js` and included it in the main test runner and release surface guardrails.
