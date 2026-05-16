# Godpowers 1.6.12 Release

Date: 2026-05-16

Godpowers 1.6.12 turns progress visibility into executable product behavior.
The same dashboard logic now powers slash command closeouts, direct CLI status
checks, JSON status output, and next-action recommendations from disk state.

## What is stable

- 106 slash commands
- 39 specialist agents
- 13 executable workflows
- 36 intent recipes
- 15-runtime installer
- 453 package files in the npm tarball
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

- Added `lib/dashboard.js`, a shared executable status engine.
- Added `godpowers status --project .`.
- Added `godpowers next --project .`.
- Added `--json` output for machine-readable status and next-step routing.
- Dashboard output now reports current phase, tier position, percentage,
  planning visibility, proactive checks, open items, and recommended action.
- `/god-status`, `/god-next`, `/god-mode`, and `god-orchestrator` now reference
  the same dashboard engine when local runtime execution is available.
- Tests now cover dashboard computation, rendering, CLI output, review queue
  detection, and git porcelain parsing.

## Platform behavior

Claude Code, Codex, Cursor, Windsurf, Gemini, OpenCode, Copilot, Augment,
Trae, Cline, Kilo, Antigravity, Qwen, CodeBuddy, and Pi all receive the same
portable Markdown agent contracts. Codex also receives `god-*.toml` files as
its registry adapter.

The dashboard engine ships in the installed runtime bundle so host tools can
use one shared implementation instead of parallel command-specific Markdown
contracts. If a host platform cannot provide a true fresh-context agent spawn,
Godpowers must say so visibly and report the work as local runtime only or
simulated in current context.

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

Release validation includes:

- `node scripts/test-dashboard.js`
- `npm test`
- `npm run test:audit`
- `node scripts/check-package-contents.js`
- `git diff --check`

The `v1.6.12` git tag points to the release commit that matches the npm
`godpowers@1.6.12` package.
