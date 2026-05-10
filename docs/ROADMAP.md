# Godpowers Implementation Roadmap

> Status: ACTIVE
> Model: Pure-skill (slash commands inside the AI tool). CLI is install-only.
> Last updated: 2026-05-10
> Current shipped: v0.11.0

This roadmap tracks releases, what's shipped, and what remains before v1.0.
Each release is independently shippable. Everything new is delivered as
slash commands.

---

## Shipped releases

### v0.11.0 (current) - Production validation + design pipeline + runtime verification

What works today:
- **82 slash commands** as thin orchestrators (front door, lifecycle, planning,
  building, shipping, design, runtime, linkage, story-file, suite, recovery,
  observability, capture, knowledge, process, configuration, utility)
- **38 specialist agents** in fresh contexts
- **15-runtime installer**: Claude, Codex, Cursor, Windsurf, Gemini, OpenCode,
  Copilot, Augment, Trae, Cline, Kilo, Antigravity, Qwen, CodeBuddy, Pi
  (with T3 Code transparently inheriting the underlying agent)
- **Mode A** (greenfield), **Mode B** (gap-fill), **Mode C** (audit),
  **Mode D** (multi-repo suites with `god-coordinator` as Tier-0 peer)
- **Three-axis verification**: static (lint), linkage (drift), runtime (headless browser)
- **Bidirectional linkage map** with 8 stable ID types
- **Reverse-sync** writing fenced "Implementation Linkage" footers
- **Conditional design pipeline**: DESIGN.md + PRODUCT.md with two-stage review
- **Five external integrations** (detect-and-delegate, none vendored): Google Labs
  design.md, Impeccable, awesome-design-md, SkillUI, vercel-labs/agent-browser + Playwright
- **Light-impeccable internal references** (7 design domain refs)
- **Story-file workflow** as a finer slice between feature and commit
- **Agent contract validation** via `lib/agent-validator.js` and `/god-agent-audit`
- **AI-tool context writer** maintaining fenced sections in AGENTS.md / CLAUDE.md /
  GEMINI.md and 11 other tool-specific paths
- 22 test suites, 1400+ passing

See [CHANGELOG.md](../CHANGELOG.md) for full release history.

---

## Remaining toward v1.0

### v0.12.0 - Distribution

**Theme**: shippable to npm with release engineering.

- `npm publish godpowers` (the installer + core)
- Conventional commits + semantic-release on main
- GitHub Release automation with auto-changelog
- npm install verification: `npm test --integration`
- Telemetry: opt-in, off-by-default

### v0.13.0 - Skill Pack Ecosystem (full)

**Theme**: third-party extensions with strict contracts.

The scaffolds exist in `extensions/`; v0.13 ships the runtime:

- `/god-extension-add @x/y` (install pack from npm)
- `/god-extension-list`
- `/god-extension-info @x/y`
- `/god-extension-remove @x/y`
- Lazy activation: pack files don't load until their skill is invoked
- Capability handshake: install fails on godpowers version mismatch
- `/god-test-extension <path>` contract tests
- First-party packs published:
  - `@godpowers/security-pack` (SOC2, HIPAA, PCI auditors)
  - `@godpowers/launch-pack` (Show HN, Product Hunt, Indie strategists)
  - `@godpowers/data-pack` (ETL, ML features, dashboards)

### v0.14.0 - Workflow Runtime

**Theme**: workflows are declarative, runnable, testable, with plan-then-apply.

Workflow YAMLs already exist at `workflows/`; v0.14 makes them executable:

- `schema/workflow.v1.json` finalized
- `--plan` flag on `/god-mode` and tier commands
- Plan output written to `.godpowers/runs/<id>/plan.yaml`
- Custom workflows authorable at `.godpowers/workflows/`

### v0.15.0 - Observability

**Theme**: see what happened, performant or not.

- `/god-logs [<run-id>]` (events.jsonl as readable timeline)
- `/god-metrics` (per-tier stats: duration, pauses, retries)
- `/god-trace <tier>` (deep dive on one tier's events)
- Optional OTel exporter
- Cost tracking per run

### v1.0.0 - Stable

**Theme**: freeze the public API.

- All v0.x to v1.0 migrations work seamlessly
- All schemas frozen (`v1` is stable)
- Real integration test suite (record/replay layer)
- Documentation site at godpowers.dev
- Examples directory with 5+ fixture projects
- 1.0 release notes
- npm publish marker tags

### Acceptance for v1.0

- Migration from any v0.x project to v1.0 is one command
- Schemas have stability guarantees: no breaking changes within v1.x
- Pack authors have stable APIs to build against
- Integration tests cover full-arc + audit-only + build-only against fixtures

---

## Post-1.0

| Idea | Status |
|------|--------|
| Subprocess plugins (any language) | RFC-0008 |
| Workflow visualization (DAG renderer) | Slash command renders ASCII |
| LLM cost optimization (model routing) | Research |
| Cross-organization pack marketplace | Post-1.0 |
| Native binary distribution (not just npm) | If demand exists |

---

## CLI surface (stable)

The CLI stays minimal. Only these CLI commands exist:

```bash
npx godpowers                    # Interactive install (defaults to claude --global)
npx godpowers --claude --global  # Install for specific runtime
npx godpowers --all              # Install for all 15 runtimes
npx godpowers --uninstall        # Remove
npx godpowers --migrate          # One-shot upgrade
npx godpowers --help             # Show install help
```

All other operations are slash commands inside the AI tool.

---

## What each remaining release does NOT do

| Version | Explicit non-goals |
|---------|-------------------|
| v0.12 | No new features (release engineering only) |
| v0.13 | No core changes (extension runtime only) |
| v0.14 | No new tier commands (workflow YAML layer only) |
| v0.15 | No event-schema changes (events.jsonl format frozen at v0.11) |
| v1.0 | No new features (stabilization only) |
| All | NO `godpowers` CLI binary beyond install. Slash commands only. |

Discipline: a release that does too much is a release that ships late.
