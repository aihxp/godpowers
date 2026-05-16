# Godpowers 1.6.13 Release

Date: 2026-05-16

Godpowers 1.6.13 adds host automation provider discovery and opt-in setup
planning. The same local runtime surface can now report Codex App automations,
Claude Routines, Cline schedules, Qwen loops, Cursor Background Agents,
Copilot cloud agent support, and scriptable CLI options without silently
creating background work.

## What is stable

- 108 slash commands
- 39 specialist agents
- 13 executable workflows
- 36 intent recipes
- 15-runtime installer
- 458 package files in the npm tarball
- Codex installs with generated `god-*.toml` agent metadata files
- Markdown specialist agent contracts at `<runtime>/agents/god-*.md`
- Shared runtime bundle at `<runtime>/godpowers-runtime`
- Native Pillars project context through `AGENTS.md` and `agents/*.md`
- `.godpowers/` workflow state and artifact layout
- Safe-sync routing before deploy, observe, harden, launch, or god-mode work
- Critical harden finding gate before launch
- GSD-style proposition closeouts for exploratory, diagnostic, audit,
  lifecycle, status, reconciliation, and decision-support outputs
- Plain-language project-run wording in user-facing reports

## What is new

- Added `lib/automation-providers.js`, a shared automation provider detector.
- Added `godpowers automation-status --project .`.
- Added `godpowers automation-setup --project .`.
- Added `/god-automation-status` and `/god-automation-setup`.
- Added `docs/automation-providers.md`.
- Dashboard output now reports automation support when a host-native provider
  is available.
- Tests now cover provider classification, active automation config,
  setup-plan rendering, and CLI JSON output.

## Platform behavior

Claude Code, Codex, Cursor, Windsurf, Gemini, OpenCode, Copilot, Augment,
Trae, Cline, Kilo, Antigravity, Qwen, CodeBuddy, and Pi all receive the same
portable Markdown agent contracts. Codex also receives `god-*.toml` files as
its registry adapter.

The dashboard and automation provider engines ship in the installed runtime
bundle so host tools can use shared implementation code instead of parallel
command-specific Markdown contracts. If a host platform cannot provide a true
fresh-context agent spawn or durable scheduler, Godpowers must say so visibly
and report the work as local runtime only, manual workflow only, or simulated
in current context.

## Safety policy

Godpowers may proactively suggest next steps and may run directly evidenced
local helpers. It may spawn bounded agents only when the current workflow owns
that surface.

Godpowers still must not auto-run these without explicit user intent:

- deployed staging verification against a guessed URL
- production launch
- provider dashboard, admin console, DNS, credential, or secret checks
- schedule, routine, background agent, API trigger, or CI workflow creation
- broad dependency upgrades
- destructive repair, rollback, reset, delete, or cleanup
- clearing `.godpowers/REVIEW-REQUIRED.md`
- accepting Critical security findings
- git stage, commit, push, package, release, or publish

## Validation

Release validation includes:

- `node scripts/test-dashboard.js`
- `node scripts/test-automation-providers.js`
- `npm test`
- `npm run test:audit`
- `node scripts/check-package-contents.js`
- `git diff --check`

The `v1.6.13` git tag points to the release commit that matches the npm
`godpowers@1.6.13` package.
