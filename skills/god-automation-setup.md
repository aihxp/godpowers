---
name: god-automation-setup
description: |
  Prepare an explicit opt-in setup plan for host-native Godpowers automation.
  Never creates schedules, routines, background agents, API triggers, or CI
  workflows without user approval.

  Triggers on: "god automation setup", "set up background automation", "make godpowers proactive"
---

# /god-automation-setup

Prepare a safe, host-native automation setup plan.

## Process

1. Resolve the runtime root and load `<runtimeRoot>/lib/automation-providers.js`.
2. Call `automation.setupPlan(projectRoot)`.
3. Print `automation.renderSetupPlan(plan)`.
4. Ask the user to choose:
   - provider
   - templates
   - cadence
   - connector or repository scope
   - whether write actions are allowed
5. Create provider-native automation only if the current host exposes a safe
   automation tool and the user explicitly approved the exact provider,
   template, cadence, and scope.
6. After creation, write or update `.godpowers/automations.json` with:
   - automation id
   - provider id
   - status
   - cadence
   - prompt summary
   - created timestamp
   - host surface used
7. Run `/god-automation-status` after setup and show the result.

## Hard Stops

Do not create automations during install.

Do not create any automation that can do these unless the user explicitly asks
for that exact write-capable automation:

- stage, commit, push, merge, package, publish, or release
- deploy to staging or production
- access provider dashboards, DNS, credentials, secrets, or billing
- clear `.godpowers/REVIEW-REQUIRED.md`
- accept Critical security findings
- run broad dependency upgrades
- delete files, reset branches, or clean worktrees

## Safe Starting Templates

- `daily-status`: run `godpowers status --project .` and summarize current phase, progress, open items, and next action
- `stale-checkpoint`: inspect checkpoint freshness and suggest `/god-sync` or `/god-resume-work`
- `review-queue`: report unresolved review items without clearing them
- `weekly-hygiene`: report docs, dependencies, checkpoint, reviews, and hygiene signals
- `release-readiness`: report release readiness without publishing

## Provider Guidance

- Codex App: use native Codex automations when the host exposes them.
- Claude Code: use `/schedule` for scheduled routines. Use Claude web for API or GitHub triggers.
- Cline: use `cline schedule` or the Cline SDK scheduler.
- Kilo: use KiloClaw Scheduled Triggers.
- Qwen Code: use `/loop` only for session-scoped checks and report that it is not durable.
- Cursor: use Background Agents or the Background Agent API for branch-scoped async work.
- GitHub Copilot: use issues, pull requests, or Copilot cloud agent entry points.
- Windsurf: install workflows or skills, but report that workflows are manual-only.
- Gemini CLI, OpenCode, CodeBuddy, and Pi: use headless or SDK execution only with an approved scheduler.
- Trae and Antigravity: report scheduled automation as unknown unless the host proves otherwise.

## Output Shape

```text
Godpowers Automation Setup Plan

Recommended provider: <provider>

Setup steps:
  1. <host-native setup step>

Recommended safe templates:
  - <template id>: <prompt>

Approval required:
  - Choose a provider
  - Choose one or more templates
  - Confirm any host-native schedule, routine, background agent, API trigger, or connector scope
```

## Proposition Closeout

End with:

```text
Proposition:
  1. Implement partial: create one read-only automation after approval
  2. Implement complete: create all safe read-only automations after approval
  3. Discuss more: tune provider, cadence, or safety rules
  4. Inspect status: /god-automation-status
Recommended: <one option tied to provider capability and user risk>
```
