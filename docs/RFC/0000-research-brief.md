# RFC 0000: Research Brief

> Status: REFERENCE
> Authors: Godpowers research agent
> Created: 2026-05-09

This is the research that informed ARCHITECTURE.md v0.2. Preserved here for
provenance.

---

## Patterns Synthesized

### 1. Workflow Definition Languages

**Sweet spot**: YAML with small primitive set + escape hatch to code.

- **GitHub Actions**: `on/jobs/steps`, `uses:` for reusable, `run:` for shell.
  Parallel by default, sequential via `needs:`.
- **Tekton**: `Task` (steps) + `Pipeline` (DAG via `runAfter`). CRD-based.
- **Argo**: `templates` with steps/DAG, supports loops/conditionals/recursion.
- **Buildkite**: starts static; steps can `pipeline upload` more YAML mid-run.
  Perfect for "agent generates next steps based on what it just learned."

**Why it works**: declarative YAML is reviewable, diffable, reasonable
without running. Pure-DSL ends up reinventing programming. Pure-imperative
loses introspectability.

**Tradeoffs**: YAML's expressiveness ceiling is real. Buildkite's answer:
language SDKs that emit YAML.

**Adopt**: `workflow.yaml` with GitHub-Actions-shaped fields, every step
targets an agent via `uses:`, planner agents can emit dynamic YAML
(Buildkite trick), provide TS/Python SDK for power users.

### 2. Plugin / Extension Systems

**Pattern**: Manifest + lifecycle contract + capability declaration. Small
explicit contract; everything beyond is private.

- **VSCode**: `package.json` with `engines.vscode: "^1.74.0"`,
  `activationEvents` (lazy load), `contributes` (declarative capabilities).
- **Helm**: `plugin.yaml` with `apiVersion`, name, version (SemVer required),
  command, platformCommand. Helm 4 added `apiVersion: v1` planning for
  evolution.
- **Nx**: plugins ship executors with strict signatures. One entry point per
  feature.
- **Cargo**: any binary `cargo-foo` becomes `cargo foo`. Zero contract beyond
  exit codes.

**Why**: lazy activation = 200 plugins don't slow startup. Manifest-declared
capabilities = host can build menus without loading plugin code.

**Adopt**: `godpowers-plugin.yaml` with `apiVersion: v1`, `engines.godpowers`,
`contributes:` block. Lazy activation. Two tiers: in-process TS (rich API)
and subprocess (any language).

### 3. State Models

**Pattern**: Two-layer split, intent vs facts.

- **Cargo**: `Cargo.toml` (intent) hand-edited; `Cargo.lock` (facts) tool-managed.
- **Poetry**: same split. Lockfile criticized as hard to review (JSON-ish).
  Cargo's TOML reads better.
- **Bazel**: `BUILD` files in Starlark (restricted Python). Hermetic.
- **Nx**: project graph computed on demand, cached, never hand-edited.

**Why**: humans edit small expressive document; tool maintains bulky exact one.
Reproducibility from lockfile; reviewability from intent.

**Adopt**: `godpowers.yaml` (intent) + `godpowers.lock` (facts, TOML for
diffability) + computed run graph (ephemeral, per-execution).

### 4. Event Sourcing / Audit Logs

**Pattern**: OpenTelemetry-style spans with structured events. Span =
"operation with start/end"; Event = "timestamped thing inside a span."

Granularity for AI agent orchestrator: log at agent boundary, not every tool
call. Run is a trace; subagent is a span; tool calls are events on the span.

**Adopt**: every run gets `trace_id`. Persist as JSONL append-only at
`.godpowers/runs/<id>/events.jsonl`. Use OTel field names so users can pipe
to Datadog/Honeycomb later.

### 5. Discoverability and Onboarding

**Pattern**: small command tree, single magic entry, progressive disclosure.

- **gh**: noun-verb. `gh pr list`, `gh issue create`. First-run: `gh auth login`.
- **fly launch**: detects project, asks 3-4 questions, generates fly.toml,
  deploys. Whole onboarding is one command.
- **npm init / npm create <thing>**: delegates to `create-*` package.
- **wrangler**: init -> dev -> deploy. Three commands cover lifecycle.

**Why**: low cognitive load. Magic detect + 4 questions + emit config = working
in under a minute.

**Adopt**: `godpowers init` does the magic. Noun-verb structure.
`godpowers new <template>` delegates to `create-godpowers-*` packages.
Every error ends with most likely next command.

### 6. Anthropic Claude Agent SDK Best Practices

Five workflow primitives:
1. **Prompt chaining**: sequential decomposition with gates
2. **Routing**: classifier picks specialist
3. **Parallelization**: fan out, aggregate
4. **Orchestrator-workers**: lead spawns subagents in parallel; isolated
   contexts; only relevant info returned
5. **Evaluator-optimizer**: generator + independent evaluator in loop

Strongest production pattern: **Planner / Generator / Evaluator** with
handoffs through structured artifacts (files), not shared context.

Subagent rules:
- One clear goal, one input, one output, one handoff per subagent
- Tools scoped intentionally per subagent. Read-heavy roles get no write tools.
- Omitting tool list grants everything; almost always wrong.
- Subagents best for read-heavy, small-output tasks
- Concurrent subagents are memory-intensive

**Adopt**: ship the five primitives only. Don't invent a sixth. Subagent
declaration MUST include `tools:` explicitly. Lint for missing. Handoff via
files only.

### 7. Recovery and Rollback

**Pattern**: Append-only history + named restore points + idempotent forward
operations.

- **Git**: never deletes commits short-term. `reflog` records every HEAD
  movement for ~90 days.
- **Terraform**: no native rollback. Pattern: commit TF code in git, version
  state, "rollback" = revert code, plan, apply. Plan-then-apply gives preview
  transaction. (Terraform's only really good idea.)
- **kubectl**: keeps last N ReplicaSets as revisions. Forward-only with
  versioned snapshots.
- **Flyway Community**: forward-only. To "undo" V5, write V6 that reverses.
  Forward-only-with-compensation wins because it survives partial failures.

**Why**: immutable history + mutable references = always see state, even after
destructive ops. Forward-only with compensation is honest about what can't be
undone.

**Adopt**: every run is content-addressable. Reflog at `.godpowers/log`.
File edits go through git. Two-phase commit at workflow level: `plan` previews,
`run` executes.

### 8. Testing Meta-Frameworks

**Pattern**: three layers, hermetic where possible.

- **Cargo**: integration tests build real Cargo projects in temp dirs, assert
  on stdout/files. Bootstrap (Cargo builds Cargo) introduced central
  execution context with caching.
- **Nx**: fixture workspaces + snapshot tests on generated files.
- **Custom test frameworks**: when unit-of-test isn't a function (fuzzing,
  property testing).

For AI agent orchestrator: deterministic LLM responses are impossible.
Proven pattern: **record/replay** + **golden-file** assertions on artifacts.
Mock model layer at SDK boundary; everything else runs real.

**Adopt**:
1. Unit tests on workflow parsing, graph computation, lock resolution
2. Plugin contract tests: every plugin ships fixture; runner enforces
3. End-to-end: spawn `godpowers run` against fixtures with mocked models
4. `godpowers test-plugin <path>` before publishing
5. Don't test agent intelligence in CI; test orchestrator produces right
   artifacts/events given recorded responses

---

## Cross-Cutting Recommendations

Patterns appearing in nearly every category:

- **Append-only event log** drives audit (4) + rollback (7)
- **Manifest + lockfile split** (3) is same shape as **plugin manifest +
  resolved versions** (2)
- **Declarative shape with code escape hatch** (1) is same as **hand-edited
  intent vs tool-managed facts** (3)
- **One clear contract per primitive** appears in plugins (2), subagents (6),
  tests (8)

If Godpowers is built around three load-bearing artifacts:
- `godpowers.yaml` (intent)
- `godpowers.lock` (facts)
- `events.jsonl` (history)

Almost every other architectural decision falls out from how those three relate.

---

## Sources

- [GitHub Actions: Workflow syntax](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions)
- [Tekton vs Argo Workflows](https://www.wallarm.com/cloud-native-products-101/cloud-native-ci-cd-pipelines-tekton-vs-argo)
- [Argo Workflows guide](https://www.cloudopsnow.in/argo-workflows/)
- [Buildkite: Dynamic pipelines](https://buildkite.com/docs/pipelines/configure/dynamic-pipelines)
- [VSCode: Extension manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [VSCode: Activation events](https://code.visualstudio.com/api/references/activation-events)
- [Helm: Plugins guide](https://helm.sh/docs/topics/plugins/)
- [Nx: Executors and configurations](https://nx.dev/docs/concepts/executors-and-configurations)
- [Lockfile design space](https://arxiv.org/html/2505.04834v1)
- [Bazel: BUILD files](https://bazel.build/concepts/build-files)
- [OpenTelemetry: Traces](https://opentelemetry.io/docs/concepts/signals/traces/)
- [OpenTelemetry Spans Explained](https://last9.io/blog/opentelemetry-spans-events/)
- [GitHub CLI manual](https://cli.github.com/manual/)
- [fly launch](https://fly.io/docs/flyctl/launch/)
- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Anthropic: Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Git reflog](https://git-scm.com/docs/git-reflog)
- [Terraform State Rollback](https://spacelift.io/blog/terraform-state-rollback)
- [kubectl rollout undo](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_rollout/kubectl_rollout_undo/)
- [Flyway: Rolling Back](https://www.baeldung.com/flyway-roll-back)
- [Rust RFC 2318: Custom test frameworks](https://rust-lang.github.io/rfcs/2318-custom-test-frameworks.html)
