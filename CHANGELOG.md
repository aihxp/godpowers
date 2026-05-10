# Changelog

All notable changes to Godpowers will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-05-09

### Added
- **8 new workflow slash commands** for real-world scenarios beyond greenfield:
  - `/god-feature`: Add a feature to an existing project
  - `/god-hotfix`: Urgent production bug fix (skips planning, expedited deploy)
  - `/god-refactor`: Safe refactor with strict TDD (no behavior change)
  - `/god-spike`: Time-boxed research with throwaway POC
  - `/god-postmortem`: Post-incident investigation (root cause + class-of-bug)
  - `/god-upgrade`: Framework/version migration (expand-contract pattern)
  - `/god-docs`: Write/update docs verified against code
  - `/god-update-deps`: CVE-aware incremental dependency updates
- **5 new specialist agents**:
  - `god-incident-investigator`: Postmortems with action items + runbook updates
  - `god-spike-runner`: Time-boxed POC with honest findings
  - `god-migration-strategist`: Incremental migrations with rollback per slice
  - `god-docs-writer`: No-lying docs verified against code
  - `god-deps-auditor`: CVE-aware dependency updates with bisect-able commits
- **5 new templates** for workflow artifacts:
  - `templates/POSTMORTEM.md`
  - `templates/SPIKE.md`
  - `templates/MIGRATION.md`
  - `templates/DOCS-UPDATE-LOG.md`
  - `templates/DEPS-AUDIT.md`
- **HAVE-NOTS.md catalog extended** with new failure modes for each new
  artifact type (PM-01..PM-08, SP-01..SP-05, MG-01..MG-07, DC-01..DC-05,
  DP-01..DP-06)
- **Architecture design documents**:
  - `ARCHITECTURE.md`: 16-section canonical design for v1.0 (pure-skill model)
  - `docs/RFC/0000-research-brief.md`: Synthesized research informing the design
  - `docs/RFC/0001-state-model-v1.md`: First detailed RFC
  - `docs/ROADMAP.md`: v0.4 -> v1.0 implementation plan

### Changed
- `package.json` bumped to 0.4.0 (was stuck on 0.3.0 despite v0.4 work)
- `install.js` VERSION constant bumped to 0.4.0
- `/god-next` routing extended to suggest workflows based on user intent
  (feature add, hotfix, refactor, etc.) when project is in steady state
- README "Other Workflows" section added to command table
- SessionStart hook updated to suggest new workflows for ambient discovery
- Smoke test PAIRS extended to verify 8 new skill-to-agent routings
- Each new agent references its template for structural starting point

### Architecture decisions (documented, not yet implemented)
- v0.5+ will introduce three load-bearing artifacts: intent.yaml + state.json
  + events.jsonl
- v0.6 will add forward-only recovery (`/god-undo`, `/god-rollback`)
- v0.7 will add OTel-shape observability
- v0.8 will add the skill pack ecosystem
- v1.0 will freeze schemas

## [0.3.0] - 2026-05-09

### Added
- **Critical fixes**:
  - Installer now copies `references/` directory (HAVE-NOTS catalog and
    per-tier reference content) so agents can find it in production
  - `--uninstall` flag now actually removes Godpowers from the target runtime
  - Install verification message lists how many commands and agents were
    installed and shows exact next steps
  - Templates explicitly referenced from each tier agent (god-pm references
    PRD.md, god-architect references ARCH.md, etc.)
- **Mode B (gap-fill) implementation**:
  - god-orchestrator now scans existing artifacts on disk
  - Detects which tiers have passing artifacts and skips them
  - Uses codebase signals (package.json, CI configs, test dirs) to detect
    partial progress
- **Documentation**:
  - CHANGELOG.md (this file)
  - CONTRIBUTING.md
  - SECURITY.md
  - Per-tier reference subdirectories with placeholder content

### Changed
- `package.json` version bumped from 0.1.0 to 0.3.0 (was stuck on first commit)
- Mode D (multi-repo) downgraded from "supported" to "future work" until real
  implementation lands
- Smoke test em/en-dash check rewritten to use Python instead of buggy bash
  byte-class regex (false-positives on UTF-8 multi-byte chars starting with 0xE2)
- `/god-init` skill now spawns god-orchestrator for mode/scale detection
  instead of duplicating the logic
- `/god-audit` skill now explicitly spawns god-auditor agent

### Fixed
- Smoke test no longer false-positives on block characters or other Unicode
  starting with 0xE2

## [0.2.1] - 2026-05-09

### Added
- Build phase orchestration explicit in god-orchestrator (4-agent chain per
  slice: god-planner -> god-executor -> god-spec-reviewer -> god-quality-reviewer)
- `--yolo` flag flows through to specialist agents with documented defaults
- Critical-finding carve-out: god-harden-auditor never auto-resolves Critical
  findings even with `--yolo`
- 13 routing checks, 1 build-phase check, 6 YOLO handling checks, 1 carve-out
  check added to smoke test

### Fixed
- /god-mode could stall on Build phase (orchestrator didn't reference reviewers)
- /god-mode --yolo could pause at specialist agent pause conditions
  (specialists didn't know about --yolo)

## [0.2.0] - 2026-05-09

### Added
- 6 artifact templates in `templates/` (PRD, ARCH, ROADMAP, STACK, PROGRESS,
  HARDEN-FINDINGS) with embedded have-nots checklists
- `references/HAVE-NOTS.md` consolidated catalog with 115 named failure modes
- 7 new runtimes in installer: Trae, Cline, Kilo, Antigravity, Qwen, CodeBuddy, Pi
  (15 total, matching GSD parity)
- 9 new slash commands:
  - `/god-fast` - trivial inline edits
  - `/god-quick` - TDD-discipline tasks below /god-build threshold
  - `/god-explore` - Socratic ideation pre-init
  - `/god-pause-work` - context handoff
  - `/god-resume-work` - context restoration
  - `/god-workstream` - parallel workspace management
  - `/god-sprint` - sprint plan/status/retro
  - `/god-party` - real multi-persona collaboration
  - `/god-build-agent` - custom specialist agent generator
- 2 new agents: `god-explorer`, `god-retrospective`
- Mode A/B/C/D detection logic in god-orchestrator
- Scale detection (trivial/small/medium/large/enterprise)
- YOLO-DECISIONS.md emission for `--yolo` runs
- `hooks/pre-tool-use.sh` safety hook

## [0.1.0] - 2026-05-09

### Added
- Initial release
- 17 slash commands (skills/) as thin orchestrators
- 16 specialist agents (agents/) in fresh contexts
- SessionStart hook
- Installer for 8 AI coding tool runtimes
- Smoke test and skill validation infrastructure
- README, AGENTS.md, LICENSE
