# Host Capabilities

## Purpose

- [DECISION] Godpowers reports runtime guarantees instead of assuming every AI
  host can spawn agents, run shell commands, or use release tooling.
- [DECISION] Host capability status appears in the dashboard action brief and
  proactive checks.
- [DECISION] Capability gaps are actionable release and workflow signals, not
  hidden implementation details.

## Levels

- [DECISION] `full` means shell, git, npm, and fresh-context Godpowers agent
  metadata are detected.
- [DECISION] `degraded` means shell, git, and npm are detected, but true
  fresh-context agent spawning is not detected.
- [DECISION] `unknown` means one or more baseline runtime capabilities could
  not be confirmed.

## Detected Surfaces

- [DECISION] `lib/host-capabilities.js` detects host identity from environment
  signals.
- [DECISION] It detects Codex agent metadata at
  `~/.codex/agents/god-orchestrator.toml`.
- [DECISION] It detects Claude agent metadata at
  `~/.claude/agents/god-orchestrator.md`.
- [DECISION] It checks local availability of `git`, `npm`, and `gh` without
  requiring network access.
- [DECISION] It reports extension authoring and suite release dry-run support
  from shipped runtime files.

## Dashboard Behavior

```text
Action brief:
  Next: /god-prd
  Why: PRD is the next planning gate.
  Readiness: needs attention
  Attention: Host: degraded on codex, fresh-context agent spawn not detected
  Host guarantees: degraded on codex, fresh-context agent spawn not detected
```

- [DECISION] Full host guarantees do not block the action brief.
- [DECISION] Degraded or unknown host guarantees appear as attention items.
- [DECISION] The compact dashboard mode includes host guarantees so compressed
  output still tells the truth about autonomy.

## Tests

```bash
node scripts/test-host-capabilities.js
node scripts/test-dashboard.js
```
