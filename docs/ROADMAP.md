# Godpowers Implementation Roadmap

> Status: ACTIVE
> Model: Pure-skill (slash commands inside the AI tool). CLI is install-only.
> Last updated: 2026-05-11
> Current shipped: v0.15.0

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

### v0.13.0 (shipped 2026-05-10) - Context-rot protection + extensions + observability

Shipped earlier-than-roadmapped and combined:

- **Context-rot protection** (new): `lib/checkpoint.js`,
  `.godpowers/CHECKPOINT.md`, `/god-locate`, `/god-context-scan`,
  events.jsonl hash chain, SessionStart hook prefers CHECKPOINT
- **Extension runtime**: `lib/extensions.js`, schema/extension-manifest.v1.json,
  `/god-extension-add/list/info/remove`, `/god-test-extension`,
  SemVer capability handshake. Scaffolds in `extensions/` are now
  installable. Pack publishing to npm is part of v0.14 distribution.
- **Observability readers**: `lib/event-reader.js`, `/god-logs`,
  `/god-metrics`, `/god-trace`. OTel exporter + cost tracking remain
  for v0.14 / v0.15.

### v0.14.0 (shipped 2026-05-11) - Workflow runtime + cost saver + locks + CI

Shipped:

- **Workflow runtime**: `lib/workflow-runner.js` reads
  `workflows/*.yaml` and computes dependency-ordered plans. All 13
  workflow YAMLs are now authoritative (no longer documentation-only).
  `/god-mode --workflow=<name>` and `--plan` flags added.
- **Lock + checkpoint wiring**: `lib/state-lock.js` (acquire / release /
  reclaim / withLock), `lib/checkpoint.syncFromState` (per-sub-step
  pin refresh). Orchestrator agent wired to acquire-mutate-release
  and refresh CHECKPOINT.md on every sub-step.
- **Token cost saver**: `lib/cost-tracker.js` + `lib/agent-cache.js` +
  `lib/context-budget.js` + `lib/budget.js`. New skills: `/god-cost`,
  `/god-budget` (+ `--on` / `--off` one-shot toggles), `/god-cache-
  clear`. Schema `intent.v1.yaml.json` gains a `budgets` block.
- **GitHub Actions CI**: matrix on Node 18/20/22; full test suite on
  every PR + main push. Separate package job verifies npm pack
  cleanliness.
- **npm publish prep**: `files` array fixed (routing/, workflows/,
  extensions/, INSPIRATION.md were missing); `prepublishOnly` runs
  the full test suite before any publish. Tarball: 364KB / 439 files.

### v0.15.0 (shipped 2026-05-11) - Distribution + OTel + first-party packs

`godpowers@0.15.0` is live on npm with sigstore provenance:
https://www.npmjs.com/package/godpowers

- **`npm install -g godpowers`** or `npx godpowers --claude --global`
  now works against the public registry (no git clone needed)
- **Tag-triggered publish workflow**: `.github/workflows/publish.yml`
  runs the full test suite then `npm publish --provenance --access
  public` on every `v*` tag push. Version bumps are manual
  (`npm version minor`), CHANGELOG is human-curated.
- **First-party packs are publish-ready** but the `@godpowers` npm org
  must be created before they can ship. Once the org exists, three
  workflow_dispatch runs publish all three packs at `0.1.0`.
- **OTel exporter** for events.jsonl: `lib/otel-exporter.js` plus the
  `/god-export-otel` skill. Maps workflow.run + agent.start/end to
  OTLP spans; cost.recorded / gate.fail / error attach as span events.
  Honors `OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS`
  (for Honeycomb / Datadog auth). No external deps.
- **Cost-tracker live integration**: `cost.recorded` events now carry
  `source: 'live' | 'estimated'`. New `recordModelCall(handle, attrs)`
  is the canonical entry point for AI tools surfacing real per-call
  token counts. `/god-cost --strict` exits non-zero if any in-scope
  record is estimated (CI gate once live reporting is wired).
- **First-party packs publishable**:
  - `@godpowers/security-pack` (SOC2, HIPAA, PCI auditors)
  - `@godpowers/launch-pack` (Show HN, Product Hunt, Indie strategists)
  - `@godpowers/data-pack` (ETL, ML features, dashboards)

  Each pack ships its own `package.json` with `publishConfig.access=public`
  and `peerDependencies.godpowers`. The
  `.github/workflows/publish-pack.yml` workflow_dispatch action
  publishes a single pack after a version bump.

Deferred to a later release:

- **Telemetry: opt-in, off-by-default** - separate trust/privacy design
  pass; what questions we want to answer with the data should precede
  the wire format.

### v0.16.0 - Real-world hardening (next)

The 0.15 line shipped distribution. 0.16 is about depth: harden what
ships, expand examples, design telemetry intentionally, stand up the
docs site. Work, ordered by readiness:

- **Record/replay integration tests**. Capture a greenfield `/god-mode`
  run end-to-end as a fixture, then replay it to validate that the
  orchestrator behaves the same across model versions. The remaining
  v1.0 testing gate.
- **Examples directory expansion**. Add 3+ fixture projects (today:
  `saas-mrr-tracker`, `cli-tool`). Targets: a brownfield-arc fixture,
  a Mode D suite fixture, a refactor-arc fixture.
- **Telemetry opt-in design pass**. Decide first what questions we
  want answered (skill usage frequency, cache hit rate distribution,
  agent pause reasons), then ship the wire.
- **Documentation site at godpowers.dev**. Built from `docs/`.

### v1.0.0 - Stable

**Theme**: freeze the public API.

Remaining work before tag:

- [x] npm publish marker tag (v0.15.0, with sigstore provenance)
- [ ] Record/replay integration test suite (full-arc, audit-only,
      build-only against fixtures)
- [ ] Documentation site at godpowers.dev
- [ ] Examples directory with 5+ fixture projects
- [ ] Migration path from any v0.x project (one command)
- [ ] Schema stability guarantees (intent.yaml v1, state.json v1,
      manifest YAML v1, agent frontmatter v1, skill frontmatter v1,
      events.jsonl vocabulary v1)
- [ ] Pack author public API documented + tested
- [ ] 1.0 release notes

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
