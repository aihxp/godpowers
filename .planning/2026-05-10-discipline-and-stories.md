# Plan: Close Agent Discipline + Story-File Workflow Gaps

Date: 2026-05-10
Status: PROPOSED

## Goal

Close the two parent-comparison gaps identified:
1. **Agent discipline** (Superpowers' lead)
2. **Story-file workflow** (BMAD's lead)

Without breaking what we have. Both phases are ADDITIVE, not refactors.

## Phase 17: Agent Discipline

Tighten agent contracts and add machine-checked enforcement.

### What's wrong today

- 35+ agents; some have implicit boundaries
- Hand-off contracts documented in agent-specs.md but not enforced
- Some agents lack explicit Have-Nots / Outputs sections
- No way to mechanically detect "agent X claims to write Z but
  routing says agent Y owns Z"

### What gets built

**New lib (1):**
- `lib/agent-validator.js`: parses each `agents/*.md`, validates:
  - Required frontmatter (`name`, `description`, `tools`)
  - Required sections (Have-Nots, Inputs, Outputs, Handoff or
    equivalent) - flexible but checked
  - Hand-off targets (every "Spawned by:" reference exists)
  - Output paths match `routing/<command>.yaml` writes
  - No duplicate output paths across agents (dual-ownership)
  - "Triggers" matches at least one routing file's `spawns` list

**New skill:**
- `skills/god-agent-audit.md`: `/god-agent-audit`
  - Runs lib/agent-validator across all agents
  - Reports findings (severity-tiered)
  - Optional `--fix` flag to auto-add missing sections (with placeholder)

**Targeted contract tightening (5-10 agents):**

Pass through these and ensure each has crisp Have-Nots, Outputs,
Handoff sections:

- god-pm
- god-architect
- god-roadmapper / god-roadmap-updater / god-roadmap-reconciler
  (clarify the boundary; documented in roadmap-related docs)
- god-stack-selector
- god-planner
- god-executor
- god-spec-reviewer
- god-quality-reviewer
- god-deploy-engineer
- god-launch-strategist

For each: add explicit "I do not do X" boundary list.

**Behavioral tests (~25):**
- Validator parses agent files correctly
- Detects missing required sections
- Detects hand-off targets that don't exist
- Detects dual-ownership of output paths
- /god-agent-audit produces structured findings

### Acceptance

- Every `agents/*.md` passes `/god-agent-audit` cleanly
- The audit catches a deliberate violation (e.g., add a fake agent
  claiming to write PRD.md - audit flags it)
- 0 dual-ownership warnings
- 0 hand-off targets to nonexistent agents

## Phase 18: Story-File Workflow

Add STORY.md as a finer-grained unit between /god-feature (feature
slice) and individual code commits. Complements, doesn't replace.

### What's missing today

- `/god-feature` operates at "feature" granularity (could be 100s of LOC)
- No story-file pattern for incremental delivery
- No way to track multiple stories in flight
- No story-level acceptance verification

### What gets built

**New artifact: STORY.md**

Schema:
```yaml
---
id: STORY-feature-slug-001
title: "Short noun phrase"
status: pending | in-progress | blocked | done
owner: who-is-implementing
deps: [STORY-other-001, STORY-...]
created: 2026-05-10
---

## User Story

As a [persona], I want [capability] so that [outcome].

## Acceptance Criteria

- [DECISION] User can do X. Acceptance: ...runnable flow...
- [DECISION] System shows Y. Acceptance: ...

## Slice Plan

1. Step 1
2. Step 2
3. Step 3

## Notes

(Optional context, decisions, open questions during implementation)
```

Lives at `.godpowers/stories/<feature-slug>/STORY-<NNN>.md`.

**New agent:**
- `agents/god-storyteller.md`:
  - Writes STORY.md from user prompt
  - Validates user-story format ("As a X, I want Y so that Z")
  - Acceptance criteria parseable by `lib/runtime-test.parseFlow` (Phase 15)
  - Generates initial slice-plan (3-7 steps max)

**New skills (5):**
- `skills/god-story.md`: write a new story
- `skills/god-stories.md`: list all stories grouped by status
- `skills/god-story-build.md`: implement a story slice
- `skills/god-story-verify.md`: runtime-test the story's acceptance
- `skills/god-story-close.md`: mark done; append linkage to roadmap

**Linkage extension:**

8th stable ID type added:
- STORY-{slug}-NNN (e.g., STORY-auth-001)

`lib/linkage.js`: add to ID_PATTERNS
`lib/code-scanner.js`: recognize `// Implements: STORY-auth-001`

**Updates:**
- `lib/state.js`: new `tier-2.stories` slot tracking active/done stories
- `agents/god-roadmapper.md`: stories chain into milestones
- `agents/god-orchestrator.md`: aware of in-progress stories at pause points
- `agents/god-feature.md`: optional decomposition into stories before build
- `docs/recipes.md`: new "story-driven feature delivery" recipe

**Routing:**
- 5 new routing files: god-story, god-stories, god-story-build,
  god-story-verify, god-story-close

**Behavioral tests (~35):**
- Story-validator parses STORY.md correctly
- User-story format check ("As a X, I want Y so that Z")
- Acceptance criteria parseable by parseFlow
- Story status transitions (pending -> in-progress -> done/blocked)
- Story dep cycles detected
- Linkage map recognizes STORY-* IDs
- code-scanner picks up STORY annotations
- /god-stories filters by status
- /god-story-verify runs parseFlow + runtime test on acceptance
- /god-story-close updates roadmap

### Acceptance

- A user can write a story via `/god-story`, see it via `/god-stories`,
  build it via `/god-story-build`, verify it via `/god-story-verify`,
  close it via `/god-story-close`
- STORY-* IDs flow through the linkage map like any other stable ID
- Code annotated `// Implements: STORY-auth-001` is picked up by
  /god-scan and surfaces in PRD's Implementation Linkage footer (via
  the STORY -> roadmap -> PRD chain)
- /god-feature can optionally decompose into stories before build

## Scope summary

| Category | Net new |
|---|---|
| New lib modules | 1 (agent-validator) |
| New agents | 1 (god-storyteller) |
| New skills | 6 (god-agent-audit + 5 story skills) |
| Updated agents | 5-10 (contract tightening) + 3 (orchestrator, roadmapper, feature) |
| New routing files | 6 (5 story + 1 agent-audit) |
| Behavioral tests | ~60 (~25 validator + ~35 story) |
| State.json schema additions | 1 (tier-2.stories slot) |
| Stable ID types | 7 -> 8 (added STORY-) |

## What stays the same

- /god-mode autonomous arc (unchanged)
- /god-feature workflow (story decomposition is OPT-IN; not required)
- All existing slash commands (no removals or renames)
- 5 external integrations (unchanged)
- Test suite (1337 tests stay green; ~60 new tests added)
- Verification axes (static / linkage / runtime; unchanged)
- Mode D coordination (unchanged)

## Sequencing rationale

Phase 17 first because: agent discipline gives us a validator
infrastructure that Phase 18's new agent (god-storyteller) can be
checked against from day one.

Phase 18 second because: stories add a new ID type and workflow that
benefits from lint discipline already in place.

## Estimated effort

| Phase | Estimated time |
|---|---|
| 17: agent discipline | 90-120 min |
| 18: story workflow | 120-180 min |

Total: 3.5-5 hours of focused work.

## Open questions

1. **Should `/god-agent-audit` be wired into npm test?**
   (Recommendation: yes; treat agent contract violations as test
   failures so they can't slip in.)

2. **Should `/god-feature` decompose to stories automatically or only
   when user requests?**
   (Recommendation: opt-in via flag `--with-stories`; default
   unchanged. Don't surprise existing users.)

3. **Should story IDs be globally unique or feature-scoped?**
   (Recommendation: feature-scoped slug + sequential number, e.g.,
   `STORY-auth-001`. Easier to read; no collision risk because the
   slug is namespaced.)

4. **Should story acceptance criteria be REQUIRED to parse via
   parseFlow, or just recommended?**
   (Recommendation: recommended; warn if can't parse; don't block.
   Some acceptance criteria are inherently human-judged.)

5. **Should god-storyteller use impeccable for story-aware UX writing?**
   (Recommendation: only if the story is UI-affecting; bridge call
   to `/impeccable clarify` for the user-facing strings in the story.)

## Recommended answers (lock-in)

Based on the leans above:
- Q1: yes, wire into npm test
- Q2: opt-in via `--with-stories` flag on /god-feature
- Q3: feature-scoped slug + sequential
- Q4: recommended, not required (warn only)
- Q5: only when UI-affecting

## Next action

Awaiting go-ahead. On approval, start with Phase 17.
