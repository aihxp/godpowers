# Godpowers Reference

Complete command, agent, and artifact reference.

## Slash commands (60+)

### Lifecycle
- `/god-init` - Initialize project
- `/god-mode` - Run full autonomous arc
- `/god-status` - Re-derive state from disk
- `/god-next` - Suggest next command based on state
- `/god-help` - Discoverable contextual help
- `/god-doctor` - Diagnose install + state, suggest fixes
- `/god-version` - Print version
- `/god-lifecycle` - Show project phase

### Planning tier
- `/god-prd` - Write PRD
- `/god-arch` - Design architecture
- `/god-roadmap` - Sequence work
- `/god-stack` - Pick tech stack
- `/god-discuss` - Pre-planning Socratic discussion
- `/god-list-assumptions` - Surface assumptions before they cement
- `/god-explore` - Open-ended ideation

### Building tier
- `/god-repo` - Scaffold repo
- `/god-build` - Build the milestone (TDD, waves, two-stage review)
- `/god-add-tests` - Add tests to legacy code

### Shipping tier
- `/god-deploy` - Deploy pipeline
- `/god-observe` - Observability + SLOs
- `/god-launch` - Launch (gated on harden)
- `/god-harden` - Adversarial security review

### Beyond greenfield
- `/god-feature` - Add feature to existing project
- `/god-hotfix` - Urgent production bug fix
- `/god-refactor` - Safe refactor, no behavior change
- `/god-spike` - Time-boxed research with throwaway POC
- `/god-postmortem` - Post-incident investigation
- `/god-upgrade` - Framework / version migration
- `/god-docs` - Documentation work
- `/god-update-deps` - Dependency updates

### Recovery
- `/god-undo` - Revert last operation
- `/god-redo <tier>` - Re-run a tier
- `/god-skip <tier>` - Explicit skip with audit
- `/god-repair` - Fix detected drift
- `/god-rollback <tier>` - Walk back tier + downstream
- `/god-restore` - Recover from .trash

### Observability
- `/god-logs [run-id]` - Events as readable timeline
- `/god-metrics` - Per-tier stats
- `/god-trace <tier>` - Deep dive on a tier
- `/god-audit` - Score artifacts against have-nots
- `/god-hygiene` - Composite health check
- `/god-graph` - Project knowledge graph

### Capture
- `/god-add-todo` - Capture as todo with priority
- `/god-check-todos` - List and route
- `/god-note` - Zero-friction capture
- `/god-add-backlog` - Add to long-term backlog
- `/god-plant-seed` - Forward-looking idea with trigger condition

### Knowledge
- `/god-map-codebase` - Parallel codebase analysis
- `/god-intel` - Query/refresh codebase intel
- `/god-thread` - Persistent context threads
- `/god-extract-learnings` - Capture decisions / lessons / patterns

### Process / Team
- `/god-sprint` - Sprint plan / status / retro
- `/god-party` - Multi-persona collaboration
- `/god-pause-work` - Save context handoff
- `/god-resume-work` - Restore from handoff
- `/god-workstream` - Parallel workspace management

### Configuration
- `/god-settings` - View/modify intent.yaml settings
- `/god-set-profile` - Switch model profile

### Utility
- `/god-fast` - Trivial inline edit
- `/god-quick` - Small task with TDD
- `/god-debug` - 4-phase systematic debug
- `/god-review` - Two-stage code review
- `/god-pr-branch` - Clean PR branch (filter .godpowers/ commits)
- `/god-build-agent` - Generate custom specialist agent
- `/god-smite` - Delete node_modules, reinstall

### Extensions (v0.8+)
- `/god-extension-add @x/y` - Install skill pack
- `/god-extension-list` - Show installed packs
- `/god-extension-remove @x/y` - Uninstall pack
- `/god-extension-info @x/y` - Show pack details
- `/god-test-extension <path>` - Run plugin contract tests

### From @godpowers/security-pack
- `/god-soc2-audit` - SOC 2 Common Criteria audit
- `/god-hipaa-audit` - HIPAA Security Rule audit
- `/god-pci-audit` - PCI-DSS 4.0 audit

### From @godpowers/launch-pack
- `/god-show-hn` - Show HN launch plan
- `/god-product-hunt` - Product Hunt launch plan
- `/god-indie-hackers` - Indie Hackers post
- `/god-oss-release` - Open source library release

### From @godpowers/data-pack
- `/god-etl` - ETL pipeline build
- `/god-ml-feature` - ML feature with consistency + drift
- `/god-dashboard` - Dashboard with question-per-chart

## Specialist agents (33)

### Core orchestration
- god-orchestrator - Autonomous arc runner

### Planning agents
- god-pm - PRD writer
- god-architect - System designer
- god-roadmapper - Work sequencer
- god-stack-selector - Tech picker
- god-explorer - Pre-init Socratic ideator

### Building agents
- god-repo-scaffolder - Repo bootstrap
- god-planner - Build slice planner
- god-executor - TDD-enforced implementer
- god-spec-reviewer - Stage 1 review
- god-quality-reviewer - Stage 2 review

### Shipping agents
- god-deploy-engineer - Deploy pipeline
- god-observability-engineer - SLOs + runbooks
- god-launch-strategist - Launch copy
- god-harden-auditor - OWASP walker
- god-incident-investigator - Postmortems

### Workflow specialists
- god-spike-runner - Time-boxed POC builder
- god-migration-strategist - Expand-contract migrations
- god-docs-writer - No-lying docs
- god-deps-auditor - CVE-aware dep updates
- god-debugger - 4-phase systematic debug

### Meta
- god-auditor - Have-nots scorer
- god-retrospective - Sprint retrospectives

### From extensions
- god-soc2-auditor, god-hipaa-auditor, god-pci-auditor (security-pack)
- god-show-hn-strategist, god-product-hunt-strategist, god-indie-hackers-strategist, god-oss-release-strategist (launch-pack)
- god-etl-engineer, god-ml-feature-engineer, god-dashboard-builder (data-pack)

## Artifact paths

```
.godpowers/
  PROGRESS.md              Tier status (legacy view, v0.4)
  intent.yaml              Project intent (v0.5+)
  state.json               Project state (v0.5+)

  prd/PRD.md               Product Requirements
  arch/ARCH.md             Architecture
  arch/adr/                ADRs
  roadmap/ROADMAP.md       Sequenced work
  stack/DECISION.md        Tech decisions
  repo/AUDIT.md            Repo scaffold audit
  build/PLAN.md            Build slices
  build/STATE.md           Build progress
  deploy/STATE.md          Deploy pipeline
  observe/STATE.md         Observability
  launch/STATE.md          Launch artifacts
  harden/FINDINGS.md       Security findings

  postmortems/<id>/POSTMORTEM.md
  spikes/<slug>/SPIKE.md
  migrations/<slug>/MIGRATION.md
  features/<slug>/PRD.md
  
  todos/TODOS.md
  notes/NOTES.md
  backlog/BACKLOG.md
  seeds/<id>.md
  threads/<name>.md
  
  runs/<id>/events.jsonl   Per-run event log (v0.5+)
  log                      Reflog (v0.6+)
  .trash/                  Recoverable deletions (v0.6+)
  
  YOLO-DECISIONS.md        Auto-decisions log
  HANDOFF.md               Pause/resume context
  AUDIT-REPORT.md          /god-audit output
  HYGIENE-REPORT.md        /god-hygiene composite
```

## CLI

Install-only. Everything else is slash commands.

```
npx godpowers --claude --global    Install for Claude Code
npx godpowers --all                Install for all 15 runtimes
npx godpowers --uninstall          Remove
npx godpowers --migrate            v0.3 -> v0.4 upgrade
npx godpowers --help               Help
```

## Schemas

JSON Schema files at `schema/`:
- `intent.v1.yaml.json` - intent.yaml structure
- `state.v1.json` - state.json structure
- `events.v1.json` - events.jsonl event vocabulary
- `workflow.v1.json` - workflow YAML structure

## See also

- [Getting Started](getting-started.md)
- [Concepts](concepts.md)
- [Have-Nots Catalog](../references/HAVE-NOTS.md)
- [Architecture](../ARCHITECTURE.md)
- [Roadmap](ROADMAP.md)
