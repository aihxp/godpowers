# Plan: Mode D + Address All Deferrals + Close Honest Gaps

Date: 2026-05-10
Status: PROPOSED (awaiting go-ahead)

## Goal

Five concrete outcomes:

1. **Implement Mode D** (multi-repo suite support) and the
   `god-coordinator` agent it depends on (the deferred Tier-0 peer to
   god-orchestrator).
2. **Complete Phase 7 routing-file sweep** (~25 routing/*.yaml files
   plus updates to beyond-arc workflow agents).
3. **Complete Phase 9 deferred docs** (4 missing/stale doc files).
4. **Improve runtime heuristics** (runtime-audit + runtime-test
   parseFlow improvements).
5. **Real-user validation** (dogfood-002 on a real project, not
   synthetic).

## Why now

Per the audit:

- 90% of the original plan shipped; the remaining 10% is administrative
  (routing metadata, docs) plus one real feature (Mode D).
- Real-user validation gap is the single biggest risk. Synthetic
  dogfood found one real bug; a real project will find more.
- god-coordinator was deferred "until parallel cross-tier coordination
  becomes a real need" - Mode D IS that need.

## Phased delivery

### Phase 12: god-coordinator + Mode D Foundation

The peer agent + multi-repo support. Mode D is the primary use case;
god-coordinator also supports single-repo parallel coordination as a
secondary benefit.

**New code (4):**
- `lib/multi-repo-detector.js` - detect multi-repo workspace:
  - Multiple `.godpowers/` dirs under a common parent
  - `.godpowers/suite-config.yaml` in a hub repo declaring siblings
  - Explicit invocation via `/god-suite-init`
- `lib/cross-repo-linkage.js` - extend linkage to span repos:
  - Repo-qualified IDs: `repo-name:P-MUST-01`
  - Cross-repo orphan detection
  - Cross-repo impact analysis ("changing C-auth-service in
    shared-libs affects 5 sibling repos")
- `lib/meta-linter.js` - cross-repo invariant checks:
  - Byte-identical files across repos (LICENSE, .editorconfig, etc.)
  - Version table consistency (per-repo Node version, shared deps)
  - Shared standards drift (one repo uses Biome, others use ESLint)
- `lib/suite-state.js` - aggregated multi-repo state manager
  - Reads each repo's `state.json`
  - Writes `.godpowers/suite/STATE.md` (human) and
    `.godpowers/suite/state.json` (machine)
  - Tracks suite-level metrics (total artifacts, total drift, total
    pending reviews)

**New agents (2):**
- `agents/god-coordinator.md` - Tier-0 peer to god-orchestrator
  - Owns the suite (not individual repos)
  - Coordinates byte-identical file sync across repos
  - Coordinates releases (when repo A bumps version, scan B/C/D for
    impact)
  - Spawns per-repo god-orchestrator for arc work inside each repo
  - Aggregates suite-level state
  - Never bypasses individual orchestrators (the Quarterback rule
    holds per-repo)
- `agents/god-suite-syncer.md` - executes byte-identical file
  propagation under god-coordinator's direction

**New skills (5):**
- `skills/god-suite-init.md` - register a multi-repo workspace
- `skills/god-suite-status.md` - show all repos' status side-by-side
- `skills/god-suite-sync.md` - propagate byte-identical files
- `skills/god-suite-release.md` - coordinate release across siblings
- `skills/god-suite-patch.md` - coordinated change across multiple repos

**New artifacts:**
- `.godpowers/suite-config.yaml` (in hub repo): declares siblings,
  byte-identical files, shared standards, version table
- `.godpowers/suite/STATE.md` (in hub repo): aggregated state
- `.godpowers/suite/SYNC-LOG.md` (in hub repo): history of suite-level
  syncs

**Updates:**
- `agents/god-orchestrator.md`: aware of suite mode (Mode D); knows
  to expect god-coordinator as peer when active
- `lib/state.js`: add `suite-mode: bool` field
- `skills/god-init.md`: detect multi-repo and offer Mode D init

**Behavioral tests:**
~40 tests covering:
- Multi-repo detection across 4 signal types
- Cross-repo linkage queries
- Meta-linter byte-identical file checks
- Meta-linter version table consistency
- Suite state aggregation
- Coordinator spawning per-repo orchestrators
- Suite sync propagating files

**Acceptance:**
- `/god-suite-init` on a directory containing 3 sibling `.godpowers/`
  dirs registers them; `/god-suite-status` shows all three
- Editing a byte-identical file in one repo is detected by
  `/god-suite-sync`; user confirms; file is propagated
- A version bump in repo A triggers a suggested suite-level review
- Per-repo `/god-mode` still works exactly as before; suite mode is
  additive, not replacing

### Phase 13: Phase 7 Routing-File Sweep (the deferral)

The 25 routing YAMLs and beyond-arc workflow agents that were
acknowledged-deferred in Phase 7's commit. Mechanical but real.

**Updates to ~25 routing/*.yaml files:**

Each gets:
- `have-nots` entries mapped to validator codes (U-08, P-04, etc.)
  matching what `lib/have-nots-validator.js` actually catches
- `endoff.events` augmented with new linkage events
  (`linkage.snapshot`, `drift.detected`, `review-required.populated`)
- `success-path` chains to `/god-scan` for code-touching workflows
  (god-build, god-feature, god-hotfix, god-refactor, god-update-deps)
- Cross-references to the 5 external integrations where relevant
  (impeccable bridge for design-touching workflows; awesome-design
  for /god-design-from)

**Updates to beyond-arc workflow agents:**
- `agents/god-feature.md`: emit stable P-MUST IDs in PRD delta;
  trigger reverse-sync after build wave
- `agents/god-hotfix.md`: hot-fix code annotated with
  `// Fixes: P-MUST-NN` or `// Fixes: incident-NNN`; PRD/POSTMORTEM
  updated
- `agents/god-refactor.md`: ARCH container assignments updated
  post-refactor; drift detection fires
- `agents/god-spike.md`: SPIKE.md gets `Informs: P-MUST-NN` footer
  when findings reshape the PRD
- `agents/god-postmortem.md`: POSTMORTEM.md links findings to
  HARDEN, OBSERVE, PRD as appropriate
- `agents/god-upgrade.md`: STACK/DECISION.md updated with new
  version; impact analysis surfaces affected code
- `agents/god-docs.md`: docs linked to artifacts they document
- `agents/god-update-deps.md`: STACK/DECISION.md changes;
  reverse-sync records new dep usage

**Behavioral tests:**
~30 tests, one per touched workflow asserting it now emits the right
events and triggers reverse-sync.

**Acceptance:** every routing/*.yaml has its `have-nots` mapped to
real validator codes; no orphan or made-up codes remain. Each
beyond-arc workflow agent's contract documents linkage and reverse-sync
participation.

### Phase 14: Phase 9 Deferred Documentation

The 4 doc files originally planned in Phase 9 but skipped.

**New docs:**
- `docs/design-md.md` (~200 lines): DESIGN.md format guide for
  end users. When to use it, how the YAML frontmatter is parsed,
  how to add components, how to use token references, how to
  validate (god-design lint, npx @google/design.md lint, npx
  impeccable detect, runtime audit). Worked example pointing to
  `examples/saas-mrr-tracker/DESIGN.md`.
- `docs/validation.md` (~250 lines): the lint system explanation.
  Mechanical vs interpretive checks, the 99 have-nots taxonomy,
  how validator codes map to refs, how /god-lint integrates with
  /god-audit, how the runtime axis adds to the static axis.

**Updates:**
- `docs/concepts.md`: update artifact count (14 -> 15+, since
  DESIGN/PRODUCT can both be active); mention all 5 external
  integrations in the Concepts section; add the three verification
  axes (static / linkage / runtime) to the gates section
- `docs/greenfield-coverage.md`: artifact count update; mention
  conditional DESIGN/PRODUCT slots; explain detection-driven Tier 1
  routing
- `docs/recipes.md`: add 3 new recipes:
  - "Use a known site as design baseline" (catalog flow)
  - "Verify the running app matches design" (runtime audit flow)
  - "Scan unknown site for design extraction" (SkillUI fallback flow)
- `docs/getting-started.md`: install instructions for agent-browser
  (`npm install -g agent-browser`), impeccable
  (`npx skills add https://github.com/pbakaus/impeccable`), and
  awesome-design-md (no install; lazy fetch) for users who want
  the full design pipeline

**Behavioral tests:** none (docs are content). validate-skills.js
will pick up the new doc files and verify they have substantive content.

**Acceptance:** all referenced docs exist; greenfield-coverage.md
agrees with the implementation; recipes.md has the 3 new entries.

### Phase 15: Runtime Heuristic Improvements

The runtime modules use simple heuristics for v1. Improve them.

**Updates:**
- `lib/runtime-audit.js`:
  - Expand `DEFAULT_SELECTORS` from 6 to ~20 (forms, navigation,
    cards-by-variant, etc.)
  - Smarter component matching: walk DESIGN.md components map and
    auto-derive selectors via `data-design-component="<id>"` attribute
    convention
  - Visual regression diffing: store baseline screenshots; compare
    new runs to baseline; flag pixel-level differences > threshold
  - axe-core integration option: when axe-core is available, use it
    for richer accessibility audits beyond contrast
- `lib/runtime-test.js`:
  - Better `parseFlow`: support more verb forms (presses, fills,
    enters, types, clicks on, taps, etc.)
  - Support sequential expectations ("then sees X")
  - Support negative expectations ("does NOT see X")
  - Optional fallback: when parseFlow returns null, the agent that
    wrote the PRD can be re-prompted to clarify the acceptance into
    runnable steps
  - Test fixture isolation: support per-test setup/teardown via
    PRD comment annotations

**Behavioral tests:** ~25 new tests for the expanded selectors,
visual regression baseline-and-compare, expanded parseFlow verb
recognition.

**Acceptance:** the synthetic dogfood project's PRD with verb-rich
acceptance criteria parses into runnable flows for >80% of P-MUST
requirements (up from current ~50%).

### Phase 16: Real-User Validation (dogfood-002)

The synthetic dogfood-001 found one real bug. A real-user run will
find more.

**Approach:**
1. Pick a real small project (~1000 LOC, has UI, has CI). Options:
   - The godpowers repo itself (meta-validation)
   - A simple SaaS-style sandbox (the saas-mrr-tracker exemplar
     could be implemented in real code)
   - A user-volunteered open-source project
2. Run `/god-init`, then `/god-mode` (or step through tiers
   manually if the AI session is restricted)
3. Document each step's result in `.planning/dogfood-002-results.md`:
   - What worked first try
   - What needed a manual nudge
   - What broke (and the bug type: lint, linkage, design, runtime,
     orchestration)
4. For each broken step: file an issue; fix in this phase if the
   fix is small; otherwise log as known issue
5. Run `/god-test-runtime` against the running app
6. Run `/god-suite-init` if it's a multi-repo setup; verify Mode D
   detection
7. Run `/god-context on` to populate AGENTS.md / CLAUDE.md fences;
   verify they read correctly in a fresh AI session

**Acceptance:**
- All 18 test suites still pass
- The dogfood-002 results document captures every real-world finding
- Critical bugs (those that block /god-mode completion) are fixed
  before declaring Phase 16 complete
- Non-critical findings (improvements, polish) are logged as known
  issues for future commits

**Honest expectation:** this phase is the most valuable one. The
others are implementation; this one validates the implementation
matches reality. Plan for at least 2 fix-and-iterate cycles.

## Scope summary

| Category | Net new |
|---|---|
| New lib modules | 4 (multi-repo-detector, cross-repo-linkage, meta-linter, suite-state) |
| New agents | 2 (god-coordinator, god-suite-syncer) |
| New skills | 5 (suite-init, suite-status, suite-sync, suite-release, suite-patch) |
| New routing files | 5 (one per suite skill) |
| Routing/*.yaml files updated | ~25 |
| Beyond-arc agents updated | 8 |
| New behavioral tests | ~95 (40 multi-repo + 30 routing sweep + 25 runtime heuristics) |
| New docs | 2 (design-md.md, validation.md) |
| Updated docs | 4 (concepts, greenfield-coverage, recipes, getting-started) |
| Real-user validation | 1 dogfood-002 run with iteration |

## Sequencing rationale

Phase 12 first because: god-coordinator and Mode D are the biggest
new feature; building it surfaces design questions that influence
the smaller phases.

Phase 13 second because: routing sweep is mechanical but blocks
Phase 14's documentation accuracy claims.

Phase 14 third because: docs after the implementation reflects
reality, not aspiration.

Phase 15 fourth because: heuristic improvements benefit from any
runtime issues surfaced in earlier phases.

Phase 16 last because: real-user validation needs all prior phases
to be in a stable state before testing them under real load.

## Estimated effort

Each phase is one focused work session of 60-180 minutes. Phase 16
is open-ended (depends on findings).

| Phase | Estimated time |
|---|---|
| 12: Mode D + coordinator | 90-180 min |
| 13: routing sweep | 60-90 min |
| 14: docs | 60-90 min |
| 15: heuristic improvements | 60-90 min |
| 16: real-user validation | 60-180 min + iteration |

Total: 5-12 sessions of focused work. Could run in parallel for
phases 13-15 (no dependencies).

## Resolved questions (locked in)

1. **Sibling discovery: explicit `suite-config.yaml` declaration only.**
   No auto-discovery via parent walks. Users register siblings.

2. **Byte-identical drift: warnings by default; `--strict` flag for hard gate.**
   Default mode surfaces in REVIEW-REQUIRED.md. Strict mode blocks
   release if drifted.

3. **Dogfood scope: BOTH godpowers itself and a sandbox/real project.**
   Meta-validation against godpowers' own repo + a clean external
   project to catch "works on built-by-itself" bias.

4. **Phase 13 routing sweep: core only.**
   The 10 extension routing files are owned by extension authors
   and may have their own conventions. Document the new validator
   codes; let extensions adopt at their own pace.

5. **Visual regression: ship the diffing tool.**
   Users won't know to capture baselines first time. The tool
   captures the baseline on first run, compares on subsequent runs.

## Success criteria for the whole plan

After Phases 12-16:

- [ ] `/god-suite-init` detects and registers a 3-repo workspace
- [ ] `/god-suite-status` reports per-repo state in a single view
- [ ] All 25 routing/*.yaml files have correct have-nots, events,
      success-path
- [ ] All 8 beyond-arc agents call reverse-sync on completion
- [ ] `docs/design-md.md` and `docs/validation.md` exist
- [ ] `docs/concepts.md`, `docs/greenfield-coverage.md`,
      `docs/recipes.md`, `docs/getting-started.md` reflect v0.11+
      reality
- [ ] runtime-audit covers 20+ default selectors
- [ ] runtime-test parseFlow recognizes 8+ verb forms
- [ ] dogfood-002 documents real-world findings
- [ ] All bugs surfaced by dogfood-002 are fixed (or logged as
      known issues)
- [ ] Test suite at 1330+ tests across 19+ suites (was 1235 across 18)
- [ ] CHANGELOG.md entry for v0.12.0 covers everything

## Next action

Awaiting go-ahead. On approval, start with Phase 12.
