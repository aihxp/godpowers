# Greenfield, Brownfield, Bluefield

> Three project archetypes. Each needs a different starting workflow.

## The three modes

| Mode | What it means | Code | Context |
|------|---------------|------|---------|
| **Greenfield** | Fresh slate | New | None |
| **Brownfield** | Existing legacy code | Existing | Existing (tribal) |
| **Bluefield** | New code, established context | New | Existing (org-level) |

## Decision tree

```
                    Where are you starting?
                            |
                            v
                   ┌── Existing code? ──┐
                   |                    |
                   YES                  NO
                   |                    |
                   v                    v
              BROWNFIELD          ┌── Existing org context? ──┐
                                  |                            |
                                  YES (bluefield)          NO (greenfield)
                                  |                            |
                                  v                            v
                            BLUEFIELD                    GREENFIELD
```

## Greenfield (most familiar)

Fresh directory. No existing code. No org constraints. Free choice.

**Workflow**:
```
/god-mode
```

Creates 10 of 14 artifacts during the arc; capture artifacts created lazily.
See [greenfield-coverage.md](greenfield-coverage.md).

## Brownfield (the hard one)

Inheriting code. May not understand it well. Convention exists but you didn't
make it. Tech debt of unknown scope. Original authors may be gone.

**The risk**: dive into changes without understanding -> break things, fight
existing patterns, miss tribal knowledge.

**Workflow**:
```
1. /god-preflight       <- intake audit before arc-ready and pillars
2. /god-archaeology     <- deep history + decisions + risks
3. /god-reconstruct     <- derive PRD/ARCH/ROADMAP/STACK from code
4. /god-tech-debt       <- assess and prioritize debt
5. /god-audit           <- score the reconstructed artifacts
6. (THEN start adding features)
   /god-feature         <- with full reconciliation against reconstructed plans
```

Or run as a workflow:
```
/god-mode --brownfield
```

This runs `brownfield-arc.yaml`: preflight -> archaeology -> reconstruct -> debt-assess -> audit.

### What's different from greenfield

| | Greenfield | Brownfield |
|---|---|---|
| Start with | empty dir | existing code |
| First step | /god-init | /god-preflight |
| Planning artifacts | Created | Reconstructed (with confidence levels) |
| Risk awareness | Low | HIGH (tribal knowledge, debt) |
| Pace | Fast | Slow at first; archaeology takes time |

### What reconstruction gives you

- PRD with [HYPOTHESIS] tags (because reverse-engineered)
- ARCH with confidence levels per section
- ROADMAP with a "Done" section (so we don't rebuild)
- STACK with [OPEN QUESTION] flip points (we don't know the original constraints)

Plus: the project can now use /god-reconcile, /god-feature, etc. with the
reconstructed planning as the basis.

### Recommended cadence

- Schedule a stakeholder review of reconstructed artifacts within 1-2 weeks
- Convert [HYPOTHESIS] -> [DECISION] as stakeholders confirm
- Address P0 tech debt before significant new features

## Bluefield (the in-between)

New project, but in an established organization. You have:
- Existing platform (auth service, observability, deploy)
- Org-wide conventions (style guides, branching, release cadence)
- Shared libraries
- Constraints (must use AWS, must emit OTel, security review required)

Your code is greenfield. Your context isn't.

**The risk**: build something that doesn't fit -> integration pain, security
audit failures, fighting org standards.

**Workflow**:
```
1. /god-org-context init   <- capture org-level standards
2. /god-preflight          <- inspect inherited context before arc-ready and pillars
3. /god-init               <- detects bluefield mode
4. /god-mode               <- arc constrained by org context
```

Or run as a workflow:
```
/god-mode --bluefield
```

This runs `bluefield-arc.yaml`: org-context -> preflight -> PRD -> ARCH (constrained) -> ...

### What's different from greenfield

| | Greenfield | Bluefield |
|---|---|---|
| Start with | empty dir | empty dir + org context |
| First step | /god-init | /god-org-context init, then /god-preflight |
| Stack choice | Free | Constrained by org standards |
| Architecture | Free | Must integrate with shared services |
| Deploy | Free | Must use org platform |
| Security | Standard | Plus org-specific requirements |

### What org-context.yaml captures

```yaml
apiVersion: godpowers/v1
kind: OrgContext
metadata:
  organization: <name>

standards:
  language: TypeScript
  formatter: Prettier
  linter: Biome
  test-framework: Vitest

infrastructure:
  cloud-provider: AWS
  deploy-platform: ECS
  ci-platform: github-actions
  observability: Datadog
  secret-manager: AWS Secrets Manager

shared-libraries:
  - { name: "@org/auth-client", purpose: "OAuth flows" }
  - { name: "@org/telemetry", purpose: "OTel + Datadog wiring" }

shared-services:
  - { name: auth-service, interface: REST, base-url: <internal-url> }

team-conventions:
  branching-strategy: trunk
  review-required: yes
  commit-style: conventional
  release-cadence: continuous

constraints:
  - "All services must emit OpenTelemetry traces"
  - "All public APIs must be versioned (/v1/, /v2/)"
  - "Production deploys require security review"
```

Once this exists, downstream agents respect it:
- god-stack-selector won't propose Python (org is TS)
- god-architect won't propose K8s (org uses ECS)
- god-deploy-engineer uses ECS + GitHub Actions
- god-observability-engineer uses Datadog
- god-harden-auditor checks the org-specific constraints

## Comparison: time-to-shipped feature

For a moderate feature (a few slices, end-to-end):

| Mode | Time | Why |
|------|------|-----|
| Greenfield | Fast | No constraints; no archaeology needed |
| Bluefield | Medium | Preflight plus constraints to respect; some integration work |
| Brownfield | Slow at start, then medium | Preflight and archaeology first; then like bluefield |

## Mode detection

god-orchestrator detects mode from disk signals:

| Signal | Mode |
|--------|------|
| Empty dir + no org-context.yaml | Greenfield (Mode A) |
| Empty dir + has org-context.yaml | Bluefield (Mode E) |
| Existing code + no .godpowers/ | Brownfield (Mode B) |
| Existing code + has .godpowers/ artifacts | Mode B (gap-fill) |

If detection is wrong, override:
```
/god-mode --greenfield
/god-mode --brownfield
/god-mode --bluefield
```

## Putting it together

A team's lifecycle might look like:

```
Year 1: Greenfield
   - First product
   - /god-mode runs full arc
   - Settle into a steady state

Year 2: Bluefield (within own org)
   - Build a second product/service
   - /god-org-context init from year-1 learnings
   - /god-preflight to inspect inherited constraints
   - /god-mode --bluefield, constrained appropriately

Year 3: Brownfield
   - Acquire a codebase OR inherit from a team that's leaving
   - /god-preflight + /god-archaeology + /god-reconstruct
   - Stakeholder review of reconstructed planning
   - Feature work with reconciliation
```

Godpowers handles all three. The key is detecting mode at /god-init and
running the right workflow from there.
