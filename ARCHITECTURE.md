# Godpowers Architecture (v1 Design Target)

> Status: STABLE v1.6.10 (pure-skill model)
> Authors: Godpowers Team
> Last updated: 2026-05-12

This document is the canonical design for Godpowers as a coherent product.
v1.6.10 keeps the public surface stable while making progress easier to
understand: user-facing responses prefer project-run language over internal
arc jargon and status closeouts show PRD, roadmap, milestone, and completion
position when available.

The design follows a **pure-skill model**: Godpowers is a skill-based system.
The only CLI surface is `npx godpowers` for installation. All user-facing
operations are slash commands inside the AI coding tool.

The design is informed by research into how mature dev tools (GitHub Actions,
Tekton, Argo, Buildkite, VSCode, Cargo, Poetry, Bazel, Nx, Helm, Terraform,
Flyway, OpenTelemetry, Git, Anthropic's Claude Agent SDK) solve the problems
Godpowers needs to solve. See `docs/RFC/0000-research-brief.md` for citations.

---

## 1. Product Thesis

### Who it's for
Solo founders and small engineering teams using AI coding tools who want to
ship production-grade software without enterprise process.

### What problem we solve
AI coding tools produce inconsistent, generic, undertested output by default.
Without discipline, the result is "AI-slop": code that compiles and tests
pass, but architecture is wrong, security is shallow, launch copy is generic,
nobody can resume after a context flush.

### What we are
Godpowers is a **skill system for AI-assisted product development**. Slash
commands inside your AI coding tool orchestrate specialist agents in fresh
contexts to produce mechanically-verified artifacts on disk.

### Core promise
> Type one slash command. Get a hardened, observable, deployed product, every
> step traceable, every artifact accountable.

### Core surface (pure-skill foundation)
- Skills at `<runtime>/skills/god-*.md` invoked as slash commands
- Specialist agents at `<runtime>/agents/god-*.md` spawned via Task tool
- Single CLI surface: `npx godpowers` for install/uninstall only
- Hooks for SessionStart and PreToolUse
- Native Pillars project context in `AGENTS.md` and `agents/*.md`
- Disk-authoritative state in `.godpowers/`

---

## 2. Native Context And Load-Bearing Artifacts

Godpowers separates portable project context from workflow state. Pillars
files describe durable project truth any coding agent can read. `.godpowers`
files describe the Godpowers workflow, artifacts, and execution history.

Native Pillars context:

| File | Role | Pattern source |
|------|------|---------------|
| `AGENTS.md` | **Protocol**: how coding agents load project context | Pillars |
| `agents/context.md` | **Identity**: domain language and product invariants | Pillars |
| `agents/repo.md` | **Layout**: repository structure and naming | Pillars |
| `agents/*.md` | **Routed context**: task-specific project truth | Pillars |

Godpowers workflow state:

| File | Role | Pattern source |
|------|------|---------------|
| `.godpowers/intent.yaml` | **Intent**: what the user wants | Cargo.toml, package.json |
| `.godpowers/state.json` | **Facts**: what was resolved/done | Cargo.lock, poetry.lock |
| `.godpowers/runs/<id>/events.jsonl` | **History**: what happened | OpenTelemetry traces |
| `.godpowers/domain/GLOSSARY.md` | **Vocabulary**: canonical project language and unresolved ambiguity | Domain glossary |

Every other architectural decision falls out from how these two layers relate:
Pillars carries portable context, while `.godpowers` carries workflow state.

### `.godpowers/intent.yaml` (Intent)

Hand-editable. Reviewable. Created by `/god-init`. The document a human reads
to understand the project's shape.

```yaml
apiVersion: godpowers/v1
kind: Project
metadata:
  name: myproject
  description: "..."

mode: A                  # A=greenfield, B=gap-fill, C=audit
scale: medium            # trivial | small | medium | large | enterprise

extensions:              # Optional: skill packs to layer on
  - "@godpowers/security-pack@^1.0.0"

workflow: full-arc       # references workflows/full-arc.yaml

executors:
  default: claude-code

config:
  yolo: false
  conservative: false
```

### `.godpowers/state.json` (Facts)

Machine-managed. Written by agents as they complete work. Read by every
downstream agent and by status/audit slash commands.

```json
{
  "$schema": "https://godpowers.dev/schema/state.v1.json",
  "version": "1.0.0",
  "project": { "name": "myproject", "started": "..." },
  "active-workstream": "main",
  "tiers": {
    "tier-1": {
      "prd": {
        "status": "done",
        "artifact": "prd/PRD.md",
        "artifact-hash": "sha256:abc...",
        "agent-version": "god-pm@1.0.0",
        "have-nots-passed": ["P-01", "...", "P-15"],
        "updated": "..."
      }
    }
  }
}
```

### `.godpowers/runs/<id>/events.jsonl` (History)

Append-only. Crash-safe. JSONL for grep-ability. OpenTelemetry-shape spans
with attributes.

```jsonl
{"trace_id":"abc","span_id":"01","ts":"...","name":"workflow.run","attrs":{"workflow":"full-arc"}}
{"trace_id":"abc","span_id":"02","parent":"01","ts":"...","name":"agent.start","attrs":{"agent":"god-pm","tier":"prd"}}
{"trace_id":"abc","span_id":"02","ts":"...","name":"tool.call","attrs":{"tool":"Write","path":"prd/PRD.md"}}
{"trace_id":"abc","span_id":"02","ts":"...","name":"agent.end","attrs":{"agent":"god-pm","status":"success"}}
{"trace_id":"abc","span_id":"03","parent":"01","ts":"...","name":"have-nots.check","attrs":{"artifact":"prd/PRD.md","passed":15,"failed":0}}
```

This is the same shape as Datadog APM, Jaeger, Honeycomb. Future skill
extensions can pipe to those tools.

### Concurrency contract (advisory locking)

Godpowers is **single-writer-per-mutation** but **multi-reader-anytime**.
The contract:

- Reads (`/god-status`, `/god-doctor`, `/god-help`, `/god-version`,
  `/god-audit`) require no lock and can run any time, even while a
  write is in flight.
- Writes (any artifact-producing skill, `/god-build`, `/god-deploy`,
  `/god-undo`, `/god-rollback`, `/god-repair`, `/god-restore`,
  `/god-redo`, `/god-skip`, `/god-link`, `/god-scan`, `/god-sync`)
  acquire a cooperative advisory lock by writing the `state.json`
  `lock` object before mutating, and clearing it on completion.
- The lock has a `scope` (e.g. `tier-1.arch`, `linkage`, `all`). Two
  writers with non-overlapping scopes may run concurrently.
- Stale locks (past `expires`) are reclaimable by any actor; the
  reclaim emits a `state.repair` event with the previous holder
  recorded.

Why advisory and not OS-level: state.json lives on the developer's
disk, but the same project may be touched by multiple AI sessions, a
human editor, and CI workflows. An OS file lock would block none of
them. An advisory lock in state.json is visible to every actor that
respects the contract: today, the orchestrator and the recovery
skills. Editors that touch artifact files directly do not respect the
lock, which is fine: their changes show up as drift in `/god-doctor`
and `/god-repair` handles reconciliation.

Mode D (multi-repo suites) adds a second layer of locking at
`.godpowers/suite/lock`, owned by `god-coordinator`. Per-repo locks
stay local.

---

## 3. The Slash Command Surface

This is the canonical user surface. Everything happens through slash commands
inside the AI coding tool. The only CLI is `npx godpowers` for install.

### Lifecycle commands

| Command | What it does | Maps to |
|---------|--------------|---------|
| `/god-init` | Detect project, create `.godpowers/`, write intent.yaml | god-orchestrator (mode/scale detect) |
| `/god-mode` | Run full arc autonomously | god-orchestrator (full workflow) |
| `/god-status` | Show current state from disk | (built-in) |
| `/god-next` | Suggest next command based on state | (built-in) |
| `/god-help` | Discoverable command help | (built-in) |
| `/god-doctor` | Diagnose install + state, suggest fixes | (built-in) |

### Tier commands

| Command | Tier | Spawns |
|---------|------|--------|
| `/god-prd` | 1 | god-pm |
| `/god-arch` | 1 | god-architect |
| `/god-roadmap` | 1 | god-roadmapper |
| `/god-stack` | 1 | god-stack-selector |
| `/god-repo` | 2 | god-repo-scaffolder |
| `/god-build` | 2 | god-planner + god-executor + reviewers |
| `/god-deploy` | 3 | god-deploy-engineer |
| `/god-observe` | 3 | god-observability-engineer |
| `/god-launch` | 3 | god-launch-strategist |
| `/god-harden` | 3 | god-harden-auditor |

### Recovery commands

| Command | What it does |
|---------|-------------|
| `/god-undo` | Revert last operation via reflog |
| `/god-redo <tier>` | Re-run a tier and downstream tiers |
| `/god-skip <tier> --reason "..."` | Explicit skip with audit |
| `/god-repair` | Fix detected drift between state and disk |
| `/god-rollback <tier>` | Walk back state + move artifacts to .trash |
| `/god-restore` | Recover artifacts from .trash |

### Observability commands (planned for v0.15)

> Status: events.jsonl is written today; these readable-timeline
> wrappers ship in v0.15. Until then, raw inspection via
> `cat .godpowers/runs/<id>/events.jsonl`.

| Command | What it does | Ships |
|---------|-------------|-------|
| `/god-logs [<run-id>]` | View events.jsonl as readable timeline | v0.15 |
| `/god-metrics` | Per-tier stats: duration, pauses, retries | v0.15 |
| `/god-trace <tier>` | Deep dive on a specific tier's events | v0.15 |

### Extension commands (planned for v0.13)

> Status: scaffolds exist in `extensions/`; runtime ships in v0.13.

| Command | What it does | Ships |
|---------|-------------|-------|
| `/god-extension-add @x/y` | Install a skill pack from npm | v0.13 |
| `/god-extension-list` | Show installed extensions | v0.13 |
| `/god-extension-remove @x/y` | Uninstall a pack | v0.13 |
| `/god-extension-info @x/y` | Show pack details | v0.13 |
| `/god-test-extension <path>` | Plugin contract tests | v0.13 |

### Workstream commands

| Command | What it does |
|---------|-------------|
| `/god-workstream new <name>` | Create parallel workstream |
| `/god-workstream list` | Show all workstreams |
| `/god-workstream switch <name>` | Switch active workstream |
| `/god-workstream merge <name>` | Merge a workstream back |

### Utility commands

| Command | What it does |
|---------|-------------|
| `/god-fast` | Trivial inline edit, no full pipeline |
| `/god-quick` | Small task with TDD, no planning tier |
| `/god-explore` | Pre-init Socratic ideation |
| `/god-debug` | Systematic 4-phase debugging |
| `/god-review` | Two-stage code review |
| `/god-audit` | Score artifacts against have-nots |
| `/god-pause-work` | Save context handoff |
| `/god-resume-work` | Restore from handoff |
| `/god-sprint` | Sprint plan / status / retro |
| `/god-party` | Multi-persona collaboration |
| `/god-build-agent` | Generate custom specialist agent |
| `/god-version` | Print Godpowers version |
| `/god-smite` | Delete node_modules, reinstall (easter egg) |

### The only CLI surface

```bash
# Install
npx godpowers --claude --global
npx godpowers --all                    # all 15 runtimes

# Uninstall
npx godpowers --uninstall --claude

# One-time migration (v0.3 -> v0.4+)
npx godpowers --migrate

# Help
npx godpowers --help
```

That's it. Everything else is slash commands.

---

## 4. Workflow Definition Language

Workflows are declarative YAML in the shape of GitHub Actions + Buildkite's
dynamic-upload trick. We do NOT invent a DSL.

The workflow YAML lives in skill-installable form at
`<runtime>/godpowers-workflows/`. The orchestrator agent reads it.

### Static workflow

```yaml
# workflows/full-arc.yaml
apiVersion: godpowers/v1
kind: Workflow
metadata:
  name: full-arc
  description: Idea to hardened production

on: [/god-mode]

jobs:
  prd:
    tier: 1
    uses: god-pm@^1.0.0
    with:
      template: PRD.md

  arch:
    tier: 1
    needs: prd
    uses: god-architect@^1.0.0

  roadmap:
    tier: 1
    needs: arch
    uses: god-roadmapper@^1.0.0

  stack:
    tier: 1
    needs: arch
    uses: god-stack-selector@^1.0.0

  repo:
    tier: 2
    needs: stack
    uses: god-repo-scaffolder@^1.0.0

  build:
    tier: 2
    needs: [roadmap, repo]
    uses: god-build-orchestrator@^1.0.0    # composite: handles waves + reviews

  deploy:
    tier: 3
    needs: build
    uses: god-deploy-engineer@^1.0.0

  observe:
    tier: 3
    needs: deploy
    uses: god-observability-engineer@^1.0.0

  harden:
    tier: 3
    needs: build
    uses: god-harden-auditor@^1.0.0
    blocks-on:
      - critical-finding: pause

  launch:
    tier: 3
    needs: harden
    uses: god-launch-strategist@^1.0.0
```

### Dynamic uploads (Buildkite pattern)

When a planner agent generates steps based on what it just learned (e.g.,
god-planner emitting per-slice executor jobs), it can append more YAML to
the workflow:

```yaml
# god-planner output:
- emit-jobs:
    - id: build-slice-1.1
      tier: 2
      uses: god-executor@^1.0.0
      with:
        slice: 1.1
        plan: build/PLAN.md#slice-1.1
      review:
        stages:
          - { uses: god-spec-reviewer@^1.0.0, on-fail: rollback }
          - { uses: god-quality-reviewer@^1.0.0, on-fail: rollback }
```

### Five workflow primitives (Anthropic-blessed)

We ship five primitives. We do NOT invent a sixth.

| Primitive | Example in Godpowers |
|-----------|---------------------|
| **Prompt chaining** | PRD -> ARCH -> ROADMAP |
| **Routing** | Scale=trivial routes to /god-fast |
| **Parallelization** | Roadmap + Stack run in parallel after ARCH |
| **Orchestrator-workers** | god-build-orchestrator spawns executors per slice |
| **Evaluator-optimizer** | god-executor + god-spec-reviewer + god-quality-reviewer loop |

---

## 5. Agent Contract (Plugin-Style)

Agents are the unit of extension. Manifest is versioned (Helm pattern).

### Manifest schema (apiVersion: godpowers/v1)

```yaml
---
apiVersion: godpowers/v1
kind: Agent
metadata:
  name: god-pm
  version: 1.0.0
  description: Senior PM persona. Writes substitution-tested PRDs.

engines:
  godpowers: "^1.0.0"

contract:
  inputs:
    - name: user-intent
      from: .godpowers/intent.yaml#/metadata/description
    - name: project-state
      from: .godpowers/state.json
  outputs:
    - path: prd/PRD.md
      contract:
        template: PRD.md
        passes:
          - have-nots: [P-01, ..., P-15]
          - substitution-test
          - three-label-test

# Tools MUST be declared explicitly. No implicit-all.
tools:
  required: [Read, Write]
  optional: [WebSearch]

yolo:
  ambiguous-problem-space:
    action: pick-broader
    rationale: Narrowing later is cheaper than expanding
  domain-knowledge-gap:
    action: log-as-open-question

events:
  emits: [agent.start, agent.end, tool.call, artifact.created]

activation:
  spawned-by:
    - /god-prd
    - god-build-orchestrator
---

# Body: instructions to the LLM
```

### Why these rules

- **`apiVersion`**: Helm's lesson. Schema versioning from day one.
- **`engines.godpowers`**: VSCode's lesson. Compatibility ranges enforced at install.
- **`tools` required explicit**: Anthropic's rule. No implicit-all.
- **`activation.spawned-by`**: VSCode lazy-loading semantics.
- **`contract.outputs.contract.passes`**: enables mechanical verification.

### Backward compatibility

v0.3 agents (no contract block) keep working. `/god-doctor` warns about
agents without explicit contracts.

---

## 6. Plan-Then-Apply (Two-Phase as Slash Commands)

Terraform's only really good idea: preview before commit.

```
/god-mode --plan         # Show what would happen, ask for confirm
/god-mode                # Run (default: plan and confirm in one flow)
/god-mode --yolo         # Skip plan confirmation
```

`/god-mode --plan` produces output showing:
- Which agents will be spawned
- Which tools each will call
- Which files will be written
- Estimated cost (model tokens) and duration

User confirms with "go" or aborts. Same pattern for individual tier commands:

```
/god-prd --plan          # Preview the PRD agent's plan
/god-prd                 # Run normally (which always announces what it'll do first)
```

Plans are also written to `.godpowers/runs/<id>/plan.yaml` for audit.

---

## 7. Recovery: Forward-Only with Compensation

Flyway's lesson: true transactional rollback is impossible. Forward-only
with cheap compensation wins.

### Reflog (Git pattern)

`.godpowers/log` is append-only:

```jsonl
{"id":"01","ts":"...","op":"run","workflow":"full-arc","status":"success"}
{"id":"02","ts":"...","op":"extension.install","name":"@godpowers/security-pack","version":"1.0.0"}
{"id":"03","ts":"...","op":"agent.update","name":"god-pm","from":"1.0.0","to":"1.0.1"}
```

`/god-undo` reverts to state before operation N, executing compensating
operations.

### Trash (recoverable deletion)

Destructive operations move files to `.godpowers/.trash/<timestamp>/<path>`
rather than deleting. `/god-restore` recovers. After 30 days, automatic
cleanup (configurable in intent.yaml).

### Recovery slash commands (full list)

| Command | Action |
|---------|--------|
| `/god-undo` | Revert last operation |
| `/god-redo <tier>` | Re-run tier and downstream |
| `/god-skip <tier> --reason "..."` | Skip with audit |
| `/god-repair` | Fix detected drift |
| `/god-rollback <tier>` | Roll back tier and downstream |
| `/god-restore` | Recover from .trash/ |

---

## 8. Onboarding: One Slash Command

```
/god-init
```

This is the fly-launch / npm-init pattern, mapped to a slash command.

1. Detect project type (existing code, language, frameworks)
2. Print what was detected, allow override
3. Ask 3-5 questions max
4. Create `.godpowers/` with intent.yaml + initial state.json
5. Print contextual next-step suggestions
6. Suggest running `/god-mode` for full arc, or `/god-prd` to start manually

After install, the user opens their AI tool, types `/god-init`, and is guided
through. No CLI ceremony.

### `/god-help`

Discoverable, contextual:

```
/god-help                    # All commands grouped by tier
/god-help <command>          # Detailed help with examples
/god-help workflow           # Available workflows
/god-help extension          # Extension management
```

Every error from a Godpowers command ends with the most likely next command
(`gh` does this well).

---

## 9. Observability (As Slash Commands): v0.15

Three views of the same events.jsonl, all via slash commands. The
events.jsonl write surface exists today; these reader commands
ship with the v0.15 observability release.

| Command | Output |
|---------|--------|
| `/god-logs` | Recent events as readable timeline |
| `/god-logs --since=2h` | Events in the last 2 hours |
| `/god-trace <tier>` | All events for a specific tier with durations |
| `/god-metrics` | Per-tier stats |

Example `/god-metrics`:
```
Tier           Duration   Pauses   Retries   Have-nots fails
prd            5m 23s     1        0         0/15
arch           12m 4s     0        0         0/12
roadmap        3m 11s     0        0         0/10
stack          7m 45s     1        0         0/5
repo           2m 8s      0        0         0/8
build          1h 23m     0        2         1/12 (resolved)
deploy         18m 2s     0        0         0/8
observe        9m 41s     0        0         0/8
harden         34m 17s    0        0         0/11
launch         11m 5s     1        0         0/8
```

Future extensions can export to Datadog/Honeycomb/Jaeger by piping the OTel-
shape events.

---

## 10. Extensions (Skill Packs)

In a pure-skill model, "extensions" are just additional skill packs published
to npm. Each pack drops files into `<runtime>/skills/` and `<runtime>/agents/`.

### Installation

```
/god-extension-add @godpowers/security-pack
```

The slash command:
1. Resolves the npm package
2. Verifies the pack's `engines.godpowers` is compatible
3. Copies its skills/agents to the active runtime config dirs
4. Updates intent.yaml with the dependency
5. Records in reflog

### What a skill pack contains

```
@godpowers/security-pack/
  package.json                       # npm metadata, engines.godpowers
  manifest.yaml                      # Capabilities declared
  skills/
    god-soc2-audit.md
    god-hipaa-audit.md
  agents/
    god-soc2-auditor.md
    god-hipaa-auditor.md
  workflows/
    soc2-arc.yaml
  have-nots/
    soc2.md
  templates/
    SOC2-FINDINGS.md
```

### Manifest

```yaml
apiVersion: godpowers/v1
kind: Extension
metadata:
  name: "@godpowers/security-pack"
  version: 1.0.0

engines:
  godpowers: ">=0.14.0 <2.0.0"

provides:
  agents:
    - god-soc2-auditor
    - god-hipaa-auditor
  skills:
    - god-soc2-audit
    - god-hipaa-audit
  workflows:
    - soc2-arc
  have-nots:
    - prefix: SOC2
      description: SOC2 Common Criteria checks
```

Lazy activation: extensions don't load until their skill is invoked.

### First-party packs

| Package | Contains |
|---------|----------|
| `godpowers` | Core: 106 skills, 39 agents, 13 workflows, base have-nots, 5 external integrations |
| `@godpowers/security-pack` | SOC2, HIPAA, PCI auditors |
| `@godpowers/launch-pack` | Show HN, Product Hunt, Indie Hackers strategists |
| `@godpowers/data-pack` | Data engineering tier (ETL, ML, dashboards) |

Community packs follow the same shape.

---

## 11. Testing Strategy

### Three test layers

1. **Unit tests** (pure functions): schema validators, workflow parser, lock
   resolver. Fast, hermetic.
2. **Skill contract tests**: every agent ships `__tests__/` with fixture
   inputs. Test runner verifies contract: outputs match expected, have-nots
   pass. Extensions can't publish without passing.
3. **End-to-end tests**: spawn a slash command against fixture project.
   Mock model layer at SDK boundary (record real responses once, replay
   deterministically).

### `/god-test-extension <path>` (Nx pattern, as slash command)

Extension authors run this before publishing. The harness:
- Loads the extension manifest
- Runs each agent against bundled fixtures
- Diffs actual vs expected outputs
- Refuses publish on any mismatch

### Record/replay layer

`tests/replay/` holds recorded model responses keyed by request hash. Tests
intercept model calls and return recorded responses. Re-record:
`npx godpowers --test --update-recordings`.

(This is the one place we use the CLI beyond install. Test infrastructure is
not user-facing.)

---

## 12. Migration from v0.3 to v1.0

### Compatibility matrix

| Version | intent.yaml | state.json | events.jsonl | PROGRESS.md |
|---------|------------|------------|--------------|-------------|
| v0.3.x  | absent | absent | absent | canonical |
| v0.4.x  | optional | new | new | canonical (back-compat) |
| v0.5.x  | required | required | required | generated (legacy view) |
| v1.0.x  | required | required | required | optional (read-only) |

### `npx godpowers --migrate` (one-shot CLI)

```
$ npx godpowers --migrate
  Detected: v0.3 project (.godpowers/PROGRESS.md exists, no intent.yaml)
  Will migrate to: v1.0
  
  Steps:
    1. Generate intent.yaml from PROGRESS.md mode + scale
    2. Generate state.json from artifact hashes
    3. Replay synthetic events.jsonl from artifact mtimes
    4. Archive PROGRESS.md as PROGRESS.md.legacy
    5. Validate against v1.0 schemas
  
  Continue? [y/N]
```

This is one of the rare CLI surfaces because it operates on disk before any
slash command can.

After migration, the slash command `/god-doctor` validates the new state.

---

## 13. Versioning and Compatibility

### Capability handshake

Each extension declares:
```yaml
engines:
  godpowers: ">=0.14.0 <2.0.0"
```

`/god-extension-add` checks compatibility before installing. Mismatches fail
with clear error and suggested fix.

### Schema versioning

| Schema | Stable from | Frozen at |
|--------|-------------|-----------|
| `intent.v1.yaml.json` | v0.4 | v1.0 |
| `state.v1.json` | v0.4 | v1.0 |
| `events.v1.json` | v0.4 | v1.0 |
| `workflow.v1.json` | v0.5 | v1.0 |
| `agent-manifest.v1.json` | v0.5 | v1.0 |
| `extension-manifest.v1.json` | v0.8 | v1.0 |

v1.0 freezes all schemas. v2.0 (if ever) is breaking. v1.x is
backwards-compatible within itself.

---

## 14. Anti-Patterns Rejected

| Anti-pattern | Why we reject |
|--------------|--------------|
| Adding a `godpowers` CLI binary alongside slash commands | Doubles install surface; skills are sufficient |
| Storing state in conversation memory | Disk-authoritative is the entire point |
| Implicit `tools` (allow-all) | Anthropic's explicit rule; smoke test rejects |
| Tightly coupling agents to skills | Reuse impossible if 1:1 |
| Orchestrator doing the work itself | Context rot returns; reviewers can't be independent |
| Markdown-only state | Mechanical queries and drift detection require structure |
| Implicit contracts | Breaking changes silent; versioning impossible |
| Magic auto-everything | --yolo exists, but defaults are documented and logged |
| One-size-fits-all workflow | Scale-adaptive and extensions matter |
| Hidden dependencies | All gates explicit; DAG visualizable |
| Decoration emojis as quality signals | Real icons or none |
| Theater (sentences that decide nothing) | Three-label test catches this |
| Inventing a sixth workflow primitive | Use Anthropic's five first |
| Pure-imperative workflow definition | YAML + escape hatch wins |
| In-memory subagent context handoff | Files only; resumable, inspectable |
| Transactional rollback claim | Forward-only with compensation; honest |

---

## 15. Implementation Roadmap

| Version | Focus | Key deliverables (all slash commands except install) |
|---------|-------|------------------|
| **v0.4** | Foundation | intent.yaml + state.json schemas, events.jsonl, `/god-doctor`, `/god-help`, migration script |
| **v0.5** | Workflow | Workflow YAML format, runtime, plan-then-apply via `--plan` flag |
| **v0.6** | Recovery | `/god-undo`, `/god-redo`, `/god-skip`, `/god-repair`, `/god-rollback`, `/god-restore`, .trash/ |
| **v0.7** | Observability | `/god-logs`, `/god-metrics`, `/god-trace`, OTel-shape events |
| **v0.8** | Extensions | Extension manifest, `/god-extension-{add,list,remove,info}`, first-party packs |
| **v0.9** | Distribution | npm publish, capability handshake, semantic-release |
| **v1.0** | Stable | Migration verified, schemas frozen, integration test suite, docs site |

Each release is independently shippable. v1.0 freezes the public API.

---

## 16. Mapping Current State to Target

| current v0.15 surface | v1.0 target |
|------------|-------------|
| `.godpowers/PROGRESS.md` (markdown) | `.godpowers/intent.yaml` + `.godpowers/state.json` + auto-generated PROGRESS.md (legacy view) |
| Implicit workflow in orchestrator prose | `workflows/full-arc.yaml` declarative |
| Prose-only agent files | Manifest YAML front matter + prose body |
| Smoke tests (structural only) | Unit + skill contract + record/replay E2E |
| `npx godpowers` (1 package, install only) | Same! `npx godpowers` stays install-only. Plus skill pack ecosystem on npm. |
| 106 skills + 39 agents (shipped at v0.15) | Same surface. Declarative contracts via lib/workflow-runner.js. |
| HAVE-NOTS.md (markdown) | Same content + machine-readable index |
| Single-machine install only | npm-distributed packs, capability handshake |
| Slash commands as primary surface | Unchanged. Slash commands stay primary. |

The migration is additive at every step. v0.4 introduces structures;
v0.3 commands keep working. v1.0 freezes the public API.

---

## Appendix: Why These Specific Patterns

The architecture is grounded in concrete patterns from production tools.

| Pattern | Source | Where it lives in Godpowers |
|---------|--------|---------------------------|
| Intent + facts split | Cargo, Poetry | intent.yaml + state.json |
| OTel trace/span/event | OpenTelemetry | events.jsonl shape |
| Workflow YAML | GitHub Actions, Tekton | workflows/*.yaml |
| Dynamic step upload | Buildkite | Planner emits jobs |
| `apiVersion` in manifest | Helm | All schemas |
| Lazy plugin activation | VSCode | activation.spawned-by |
| Explicit tools per agent | Anthropic | Agent manifest |
| Five workflow primitives | Anthropic | The only patterns we ship |
| Plan-then-apply | Terraform | `--plan` flag on commands |
| Forward-only + compensation | Flyway | `/god-undo` |
| Reflog | Git | `.godpowers/log` |
| Magic init command | Fly, npm-init | `/god-init` (slash, not CLI) |
| Plugin contract tests | Nx | `/god-test-extension` |
| Record/replay | proven pattern | tests/replay/ |
| Capability handshake | npm engines | engines.godpowers |
| Skill-only surface | pure-skill model | The whole product |

If a design question comes up, look it up in this table first.
