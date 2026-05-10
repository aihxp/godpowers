# RFC 0002: Workflow YAML v1

> Status: DRAFT
> Authors: Godpowers Team
> Created: 2026-05-09
> Targets: v0.5

## Summary

Replace implicit orchestration prose in `god-orchestrator` with declarative
workflow YAML files. Inspired by GitHub Actions shape with Buildkite's
dynamic upload trick for AI-generated steps.

## Motivation

Today's orchestrator has the workflow baked into prose. Issues:

1. **Adding a new workflow requires editing god-orchestrator** (one giant
   file)
2. **Workflows can't be versioned independently** of agents
3. **No way to test a workflow without running real LLMs**
4. **Community can't contribute custom workflows**
5. **Visualizing the DAG requires reading prose**

## Design

### File layout

```
workflows/
  full-arc.yaml         <- /god-mode default
  feature-arc.yaml      <- /god-feature
  hotfix-arc.yaml       <- /god-hotfix
  refactor-arc.yaml     <- /god-refactor
  spike.yaml            <- /god-spike
  postmortem.yaml       <- /god-postmortem
  migration-arc.yaml    <- /god-upgrade
  docs-arc.yaml         <- /god-docs
  deps-audit.yaml       <- /god-update-deps
  audit-only.yaml       <- /god-audit
  hygiene.yaml          <- /god-hygiene
```

User can add custom workflows at `.godpowers/workflows/<name>.yaml`.

### Schema

```yaml
apiVersion: godpowers/v1
kind: Workflow
metadata:
  name: full-arc
  version: 1.0.0

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
```

### Dynamic upload (Buildkite pattern)

Agents can emit additional jobs at runtime:

```yaml
- emit-jobs:
    - id: build-slice-1.1
      uses: god-executor@^1.0.0
      with:
        slice: 1.1
```

This is essential for the planner-emits-executors pattern.

## Tradeoffs

### Pros
- Workflows pluggable, versioned, testable
- DAG can be rendered for visualization
- Community can contribute workflows without touching core
- Test simulator can run workflows without LLM calls

### Cons
- New parser to write and maintain
- Migration from prose orchestrator (one-time cost)
- YAML expressiveness ceiling (mitigated by escape to TS SDK)

## Open Questions

1. JSON Schema for full validation? Or just type-check in TS?
2. How to express conditional logic (`if scale == small, skip arch`)?
   - Option A: a `when:` field with a tiny expression language
   - Option B: separate workflow files per scale
3. How to handle errors mid-workflow?
   - Built-in retry/skip semantics in the YAML
   - Or always defer to agent's pause/yolo logic
4. Should the parser support YAML aliases/anchors?
   - Useful for shared chunks but complicates the schema

## Migration from v0.4 (orchestrator prose)

1. v0.5: ship workflow runtime alongside existing orchestrator prose
2. v0.5.x: convert each workflow's prose to YAML one at a time
3. v0.6: orchestrator becomes thin wrapper over workflow runtime
4. v0.7: prose orchestration removed

## Related

- ARCHITECTURE.md section 4 (Workflow Definition Language)
- RFC 0001: State Model v1 (events.jsonl shape used by workflow runtime)
