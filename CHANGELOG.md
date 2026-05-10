# Changelog

All notable changes to Godpowers will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 0.12.0 work

Mode D (multi-repo suites), agent discipline, story-file workflow, Pi + T3
support, and routing sweep. Test suite at 1400+ passing across 22 suites.

### Added (Mode D - multi-repo suites)
- `agents/god-coordinator.md`: Tier-0 peer agent for cross-repo coordination
- `lib/suite-config.js`: Mode D suite registration + version table
- `lib/meta-linter.js`: cross-repo lint for byte-identical files
- `skills/god-suite-init.md`: register siblings + shared standards
- `skills/god-suite-status.md`: side-by-side repo status
- `skills/god-suite-sync.md`: byte-identical file propagation
- `skills/god-suite-patch.md`: coordinated multi-repo change
- `skills/god-suite-release.md`: release coordination across siblings
- `references/shared/multi-repo-suite-layout.md`

### Added (agent discipline - phase 17)
- `lib/agent-validator.js`: validates every agents/*.md against the agent
  contract (frontmatter, required sections, output schema)
- `skills/god-agent-audit.md`: `/god-agent-audit` runs the validator

### Added (story-file workflow - phase 18)
- `lib/story-validator.js`: parses + validates STORY.md files
- `agents/god-storyteller.md`: STORY.md writer
- `skills/god-story.md`: write a new story
- `skills/god-stories.md`: list stories by status
- `skills/god-story-build.md`: implement a story
- `skills/god-story-verify.md`: run acceptance criteria as headless tests
- `skills/god-story-close.md`: close after build + verify

### Added (runtime support)
- Pi (earendil-works/pi) support in installer (`--pi` flag, ~/.pi/skills/)
- T3 Code (pingdotgg/t3code) transparent support via underlying agent
- Cross-tool Agent Skills standard at .agents/skills/

### Added (brownfield depth)
- `agents/god-archaeologist.md`: deep code archaeology
- `agents/god-reconstructor.md`: reverse-engineer planning artifacts
- `agents/god-reconciler.md`: cross-artifact reconciliation
- `agents/god-debt-assessor.md`: technical-debt scorer
- `skills/god-archaeology.md`, `god-reconstruct.md`, `god-reconcile.md`,
  `god-tech-debt.md`

### Changed (routing sweep + integration)
- Phase 13: routing sweep + beyond-arc skill linkage participation
- Phase 14: documentation surface for runtime / linkage / design
- Phase 15: runtime heuristic improvements (parseFlow verb coverage)
- Audit-driven fixes: closed 4 misconnections + disconnections between
  beyond-arc workflows and linkage / reverse-sync

### Documentation
- `INSPIRATION.md`: single canonical acknowledgement of prior-art
- Doc deck refreshed to current state (82 skills, 38 agents, v0.11+)

### Tests
- 22 test suites, 1400+ passing (was 18 suites, 1235 at 0.11.0)

## [0.11.0] - 2026-05-10

Major release. Production-ready validation, full design pipeline, and
runtime verification. 18 commits since 0.4.0; full test suite at 1235
passing across 18 suites.

### Added (validation foundation)
- `lib/have-nots-validator.js`: 11 mechanical have-nots checks (em/en
  dash, emoji, unlabeled paragraphs, phantom references, future dates,
  generic claims, PRD/ARCH structure violations)
- `lib/artifact-linter.js`: per-artifact orchestrator with detectType,
  lintFile, lintAll, formatReport, aggregate
- `lib/artifact-diff.js`: regression detection between artifact versions
- `skills/god-lint.md`: `/god-lint` mechanical validation
- `references/HAVE-NOTS.md` integrated into linter

### Added (exemplars and antipatterns parity)
- `examples/saas-mrr-tracker/` complete UI project (PRD/ARCH/ROADMAP/STACK/DESIGN)
- `examples/cli-tool/` backend-only project (PRD/ARCH/ROADMAP/STACK)
- `references/planning/ROADMAP-ANTIPATTERNS.md`
- `references/planning/STACK-ANTIPATTERNS.md`
- `references/building/BUILD-ANTIPATTERNS.md`
- `references/shipping/{DEPLOY,OBSERVE,HARDEN,LAUNCH}-ANTIPATTERNS.md`
- `references/design/{DESIGN-ANATOMY,DESIGN-ANTIPATTERNS}.md`

### Added (design foundation - integrations)
- `lib/design-detector.js`: UI presence detection across 24+ frameworks
- `lib/design-spec.js`: Google Labs design.md parser + linter (frontmatter
  schema, section order, token resolution, WCAG contrast)
- `lib/impeccable-bridge.js`: detect-and-delegate to Impeccable's 23 commands
- `lib/awesome-design.js`: 71-site catalog from VoltAgent's awesome-design-md
- `lib/skillui-bridge.js`: SkillUI fallback for sites not in catalog
- `agents/god-designer.md`: lifecycle owner of DESIGN.md + PRODUCT.md
- `agents/god-design-reviewer.md`: two-stage gate (spec + quality)
- `skills/god-design.md`: 26 subcommands bridging impeccable + catalog + skillui
- `routing/god-design.yaml`
- `templates/DESIGN.md`

### Added (linkage + propagation)
- `lib/linkage.js`: bidirectional artifact-to-code map with 7 stable ID types
  (P-MUST/SHOULD/COULD-NN, ADR-NNN, C-{slug}, M-{slug}, S-{slug}, token paths, D-{slug})
- `lib/code-scanner.js`: 6 discovery mechanisms (annotations, filenames,
  imports, style-system, test descriptions, manual)
- `lib/drift-detector.js`: design token drift, stack version drift, ARCH
  container drift
- `lib/impact.js`: forward propagation (artifact change -> affected code)
- `lib/cross-artifact-impact.js`: 6 rule classes for artifact-to-artifact impact
- `lib/review-required.js`: REVIEW-REQUIRED.md + REJECTED.md managers
- `lib/reverse-sync.js`: code -> artifact fenced footer appender
  (PRD/ARCH/ROADMAP/STACK/DESIGN)
- `skills/god-design-impact.md`: what-if analysis
- `skills/god-review-changes.md`: walk REVIEW-REQUIRED.md
- `skills/god-scan.md`: manual reverse-sync
- `skills/god-link.md`: manual link entry

### Added (runtime verification - headless)
- `lib/browser-bridge.js`: headless-only browser launch (cascade:
  agent-browser preferred, Playwright fallback)
- `lib/agent-browser-driver.js`: vercel-labs/agent-browser CLI wrapper
- `lib/runtime-audit.js`: design verification on rendered DOM (computed
  styles vs DESIGN.md tokens, real-DOM WCAG contrast)
- `lib/runtime-test.js`: PRD acceptance criteria as user-flow assertions
- `agents/god-browser-tester.md`
- `skills/god-test-runtime.md`

### Added (light-impeccable - 7 design domain references)
- `references/design/TYPOGRAPHY.md` (~140 lines)
- `references/design/COLOR.md` (~145 lines)
- `references/design/SPATIAL.md` (~110 lines)
- `references/design/MOTION.md` (~120 lines)
- `references/design/INTERACTION.md` (~150 lines)
- `references/design/RESPONSIVE.md` (~125 lines)
- `references/design/UX-WRITING.md` (~130 lines)

### Added (ai-tool context)
- `lib/context-writer.js`: AGENTS.md / CLAUDE.md / GEMINI.md / .cursor/ /
  .windsurf/ / others fenced section manager (11 AI tools detected)
- `agents/god-context-writer.md`
- `skills/god-context.md`

### Added (front-door)
- `skills/god.md`: free-text intent matcher

### Changed
- `god-orchestrator.md`: extended Quarterback responsibilities;
  detection-driven Tier 1 routing; mid-arc DESIGN/PRODUCT change
  detection; extended critical-finding gate (drift, lint errors,
  design-review BLOCK, validator errors); explicit YOLO behavior table
- `god-updater.md`: now calls reverse-sync.run on /god-sync
- `lib/state.js`: schema additions (tier-1.design, tier-1.product,
  linkage slot, yolo-decisions array)

### Documentation
- `docs/change-propagation.md`: forward + reverse + cross-artifact propagation
- `docs/linkage.md`: stable IDs, 6 discovery mechanisms, drift detection
- `.planning/2026-05-10-production-ready-and-design.md`: comprehensive plan
- `.planning/dogfood-001-results.md`: end-to-end validation results

### Tests
- 18 test suites, 1235 passing, 0 failing (was 4 suites, ~360 tests at 0.4.0)
- All new tests behavioral, not just structural

### External integrations (5; all detect-and-delegate, none vendored)
- Google Labs design.md (format spec)
- Impeccable (design intelligence; 7 domain refs + 23 commands + 27 anti-patterns)
- VoltAgent awesome-design-md (71-site curated catalog)
- SkillUI (static analysis fallback for arbitrary URLs)
- vercel-labs/agent-browser + Playwright (runtime verification backends)

## [0.4.0] - 2026-05-09

### Added
- **god-mode lifecycle awareness**:
  - god-orchestrator now has explicit Post-Launch Transition phase
  - After `/god-mode` (full-arc), project enters STEADY STATE
  - Steady-state hand-off message lists all 11 ongoing workflows
  - New flag `/god-mode --with-hygiene` runs audit + deps + docs verification
  - `/god-mode --yolo --with-hygiene` enables autonomous hygiene (still pauses on Critical CVEs)
- **2 new lifecycle slash commands**:
  - `/god-hygiene`: composite health check (audit + deps + docs)
  - `/god-lifecycle`: shows project phase and contextually appropriate workflows
- **v0.5 scaffolding**:
  - `schema/intent.v1.yaml.json`: JSON Schema for godpowers.yaml (intent)
  - `schema/state.v1.json`: JSON Schema for state.json (facts)
  - `schema/events.v1.json`: OpenTelemetry-shape event vocabulary
  - `lib/README.md`: planned runtime modules with target versions
  - `docs/RFC/0002-workflow-yaml-v1.md`: workflow language design
- **Distribution prep**:
  - `.npmignore` excludes dev files from npm package
  - `package.json` repository, homepage, bugs fields populated
  - `scripts/release.sh`: tag + publish flow with verification
- **First-party extension scaffold**:
  - `extensions/security-pack/manifest.yaml`
  - `extensions/security-pack/agents/god-soc2-auditor.md`
  - `extensions/security-pack/skills/god-soc2-audit.md`
  - `extensions/security-pack/README.md`
  - Demonstrates extension shape for v0.8 implementation
- **Integration test scaffold**:
  - `tests/README.md`: three-layer test strategy
  - `tests/integration/README.md`: planned end-to-end tests with record/replay
  - Fixture project layout designed for v0.5 implementation

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
  (15 total)
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
