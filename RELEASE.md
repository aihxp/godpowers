# Godpowers 1.6.11 Release

Date: 2026-05-16

Godpowers 1.6.11 makes automatic work easier to trust across supported AI
coding tools. The release keeps the existing 106 slash commands, 39 specialist
agents, 13 workflows, and 36 recipes, while clarifying when Godpowers spawned
an agent, called a local runtime helper, or only suggested the next action.

## What is stable

- 106 slash commands
- 39 specialist agents
- 13 executable workflows
- 36 intent recipes
- 15-runtime installer
- Codex installs with generated `god-*.toml` agent metadata files
- Markdown specialist agent contracts at `<runtime>/agents/god-*.md`
- Safe-sync routing before deploy, observe, harden, launch, or god-mode work
- Critical harden finding gate before launch
- Native Pillars project context through `AGENTS.md` and `agents/*.md`
- `.godpowers/` workflow state and artifact layout
- Core schemas: intent, state, events, workflow, routing, recipes, extension
  manifests
- Extension pack compatibility range for the 1.x line
- GSD-style proposition closeouts for exploratory, diagnostic, audit,
  lifecycle, status, reconciliation, and decision-support outputs
- Plain-language project-run wording in user-facing reports
- Planning visibility blocks for PRD, roadmap, milestone, and completion basis

## What is new

- The master skill now defines a proactive auto-invoke policy with four levels:
  read-only suggestions, visible local helpers, bounded specialist agent spawns,
  and explicit-approval-only actions.
- `/god-next`, `/god-status`, and God Mode closeouts now include proactive
  checks for checkpoint freshness, pending reviews, sync state, docs drift,
  runtime verification, security, dependencies, and hygiene.
- `/god-sync`, `/god-scan`, `god-updater`, and `god-orchestrator` now distinguish
  spawned agents from local runtime helpers such as reverse-sync, Pillars sync,
  checkpoint sync, and context refresh.
- Docs drift, runtime verification, and review queue workflows now document when
  they may be suggested or auto-invoked.
- Spawning instructions now use platform-neutral host-agent language instead of
  Claude-specific "Task tool" wording.
- The installer now replaces Codex skill directories before writing `SKILL.md`,
  which removes stale nested files from older Codex install shapes.

## Platform behavior

Claude Code, Codex, Cursor, Windsurf, Gemini, OpenCode, Copilot, Augment,
Trae, Cline, Kilo, Antigravity, Qwen, CodeBuddy, and Pi all receive the same
portable Markdown agent contracts. Codex also receives `god-*.toml` files as
its registry adapter.

If a host platform cannot provide a true fresh-context agent spawn, Godpowers
must say so visibly and report the work as local runtime only or simulated in
current context. It must not imply that a detached background agent ran.

## Safety policy

Godpowers may proactively suggest next steps and may run directly evidenced
local helpers. It may spawn bounded agents only when the current workflow owns
that surface.

Godpowers still must not auto-run these without explicit user intent:

- deployed staging verification against a guessed URL
- production launch
- provider dashboard, admin console, DNS, credential, or secret checks
- broad dependency upgrades
- destructive repair, rollback, reset, delete, or cleanup
- clearing `.godpowers/REVIEW-REQUIRED.md`
- accepting Critical security findings
- git stage, commit, push, package, release, or publish

## Validation

Release validation should include:

- `node scripts/validate-skills.js`
- `bash scripts/smoke.sh`
- `node scripts/test-agent-validator.js`
- `node scripts/test-install-smoke.js`
- `node scripts/check-package-contents.js`
- `npm run release:check`

The `v1.6.11` git tag should point to the release commit that matches the npm
`godpowers@1.6.11` package.
