# Godpowers Concepts

Four things to understand: the Quarterback, tiers, agents, and quality gates.

## The Quarterback

There is exactly one orchestrator: `god-orchestrator`. Think of it as the
quarterback. It reads the defense (mode + scale detection), calls the play
(spawns the right specialist for each tier sub-step), owns the playbook
(state.json, PROGRESS.md, intent.yaml, events.jsonl), and manages the clock
(mandatory final sync at end of arc).

Three skills sit on the sideline and read the same playbook without calling
plays:

| Skill | Role |
|-------|------|
| `/god` | Front door. Maps free-text intent to a recipe and proposes the right command. |
| `/god-next` | Pre-flight + post-flight routing. Checks prereqs and announces what's next. |
| `/god-status` | Re-derives state from disk. Reports inconsistencies. |

These skills do not own state. They read recipes (`routing/recipes/*.yaml`)
and routing definitions (`routing/*.yaml`) and propose commands. The
quarterback (and the agents it spawns) is the only writer to the load-bearing
artifacts.

We deliberately do not stack a meta-orchestrator above `god-orchestrator`.
That's the BMAD trap. If we ever need parallel cross-tier coordination, it
goes in as a peer at Tier 0 (e.g., a future `god-coordinator`), never above.

## Tiers

A development arc has 4 tiers. Each tier has sub-steps. Each sub-step has
a slash command and a specialist agent.

| Tier | Sub-steps |
|------|-----------|
| 0: Orchestration | mode detection, scale detection |
| 1: Planning | PRD, ARCH, Roadmap, Stack |
| 2: Building | Repo, Build |
| 3: Shipping | Deploy, Observe, Launch, Harden |

Each sub-step gates on the previous. You can't run /god-arch without a
passing /god-prd.

## Agents

A skill is the user-facing slash command. An agent is the specialist that
does the work. Skills are thin; agents are deep.

- `/god-prd` is a skill. It spawns `god-pm` (the agent) in a fresh context.
- `god-pm` reads PROGRESS.md and writes PRD.md.
- The agent has its own context window, instructions, and have-nots checks.
- The skill verifies the agent's output and updates state.

Why fresh contexts? It defeats context rot. Each agent gets a clean 200K
window with only what it needs. The orchestrator stays thin.

## Quality gates

Three mechanical tests applied to artifact-producing agents:

### Substitution test
Replace the product name with a competitor's. If the sentence still reads
true, it decides nothing.

Example that fails the test (rewrite):
> Our app is the future of project management.
> -> "the future of [project management|MRR tracking|task tracking]" works for any product

Example that passes the test (keep):
> Solo SaaS founders running between $1k and $10k MRR can't decompose
> revenue change between new customers and price increases.
> -> can't substitute another product without breaking the meaning

### Three-label test
Every sentence is exactly one of:
- `[DECISION]`: a grounded choice with rationale
- `[HYPOTHESIS]`: a testable assumption with validation plan
- `[OPEN QUESTION]`: an unresolved item with owner and due date

Anything unlabeled is theater. Rewrite.

### Have-nots
99 named failure modes. ~30 are mechanical (regex-checkable);
the rest are interpretive. Examples:
- P-01: Generic problem statement (passes substitution test)
- A-04: ADR without flip point
- B-01: Code before test (TDD violation)
- L-04: Silent launch (no source attribution)
- H-07: Critical finding without remediation options

The catalog: `references/HAVE-NOTS.md`.
The mechanical 30 are wired into `lib/have-nots-validator.js` and
caught by `/god-lint`.

## Three verification axes

Validation runs on three orthogonal axes:

| Axis | Catches | Speed |
|---|---|---|
| **Static** | Document-level have-nots, format violations, missing fields | < 1s |
| **Linkage** | Drift between artifacts and code; orphans; cross-artifact impact | < 5s |
| **Runtime** | Rendered styles vs design tokens; PRD acceptance flows; real-DOM contrast | 30s-2min |

Static catches form. Linkage catches lying. Runtime catches breakage.
See [validation.md](./validation.md) for the complete picture.

## Five external integrations (detect-and-delegate, none vendored)

- **Google Labs design.md** - format spec for DESIGN.md
- **Impeccable** - design intelligence (7 domain refs + 23 commands)
- **awesome-design-md** - 71-site curated catalog
- **SkillUI** - static-analysis fallback for arbitrary URLs
- **vercel-labs/agent-browser + Playwright** - runtime verification

Each is detected via `lib/<name>-detector` or `lib/<name>-bridge`.
None of their content is vendored; we delegate when present and fall
back gracefully when absent (light-impeccable internal references for
design; no-backend message for runtime).

## The three load-bearing artifacts (designed for v0.5+)

```
.godpowers/intent.yaml    INTENT   what you want (hand-edited)
.godpowers/state.json     FACTS    what was resolved (machine-managed)
.godpowers/runs/<id>/events.jsonl  HISTORY  what happened (append-only)
```

This is the Cargo + Poetry + OpenTelemetry pattern applied to AI workflows.

## Workflows

The arc isn't just "/god-mode". 11 core workflows handle different real-world
scenarios:

| Workflow | When |
|----------|------|
| full-arc | Greenfield, idea to launch |
| feature-arc | Add feature to existing project |
| hotfix-arc | Urgent production bug |
| refactor-arc | Safe refactor, no behavior change |
| spike | Time-boxed research |
| postmortem | After-incident investigation |
| migration-arc | Framework or version migration |
| docs-arc | Documentation work |
| deps-audit | Dependency updates |
| audit-only | Score artifacts, build nothing |
| hygiene | Periodic health check |

Each is a declarative YAML in `workflows/`. The orchestrator reads them.

## Modes

| Mode | When |
|------|------|
| A | Greenfield (no existing code, no .godpowers/) |
| B | Gap-fill (existing project, missing artifacts) |
| C | Audit-only (score existing artifacts) |
| D | Multi-repo (future work, post-1.0) |

god-orchestrator detects mode automatically from disk signals.

## Pauses

Five legitimate reasons to pause for the user:
1. Ambiguous intent
2. Human-only flip-point
3. Statistical tie
4. Critical security finding
5. Brand voice

`--yolo` auto-resolves the first four. Critical security still pauses (the
one carve-out, by design).

## Recovery

Forward-only with compensation (Flyway pattern). Operations append to
`.godpowers/log` (the reflog). `/god-undo` reverts. Destructive ops move
files to `.godpowers/.trash/` (recoverable).

## Extensions

Skill packs from npm. Each declares `apiVersion: godpowers/v1` and
`engines.godpowers: "^1.0.0"`. Lazy-activated: pack files don't load until
their slash command is invoked.

First-party packs (scaffolded in v0.4, full in v0.8):
- `@godpowers/security-pack` - SOC 2, HIPAA, PCI
- `@godpowers/launch-pack` - Show HN, PH, IH, OSS
- `@godpowers/data-pack` - ETL, ML features, dashboards

## How it composes with parents

- **GSD**: complementary. Different state directories.
- **Superpowers**: orthogonal. Adopted (TDD, two-stage review).
- **BMAD**: alternative for planning, complementary for execution.
- **arc-ready**: ancestor. Extended with skill model and workflows.

See `references/shared/ORCHESTRATORS.md` for composition patterns.
