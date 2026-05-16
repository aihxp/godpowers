# Automation Providers

Godpowers supports host-native automation surfaces when the user explicitly
chooses them. The installer only installs support files. It does not create
schedules, routines, background agents, API triggers, CI workflows, commits,
pushes, releases, npm publishes, deployments, or provider-dashboard checks.

## Provider Classes

| Class | Providers | Behavior |
|-------|-----------|----------|
| native-scheduler | Codex App, Claude Routines, Cline schedules, Kilo scheduled triggers | Durable schedules owned by the host platform |
| session-scheduler | Qwen Code `/loop` | Recurs while the current session is alive |
| background-agent | Cursor Background Agents, GitHub Copilot cloud agent | Async branch or PR work in a managed environment |
| scriptable-headless | Gemini CLI, OpenCode, CodeBuddy SDK, Pi SDK | Can be run by an approved external scheduler |
| manual-workflow | Windsurf workflows, Augment subagents | Reusable workflow or agent surface, not durable scheduling |
| unknown | Trae, Antigravity scheduled automation | Report capability as unknown until the host proves support |

## Commands

Use these slash commands inside an AI coding tool:

```text
/god-automation-status
/god-automation-setup
```

Use these CLI helpers from a shell, CI, or host runtime:

```bash
godpowers automation-status --project .
godpowers automation-setup --project .
godpowers automation-status --project . --json
```

The CLI commands do not call an LLM and do not create host automations. They
return deterministic provider and setup-plan data that Claude, Codex, Cursor,
CI, or another host can consume.

Inside an AI host, `/god-automation-setup` may use the host's native tool
calling after explicit approval. Simple read-only setup can use a direct host
tool or native command. Complex setup is delegated to `god-automation-engineer`
so the host-specific steps, verification, and state recording happen in a
fresh context.

## Safe Templates

The first supported templates are read-only:

- `daily-status`: summarize current phase, progress, open items, and next action
- `stale-checkpoint`: report stale or missing checkpoint state
- `review-queue`: report pending review items without clearing them
- `weekly-hygiene`: report docs, dependency, checkpoint, review, and hygiene signals
- `release-readiness`: report release readiness without publishing

## State File

Created automations should be recorded in `.godpowers/automations.json` only
after the host setup succeeds.

```json
{
  "automations": [
    {
      "id": "daily-status",
      "provider": "codex-app",
      "status": "active",
      "cadence": "daily at 9am",
      "summary": "Read-only Godpowers dashboard report",
      "createdAt": "2026-05-16T00:00:00.000Z",
      "host": "Codex App"
    }
  ]
}
```

Disk state remains authoritative. If `.godpowers/automations.json` says an
automation exists but the host no longer has it, `/god-automation-status` must
report drift and recommend repair instead of pretending the automation is live.

## Execution Contract

`lib/automation-providers.js` exposes:

- `setupPlan(projectRoot, opts)`: provider, selected templates, and execution
  path for the current host
- `renderSetupPlan(plan)`: human-readable approval plan
- `buildAutomationRecord(providerId, templateId, opts)`: state record builder
- `recordAutomation(projectRoot, record, { confirmedHostSuccess: true })`:
  state writer gated on confirmed host success

The host workflow is:

1. Render the setup plan.
2. Ask for exact approval.
3. Use direct host tool calling only when the plan says it is available.
4. Spawn `god-automation-engineer` for multi-template, write-capable,
   background-agent, scriptable-scheduler, or uncertain setup.
5. Record the automation only after the provider reports success.
6. Re-run `/god-automation-status`.

## Safety Rules

- Do not create automations during install.
- Ask before creating, updating, triggering, pausing, resuming, or deleting
  any provider-native automation.
- Ask before granting connectors, repository write access, branch-push scope,
  API trigger tokens, or dashboard access.
- Read-only templates may report state, but they must not change state.
- Write-capable automations must be branch or PR scoped by default.
- Merge, deploy, publish, release, npm publish, production launch, review
  clearing, and Critical security acceptance stay human-approved.
