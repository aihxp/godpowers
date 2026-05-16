---
name: god-automation-status
description: |
  Show host-native automation provider support for the current project.
  Reports Codex App, Claude Routines, Cline schedules, Qwen loops, Cursor
  background agents, Copilot cloud agent, and scriptable CLI providers.

  Triggers on: "god automation status", "automation support", "background automation status"
---

# /god-automation-status

Show which automation providers Godpowers can safely use in this project.

## Process

1. Resolve the runtime root and load `<runtimeRoot>/lib/automation-providers.js`.
2. Call `automation.detect(projectRoot)`.
3. Print `automation.render(result)`.
4. Read `.godpowers/automations.json` if present and report active automations.
5. Do not create, update, trigger, pause, resume, or delete schedules.
6. Do not stage, commit, push, publish, deploy, clear review queues, or access
   provider dashboards.

If the executable runtime module is unavailable, manually report these provider
classes:

- native-scheduler: Codex App automations, Claude Code routines, Cline schedules, Kilo scheduled triggers
- session-scheduler: Qwen Code `/loop`
- background-agent: Cursor Background Agents, GitHub Copilot cloud agent
- scriptable-headless: Gemini CLI, OpenCode, CodeBuddy SDK, Pi SDK
- manual-workflow: Windsurf workflows, Augment subagents
- unknown: Trae, Antigravity scheduled automation

## Output Shape

```text
Godpowers Automation Providers

Config: .godpowers/automations.json
Recommended provider: <provider or none available>

Active automations:
  - <id via provider: status or none recorded>

Provider status:
  - <provider>: <status> (<class>)

Safe templates:
  - daily-status: Daily Godpowers status, Daily at 9am local time, read-only
  - stale-checkpoint: Stale checkpoint watcher, Weekdays at 9am local time, read-only
  - review-queue: Review queue watcher, Daily at 10am local time, read-only
  - weekly-hygiene: Weekly hygiene report, Monday at 9am local time, read-only
  - release-readiness: Release readiness report, Manual or before release, read-only

Safety rules:
  - Do not create automations during install.
  - Create schedules, routines, background agents, or API triggers only after explicit user approval.
  - Default templates are read-only.
```

## Proposition Closeout

End with:

```text
Proposition:
  1. Implement partial: /god-automation-setup for one safe read-only template
  2. Implement complete: /god-automation-setup for all safe templates supported by the current host
  3. Discuss more: /god-discuss automation policy and provider choice
  4. Inspect status: /god-status to see project progress and automation status together
Recommended: <one option tied to the detected provider>
```

If no provider is available, recommend manual `/god-next` or
`godpowers next --project .`.
