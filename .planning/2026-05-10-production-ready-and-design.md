# Plan: Production-Ready Artifacts + DESIGN.md + Bidirectional Code-Artifact Awareness

Date: 2026-05-10
Status: PROPOSED (awaiting go-ahead)

## Goal

Three integrated outcomes:

1. **Artifacts are mechanically validated** (close the 8 production-readiness gaps).
2. **DESIGN.md (Google Labs spec) is integrated** as a 5th Tier 1 sub-step,
   conditional on UI presence.
3. **Continuous bidirectional awareness between code and artifacts**: when a
   source-of-truth artifact changes, every downstream consumer is identified
   and surfaced for review; when code changes, artifacts are updated to
   reflect reality, drift is detected, and the linkage is documented.

The third outcome is the new big one. It means **no workflow is allowed to
operate in isolation**. Every existing slash command (the 60+ skills) participates
in maintaining the code-artifact linkage. The system never loses sight of
what the code is doing or how it relates to the documented decisions.

## Why this matters

Currently:

1. The 99 have-nots are documented as checklists but **not mechanically validated**.
2. Agents self-report compliance with no second check.
3. UI work has no source of truth, so agents forget visual identity decisions.
4. **There is no linkage between code and artifacts.** A requirement P-MUST-01
   exists in PRD.md but nothing tracks which file implements it. A token
   `colors.primary` exists but nothing knows which components use it. ADR-007
   describes a decision but nothing flags when code violates it.
5. **Workflows operate in isolation.** /god-build produces code without scanning
   for impact on PRD/ARCH/DESIGN. /god-refactor changes structure without
   updating ARCH containers. /god-update-deps modifies STACK without checking
   what else assumed the old version. Every workflow is a silo.

After this plan:

1. `npx godpowers lint <artifact>` returns structured findings.
2. Agents must pass lint before declaring done.
3. DESIGN.md exists for UI projects, validated against Google Labs spec.
4. **Every artifact has a usage map**: PRD requirements → code files, ADRs → code
   patterns, design tokens → component files.
5. **Every workflow participates in linkage maintenance.** /god-build scans
   what was built and updates linkage. /god-refactor updates ARCH. /god-hotfix
   notes which PRD requirement was the bug fix. /god-spike findings link back
   to PRD. Nothing happens in code that the system doesn't know about.
6. **Drift is automatically detected.** Code that says one thing while ARCH or
   DESIGN says another is flagged in /god-status and /god-sync.
7. **Past work is identified when upstream changes.** Change a token, get a
   list of components needing review. Change a requirement, get a list of
   build slices needing review.

## Phased delivery (independently shippable)

### Phase 1: Validation Foundation

The missing layer everything else builds on.

**New code:**
- `lib/artifact-linter.js` - per-artifact mechanical have-nots checker
- `lib/artifact-diff.js` - regression detection between artifact versions
- `lib/have-nots-validator.js` - registry of mechanical checks (em-dash,
  three-label, generic-noun, phantom-reference, etc.)

**New skills/agents:**
- `skills/god-lint.md` - `/god-lint [path]`
- Updates to `agents/god-auditor.md` - actually run validators

**Tests:** `scripts/test-artifact-linter.js`, `scripts/test-artifact-diff.js`
(~50 behavioral tests)

**Wires up:**
- Every Tier 1+ agent must call `lintArtifact()` before declaring done
- `routing/<command>.yaml` `have-nots` entries become validator codes

**Mechanical checks delivered first** (the easy wins, ~30 of 99 have-nots):
- U-08 em/en dash, U-09 emoji
- U-02 unlabeled sentences
- U-10 phantom references
- U-11 future-dated timestamps
- P-04 metric without timeline
- P-05 metric without measurement method
- P-08 open question without owner
- P-09 open question without due date
- A-04 NFR not mapped to architectural choice
- ... full list in implementation

**Substitution test (partial):** flag sentences containing only generic nouns
(users, developers, scalable, robust, modern, intuitive, seamless) without
specific quantifiers or proper nouns.

**Acceptance:** running `/god-lint` on a deliberately-broken PRD produces
the right findings; running on a known-good PRD produces zero findings.

### Phase 2: Exemplars and Antipatterns Parity

**New examples** (under `examples/`):
- `examples/saas-mrr-tracker/` - full PRD, ARCH, ROADMAP, STACK, DESIGN.md
- `examples/cli-tool/` - PRD, ARCH, ROADMAP, STACK (no DESIGN, backend-only)

**New antipattern references:**
- `references/planning/ROADMAP-ANTIPATTERNS.md`
- `references/planning/STACK-ANTIPATTERNS.md`
- `references/building/BUILD-ANTIPATTERNS.md`
- `references/shipping/DEPLOY-ANTIPATTERNS.md`
- `references/shipping/OBSERVE-ANTIPATTERNS.md`
- `references/shipping/HARDEN-ANTIPATTERNS.md`
- `references/shipping/LAUNCH-ANTIPATTERNS.md`
- `references/design/DESIGN-ANTIPATTERNS.md` (new tier)
- `references/design/DESIGN-ANATOMY.md` (new tier)

Each parallels the depth of the existing `PRD-ANTIPATTERNS.md` (8 named
antipatterns with sample / why-it-fails / fix).

**Acceptance:** every artifact has a paired ANATOMY (positive guide) and
ANTIPATTERNS (negative guide); two complete exemplar projects exist.

### Phase 3: Design Foundation (Impeccable + DESIGN.md + PRODUCT.md)

Adopts the
[Impeccable design skill](https://github.com/pbakaus/impeccable) as the
design intelligence layer and the
[Google Labs design.md spec](https://github.com/google-labs-code/design.md)
as the file format. Critical finding: impeccable's DESIGN.md format IS the
Google Labs spec (impeccable's `teach.md` says: "Follows the Google Stitch
DESIGN.md format"). They converge, no format war.

Godpowers does NOT reimplement impeccable. It detects, integrates, and
ensures impeccable participates in the lifecycle (linkage, reverse-sync,
REVIEW-REQUIRED.md). Conversely, every UI-touching workflow can call
impeccable's 23 commands and validators.

#### Two complementary root files (both used)

| File | Owner | Purpose |
|---|---|---|
| `PRD.md` | Godpowers (god-pm) | Functional requirements, NFRs, scope, success metrics |
| `PRODUCT.md` | Impeccable (`/impeccable teach`) | Register (brand vs product), users, brand personality, anti-references, strategic design principles |
| `DESIGN.md` | Impeccable + god-designer | Visual tokens (Google Labs spec) + rationale prose |

PRD says "what to build." PRODUCT says "how it should feel." DESIGN says
"the visual language." All three coexist for UI projects.

#### Detection-then-use installation strategy

Godpowers does not vendor impeccable. It detects and uses:

1. `lib/design-detector.js` checks for impeccable presence:
   - `node_modules/impeccable` (CLI), or
   - `.claude/skills/impeccable/`, `.cursor/skills/impeccable/`, etc.
2. If installed: god-designer delegates to impeccable's `teach`, `document`,
   `polish`, `critique`, `audit`, etc.
3. If not installed but UI detected: god-init prompts:
   ```
   This project has UI. Install Impeccable for design discipline?
     yes        - npm i -g impeccable + copy skill files for detected tools
     no         - skip; godpowers will use minimal built-in design checks
     never-ask  - never ask again
   ```
4. Persists answer to `state.json` under `project.impeccable-prompt-answered`

#### New code

- `lib/design-detector.js` - "is UI present? is impeccable installed? where?"
  reads stack DECISION.md and scans tool dirs
- `lib/design-spec.js` - parse + validate Google Labs design.md spec
  (YAML frontmatter schema, section order, token reference resolution,
  WCAG contrast pre-check). Format-only, complements impeccable's
  anti-pattern checks.
- `lib/impeccable-bridge.js` - thin invocation layer
  - `runDetect(path)` - shells out to `npx impeccable detect <path>` and
    parses JSON findings
  - `runCommand(cmd, args)` - dispatches an impeccable command via the
    user's primary AI tool (records command in events.jsonl)
  - `isInstalled()` - presence check across CLI + skill dirs

#### New artifacts

- `templates/DESIGN.md` - Google Labs-conformant starter (matches impeccable's)
- Project root `DESIGN.md` (canonical, matches both Google Labs + impeccable)
- Project root `PRODUCT.md` (impeccable's strategic file)
- `.godpowers/design/STATE.md` - Godpowers metadata (lint history, version,
  impeccable command log)

#### New agents

- `agents/god-designer.md` - lifecycle owner of DESIGN.md + PRODUCT.md
  - Detects impeccable; if present, delegates `teach` / `document` flows
  - If absent, falls back to a minimal builder using PRD/ARCH/STACK
  - Validates with `npx @google/design.md lint` AND `npx impeccable detect`
    when available
  - Owns the `.godpowers/design/STATE.md` lint history

- `agents/god-design-reviewer.md` - two-stage review gate
  - Mirrors the existing `god-spec-reviewer` + `god-quality-reviewer`
    pattern from code review, but as a single agent because design intent
    and design quality are tightly coupled
  - **Stage 1 (spec)**: reads PRODUCT.md for register, brand personality,
    anti-references; dispatches `/impeccable critique` on the diff;
    verdict: aligned | misaligned | needs-discussion
  - **Stage 2 (quality)**: validates against Google Labs design.md spec;
    runs WCAG contrast checks via `lib/design-spec.js`; dispatches
    `/impeccable audit`; resolves token references; verdict:
    passes | warnings | errors
  - **Aggregate verdict**: PASS (continue to impact analysis) /
    WARN (continue with warnings logged) / BLOCK (abort propagation)
  - Spawned by `god-design-updater` BEFORE impact analysis runs (gate)
  - On BLOCK: appends to `.godpowers/design/REJECTED.md` for audit trail
  - Emits `design.review-verdict` event to events.jsonl

#### New skills

- `skills/god-design.md` - user-facing front door
  - `/god-design` - run full design flow (delegates to impeccable teach if
    present, else falls back)
  - `/god-design refresh` - rebuild DESIGN.md from current code
    (delegates to /impeccable document)
  - `/god-design critique [scope]` - design review
    (delegates to /impeccable critique)
  - `/god-design audit [scope]` - technical quality
    (delegates to /impeccable audit)
  - `/god-design polish [scope]` - shipping pass
    (delegates to /impeccable polish)
  - `/god-design status` - lint findings + drift report

#### New routing

- `routing/god-design.yaml`

#### Updates

- `routing/god-stack.yaml` - next-recommended -> /god-design when UI detected
- `agents/god-orchestrator.md` - conditional design step in Tier 1
- `lib/state.js` - add `tier-1.design` slot, `project.impeccable-prompt-answered`
- `lib/context-writer.js` - DESIGN.md + PRODUCT.md pointers in AGENTS.md
  fence when present
- `agents/god-reconciler.md` - DESIGN.md as 15th artifact, PRODUCT.md as 16th
- `agents/god-updater.md` - design refresh on /god-sync; runs
  `/impeccable critique` on touched UI when DESIGN.md changes
- `skills/god-init.md` - one-time prompt for impeccable installation

#### Tests

`scripts/test-design-detector.js`, `scripts/test-design-spec.js`,
`scripts/test-impeccable-bridge.js` (~50 behavioral tests covering
frontend detection, schema validation, token reference resolution,
section order, impeccable presence detection across all tool dirs,
bridge command dispatch)

#### Acceptance

- `/god-design` on a UI project with impeccable installed produces both
  PRODUCT.md and DESIGN.md, both validated by impeccable + Google Labs lint
- Backend-only projects skip with status `not-required`
- A UI project without impeccable still produces a valid (if more
  minimal) DESIGN.md via god-designer's fallback path
- `/god-design critique` returns impeccable findings as part of /god-status

### Phase 4: Bidirectional Linkage Foundation (the new big one)

The infrastructure that makes Phase 5-7 work. Every artifact element gets
a stable identifier; code references those identifiers; both directions are
queryable.

**Stable IDs across all artifacts:**

| Artifact | ID format | Example |
|---|---|---|
| PRD requirement | `P-{MUST,SHOULD,COULD}-NN` | `P-MUST-01` |
| ARCH ADR | `ADR-NNN` | `ADR-007` |
| ARCH container | `C-{slug}` | `C-auth-service` |
| ROADMAP milestone | `M-{slug}` | `M-launch-v1` |
| STACK decision | `S-{slug}` | `S-postgres-15` |
| DESIGN token | YAML path | `colors.primary` |
| DESIGN component | `D-{slug}` | `D-button-primary` |

**Linkage discovery mechanisms:**

1. **Comment annotations** in code: `// Implements: P-MUST-01`, `// ADR-007`,
   `// Token: {colors.primary}`
2. **Filename heuristics**: `src/auth/` for `C-auth-service`,
   `src/components/Button.tsx` for `D-button-primary`
3. **Import analysis**: importing a STACK dep links the file to that decision
4. **Style-system parsing**: tokens used in CSS/styled-components
5. **Test descriptions**: `describe('P-MUST-01: user can log in', ...)`
6. **Manual entries** via `/god-link <artifact-id> <code-path>`

**New code:**
- `lib/linkage.js` - core linkage map manager
  - Reads/writes `.godpowers/links/artifact-to-code.json`
  - Reads/writes `.godpowers/links/code-to-artifact.json`
  - Methods: addLink, removeLink, queryByArtifact, queryByFile, listOrphans
- `lib/code-scanner.js` - scans codebase for linkage signals
  - Comment annotations (regex per language)
  - Filename heuristics (configurable)
  - Import analysis (parse imports, match to STACK deps)
  - Style-system parsing (CSS, styled-components, Tailwind classes)
  - Test description parsing
- `lib/drift-detector.js` - compares declared vs actual
  - For each linked code file: does its content match the linked artifact's
    stated decisions?
  - Per-artifact drift checks: ARCH (container responsibilities),
    DESIGN (token values), STACK (dep versions)

**New artifacts:**
- `.godpowers/links/artifact-to-code.json` - forward map
- `.godpowers/links/code-to-artifact.json` - reverse map
- `.godpowers/links/LINKAGE-LOG.md` - append-only history
- `.godpowers/links/ORPHANS.md` - artifact elements with no implementing code

**Tests:** `scripts/test-linkage.js`, `scripts/test-code-scanner.js`,
`scripts/test-drift-detector.js` (~60 behavioral tests covering ID parsing,
linkage building, drift detection per artifact type)

**Acceptance:** scan a codebase, confirm linkage map captures every
annotated comment, every import-based STACK link, every token-using file;
flip a value, confirm drift is detected.

### Phase 5: Forward Propagation (artifact -> code REVIEW-REQUIRED)

Building on Phase 4's linkage map: when an artifact changes, identify and
surface affected code.

**New code:**
- `lib/impact.js` - "what's affected if this artifact changes?"
  - Given an old/new artifact pair, returns affected code via linkage map
  - Computes severity: breaking (drift introduced) vs informational
  - Bounded transitive depth (default 2)

**New artifacts:**
- `REVIEW-REQUIRED.md` (project root, ephemeral) - listing affected files
  per change, cleared by `/god-review-changes`. **Only populated after
  god-design-reviewer (Phase 3) returns PASS or WARN.** Failed reviews
  do NOT populate REVIEW-REQUIRED; they go to REJECTED.md instead.
- `.godpowers/design/REJECTED.md` (append-only) - audit trail of
  design changes that god-design-reviewer blocked. Each entry includes
  diff, verdict reason, impeccable findings, and timestamp. User can
  resubmit after addressing the issues.

**New skills:**
- `skills/god-design-impact.md` - what-if analysis without committing
- `skills/god-review-changes.md` - walk REVIEW-REQUIRED.md interactively

**Updates:**
- `agents/god-reconciler.md` - call lib/impact.js when artifacts diff
- `agents/god-updater.md` - emit REVIEW-REQUIRED.md entries on /god-sync.
  For DESIGN.md / PRODUCT.md changes: spawn `god-design-reviewer` first;
  only run impact analysis if reviewer returns PASS or WARN

**Gating order** (DESIGN.md or PRODUCT.md change):

```
change detected
  -> god-design-updater spawns god-design-reviewer  [GATE]
  -> if BLOCK: append to REJECTED.md, abort propagation
  -> if PASS or WARN: god-impact-analyzer runs
  -> REVIEW-REQUIRED.md populated
  -> reverse-sync runs (Phase 6)
```

**Tests:** ~25 behavioral tests

**Acceptance:** change a DESIGN token, run /god-sync, REVIEW-REQUIRED.md
lists the right files; change a PRD requirement, REVIEW-REQUIRED.md lists
the right build slices and code modules.

### Phase 6: Reverse Sync (code -> artifacts) -- the user's explicit ask

When code is committed, the system scans, updates linkage, detects drift,
and updates artifacts to reflect reality. Run automatically by /god-build,
/god-feature, /god-hotfix, /god-refactor, /god-update-deps; manual via /god-scan.

**New code:**
- `lib/reverse-sync.js` - orchestrates code-to-artifact update
  - Triggered by build completion, /god-sync, or manual /god-scan
  - Scans code via lib/code-scanner.js
  - Updates linkage via lib/linkage.js
  - Detects drift via lib/drift-detector.js
  - **Runs `lib/impeccable-bridge.runDetect()` on UI files** (when
    impeccable installed); 24 anti-pattern findings flow into
    REVIEW-REQUIRED.md alongside Godpowers drift findings
  - Appends to artifacts where appropriate (e.g., PRD requirement gets an
    "Implementation:" footer link to the file)
  - Writes drift findings to REVIEW-REQUIRED.md
  - Emits events.jsonl entries (`linkage.added`, `linkage.removed`,
    `drift.detected`, `artifact.synced`, `impeccable.findings`)

**Updates per artifact** (what reverse-sync writes back):

| Artifact | What gets appended |
|---|---|
| PRD.md | Each requirement gets `Implementation: <file:lineRange>` link |
| ARCH.md | Each container gets `Source: <directory>` link; each ADR gets `Pattern: <files>` |
| ROADMAP.md | Each milestone gets `Closed by: <commit-shas>` |
| STACK/DECISION.md | Each dep gets `Used in: <file count>` |
| DESIGN.md | Each component gets `Implements: <file>`; tokens get usage counts |
| BUILD/STATE.md | Test inventory updated; coverage delta logged |
| HARDEN/FINDINGS.md | Each finding gets `Resolved in: <commit>` when fixed |
| OBSERVE/STATE.md | Each SLO gets `Source: <metric exporter file>` |

**New skills:**
- `skills/god-scan.md` - manual full-codebase scan + linkage refresh

**Updates:**
- `agents/god-updater.md` - call lib/reverse-sync.js
- `skills/god-status.md` - report drift count, orphan count, linkage coverage

**Tests:** ~35 behavioral tests covering append-not-overwrite semantics,
idempotency, drift propagation, orphan detection

**Acceptance:** add a code file with `// Implements: P-MUST-01`, run
/god-scan, confirm PRD.md now shows Implementation link for P-MUST-01;
modify the file to violate ARCH container responsibility, confirm drift
appears in REVIEW-REQUIRED.md.

### Phase 7: Workflow Integration Sweep (touch every workflow)

The user's explicit request: "I don't want this to disconnect ... if something
is done in the codebase the system is aware and it is documented."

Every existing slash command must participate in linkage maintenance,
validation, and propagation. This phase audits and updates each one.

#### god-orchestrator agent updates (the Quarterback)

`god-orchestrator` is the central change. Every other workflow touches it
because it owns the arc, the state, and the events. This is the most
load-bearing edit in Phase 7.

**Mode and detection responsibilities** (additions to Tier 0 setup):

- [ ] Call `lib/design-detector.js` after stack detection to set
  `requires-design: true|false` on state.json
- [ ] Call `lib/impeccable-bridge.isInstalled()` to set
  `impeccable-installed: true|false`
- [ ] Combine: if `requires-design && !impeccable-installed`, queue the
  impeccable install prompt (or auto-resolve under --yolo per Q10)
- [ ] Persist all detection results to state.json under
  `project.detection-results` for downstream agents

**Tier 1 orchestration changes:**

- [ ] After STACK done: branch routing
  - If `requires-design`: spawn `god-designer` for DESIGN tier
  - Else: skip DESIGN with status `not-required`; advance to Tier 2
- [ ] If impeccable installed and design tier active: god-orchestrator
  forwards impeccable's `teach` interview questions to the user (via
  the existing pause checkpoint mechanism); never auto-fills brand answers
  even under --yolo
- [ ] Emit new events: `tier.skip` (with reason), `design.required-detected`,
  `impeccable.install-decided`, `product-md.interview-started`,
  `product-md.interview-completed`

**Tier 2 orchestration changes:**

- [ ] Before spawning `god-repo-scaffolder`: pass DESIGN.md (if exists)
  so scaffold templates include token references
- [ ] After every `god-build` wave commit: spawn `god-updater` in
  reverse-sync mode (incremental, not just end-of-arc)
- [ ] On UI files touched: dispatch `/impeccable audit` +
  `npx impeccable detect` via `lib/impeccable-bridge.runDetect`
- [ ] Surface findings: append to REVIEW-REQUIRED.md, emit
  `impeccable.findings` event

**Tier 3 orchestration changes:**

- [ ] Before LAUNCH: dispatch `/impeccable polish` as a gate
- [ ] If polish returns critical findings: pause (default mode AND --yolo)
- [ ] If polish returns warnings only: in default mode pause for
  acknowledgement; in --yolo mode auto-acknowledge with justification
  appended to LAUNCH/STATE.md
- [ ] HARDEN tier: spawn `god-harden-auditor` in parallel with
  `/impeccable harden`; combine findings

**Mid-arc and end-of-arc sync responsibilities:**

- [ ] After every artifact write: invoke `lib/artifact-linter.js`. On
  errors: pause (refuses to advance, even under --yolo). On warnings:
  log to events.jsonl and continue.
- [ ] After every code-touching tier: invoke `lib/reverse-sync.js`
  incrementally (not just at end-of-arc)
- [ ] If reverse-sync produces REVIEW-REQUIRED.md entries: surface them
  in PROGRESS.md and at next pause point
- [ ] After every tier: refresh AGENTS.md fence via `god-context-writer`
  to reflect current linkage state (counts, recently completed artifacts)
- [ ] Mandatory final `/god-sync` at end of Tier 3 (already exists);
  now also includes: full reverse-sync, drift detection, REVIEW-REQUIRED.md
  finalization, AGENTS.md fence final state

**Design review gate responsibilities (new):**

- [ ] When DESIGN.md or PRODUCT.md change detected mid-arc: spawn
  `god-design-reviewer` BEFORE any impact/propagation runs
- [ ] On reviewer BLOCK verdict: pause arc; surface diff + reason to user;
  append to `.godpowers/design/REJECTED.md`; do NOT populate
  REVIEW-REQUIRED.md
- [ ] On reviewer WARN verdict: continue propagation; log warnings to
  events.jsonl; surface count at next pause point
- [ ] On reviewer PASS verdict: continue normal propagation pipeline
  (impact analysis -> REVIEW-REQUIRED.md -> reverse-sync)
- [ ] Add `design.review-block` to the critical-finding gate trigger
  list (pauses both default and --yolo)
- [ ] Emit `design.review-verdict` event with verdict, stage findings,
  affected diff range

**Detection of mid-arc DESIGN.md or PRODUCT.md changes:**

- [ ] Before starting each tier: hash-check DESIGN.md and PRODUCT.md
  against last known hash in state.json
- [ ] If changed: pause and offer:
  ```
  DESIGN.md changed since last tier completed.
  Affected files: <list from lib/impact.js>
  Options:
    1. Run /god-design-impact to see full propagation
    2. Continue and let reverse-sync catch up at end of tier
    3. Stop arc and run /god-review-changes manually
  ```
- [ ] Under --yolo: option 2 by default; log the auto-decision to
  YOLO-DECISIONS.md

**Critical-finding gate (extended):**

The existing critical-finding gate now includes:
- [ ] Breaking drift findings (e.g., WCAG contrast fail, ARCH container
  responsibility violation, STACK dep version mismatch)
- [ ] Critical impeccable findings (anti-pattern severity = critical)
- [ ] Lint errors on any artifact (unchanged behavior; still gates)
- [ ] Validator errors from `lib/have-nots-validator.js` on any artifact

All of the above pause both default mode AND --yolo.

**State.json schema additions** (god-orchestrator owns these writes):

```json
{
  "project": {
    "detection-results": {
      "requires-design": true,
      "frontend-frameworks": ["next.js"],
      "impeccable-installed": true,
      "impeccable-tools": ["claude-code", "cursor"]
    },
    "context-prompt-answered": "yes",
    "impeccable-prompt-answered": "yes"
  },
  "tiers": {
    "tier-1": {
      "design": {
        "status": "done",
        "artifact": "DESIGN.md",
        "lint-passed": true,
        "impeccable-validated": true,
        "last-hash": "sha256:..."
      },
      "product": {
        "status": "done",
        "artifact": "PRODUCT.md",
        "interview-completed": true,
        "last-hash": "sha256:..."
      }
    }
  },
  "linkage": {
    "coverage-pct": 0.87,
    "orphan-count": 3,
    "drift-count": 1,
    "review-required-items": 5
  },
  "yolo-decisions": [
    { "timestamp": "...", "type": "impeccable.install", "auto-resolved": true },
    { "timestamp": "...", "type": "design.token-default", "value": "Heritage preset" }
  ]
}
```

**New events god-orchestrator emits to events.jsonl:**

- `tier.skip` (when DESIGN skipped on backend-only)
- `design.required-detected` / `design.not-required`
- `impeccable.install-decided` (with auto-resolved flag)
- `product-md.interview-started` / `product-md.interview-completed`
- `impeccable.dispatch` (per command bridged)
- `impeccable.findings` (with severity counts)
- `linkage.snapshot` (after each reverse-sync; with coverage/orphans/drift)
- `drift.breaking` (gate-triggering)
- `review-required.populated` (with item count)
- `agents-md.refreshed` (after each fence update)

**File changes to `agents/god-orchestrator.md`:**

- Add a new "Detection-Driven Tier 1 Routing" section explaining UI vs
  non-UI branching
- Add a new "Impeccable Integration" section explaining bridge dispatch
  and gate semantics
- Add a new "Linkage and Reverse-Sync" section explaining when sync runs
  (every code-touching tier, not just end-of-arc)
- Update the Critical-Finding Gate section with the extended trigger list
- Update the YOLO Behavior section with the explicit table from the
  /god-mode subsection below
- Update state.json schema example with the additions above

**Tests for god-orchestrator (new behavioral tests):**

- Tier 1 routing: UI project goes through DESIGN; backend-only skips
- Hash-check detection: mid-arc DESIGN.md edit triggers the pause prompt
- Critical finding extension: breaking drift causes pause even under --yolo
- State.json detection-results populated correctly
- Events emitted in correct order with correct payloads
- AGENTS.md fence refreshed after each tier completion

**Workflows to update** (a checklist; each is a small touch):

#### Tier 1 (planning) workflows:
- [ ] `/god-prd` - emits stable P-MUST/SHOULD/COULD IDs; lints; refreshes
  AGENTS.md; appends Implementation footers when reverse-sync runs
- [ ] `/god-arch` - emits stable C-/ADR-NNN IDs; lints; cross-checks NFR
  coverage; refreshes AGENTS.md
- [ ] `/god-roadmap` - emits stable M- IDs; lints; updates milestone close
  links from /god-build commits
- [ ] `/god-stack` - emits stable S- IDs; lints; cross-checks dep usage
  via lib/code-scanner; routes to /god-design if UI detected (else /god-repo)
- [ ] `/god-design` - new; emits stable D-/token IDs; lints; integrates with
  reverse-sync for token usage and drift

#### Tier 2 (build) workflows:
- [ ] `/god-repo` - scaffolds with stable-ID-aware comment templates so
  generated files start with linkage annotations
- [ ] `/god-build` - on completion: lib/reverse-sync.js runs; appends
  artifact footers; surfaces drift; emits linkage events

#### Tier 3 (ship) workflows:
- [ ] `/god-deploy` - DEPLOY/STATE.md gets Source links to deploy config files
- [ ] `/god-observe` - SLO definitions linked to metric exporter files; alerts
  linked to runbook sections
- [ ] `/god-harden` - findings linked to source files; resolution links written
  back when fixes commit
- [ ] `/god-launch` - launch checklist items linked to evidence

#### Beyond-arc workflows:
- [ ] `/god-feature` - PRD delta lints; impact analysis runs (Phase 5);
  on completion reverse-sync (Phase 6) propagates back
- [ ] `/god-hotfix` - hot-fix code annotated with `// Fixes: P-MUST-NN` or
  `// Fixes: incident-NNN`; PRD/POSTMORTEM updated
- [ ] `/god-refactor` - ARCH container assignments updated post-refactor;
  drift detection fires if responsibilities shifted
- [ ] `/god-spike` - spike findings linked to PRD/ARCH if they inform
  decisions; SPIKE.md gets `Informs: P-MUST-NN` footer
- [ ] `/god-postmortem` - POSTMORTEM.md links findings to HARDEN, OBSERVE,
  PRD as appropriate
- [ ] `/god-upgrade` - STACK/DECISION.md updated with new version; impact
  analysis surfaces affected code; reverse-sync confirms upgrade applied
- [ ] `/god-docs` - docs linked to artifacts they document; lint catches
  doc drift
- [ ] `/god-update-deps` - STACK changes; impact analysis; reverse-sync
  records new dep usage

#### Meta workflows:
- [ ] `/god-audit` - now actually mechanical (Phase 1); audits linkage
  coverage and orphans
- [ ] `/god-sync` - runs lib/reverse-sync.js + lib/impact.js on artifact
  diffs; updates REVIEW-REQUIRED.md
- [ ] `/god-reconcile` - includes linkage validation (orphans, drift)
- [ ] `/god-status` - reports linkage coverage %, drift count, orphan count,
  REVIEW-REQUIRED count
- [ ] `/god-next` - aware of REVIEW-REQUIRED items; suggests
  /god-review-changes when present
- [ ] `/god` (front door) - intent matching includes "what changed",
  "what needs review", "scan codebase"
- [ ] `/god-context` - AGENTS.md fence includes link counts and drift summary
- [ ] `/god-init` - initializes empty linkage maps; sets up scanner;
  one-time prompts for AGENTS.md context AND impeccable install
- [ ] `/god-mode` - explicit handling for the autonomous arc with all
  new features (see "/god-mode + --yolo Behavior" section below)

#### Per-artifact reconcile/update flows:
- [ ] All routing/<command>.yaml `have-nots` entries become validator codes
- [ ] All routing/<command>.yaml `endoff.events` add the linkage events
- [ ] All routing/<command>.yaml `success-path` chains to /god-scan if
  the workflow touched code
- [ ] Decision trees in routing files updated to reflect /god-design
  insertion in Tier 1

#### Impeccable bridge commands (when impeccable installed)

A bridge layer that lets users invoke impeccable's 23 commands through
godpowers' lifecycle (so events log, linkage updates, REVIEW-REQUIRED.md
populates). These are pass-throughs, not reimplementations:

- [ ] `/god-design teach` -> `/impeccable teach` (one-time setup; produces
  PRODUCT.md + DESIGN.md; emits `impeccable.teach` event)
- [ ] `/god-design document` -> `/impeccable document` (regenerate
  DESIGN.md from existing code; triggers reverse-sync after)
- [ ] `/god-design extract` -> `/impeccable extract` (pull reusable
  components into the design system)
- [ ] `/god-design shape` -> `/impeccable shape` (plan UX/UI before code)
- [ ] `/god-design critique [scope]` -> `/impeccable critique` (UX review;
  findings -> REVIEW-REQUIRED.md)
- [ ] `/god-design audit [scope]` -> `/impeccable audit` (a11y, perf,
  responsive)
- [ ] `/god-design polish [scope]` -> `/impeccable polish` (final pass;
  triggers post-polish drift recheck)
- [ ] `/god-design bolder|quieter|distill` -> `/impeccable <cmd>` (tonal
  adjustments; DESIGN.md change triggers full propagation)
- [ ] `/god-design harden` -> `/impeccable harden` (error handling, i18n)
- [ ] `/god-design onboard` -> `/impeccable onboard` (first-run flows)
- [ ] `/god-design animate|colorize|typeset|layout|delight|overdrive|clarify|adapt|optimize|live`
  -> respective `/impeccable <cmd>` (every impeccable command bridged;
  any DESIGN.md change kicks reverse-sync + REVIEW-REQUIRED population)

The bridge layer is `lib/impeccable-bridge.js` (defined in Phase 3). Its
job: detect impeccable's primary AI tool (from .claude/, .cursor/, etc.),
dispatch the command, capture output, write events, then trigger the
godpowers post-processing pipeline (lint -> reverse-sync -> REVIEW-REQUIRED).

If impeccable is not installed, bridge commands print a graceful message
suggesting `/god-init impeccable` to install it, and fall back to
god-designer's minimal builtin where applicable.

#### Workflows that ALSO call impeccable (auto-trigger)

Some godpowers workflows automatically invoke impeccable as part of their
quality gate, transparently:

- [ ] `/god-build` (UI files touched) -> auto-runs `/impeccable audit` +
  `npx impeccable detect` after build; findings flow to REVIEW-REQUIRED.md
- [ ] `/god-feature` (UI files touched) -> auto-runs `/impeccable critique`
  on the new feature surface
- [ ] `/god-launch` -> auto-runs `/impeccable polish` as a launch gate;
  blocks launch on critical findings unless --yolo
- [ ] `/god-harden` -> auto-runs `/impeccable harden` (error handling,
  edge cases) alongside the security harden audit
- [ ] `/god-refactor` (UI components) -> auto-runs `/impeccable critique`
  post-refactor to catch regressions
- [ ] `/god-update-deps` (UI lib upgrades) -> auto-runs
  `/impeccable audit` to detect cascading visual changes

**Tests:** ~40 behavioral tests covering workflow integration; one test
per workflow asserting it now emits linkage events and produces the
expected updates. Plus ~25 tests for impeccable bridge dispatch + pass-through.

**Acceptance:** every workflow touched in the table above passes its
integration test; running /god-mode end-to-end produces a fully populated
linkage map without manual /god-scan calls; running `/god-design polish`
in a project with impeccable installed dispatches correctly, captures
output, and triggers reverse-sync.

#### `/god-mode` + `--yolo` Behavior with the new features

The autonomous arc must behave correctly with design, impeccable, linkage,
and reverse-sync. This subsection nails down explicit semantics for both
default `/god-mode` and `--yolo`.

##### Default `/god-mode` (interactive autonomous)

The arc orchestrates all 15 artifacts (was 14 + DESIGN.md, optionally +
PRODUCT.md). Tier 1 expands:

```
Tier 1: Planning
  PRD                        (god-pm)
  ARCH                       (god-architect)
  ROADMAP                    (god-roadmapper)
  STACK                      (god-stack-selector)
  DESIGN  [conditional]      (god-designer + impeccable teach if UI detected)
  PRODUCT [conditional]      (impeccable teach, generated alongside DESIGN)
```

Per-tier behavior changes:

| Stage | New behavior |
|---|---|
| Tier 0 setup | Prompt for AGENTS.md context AND impeccable install (if UI detected); persist answers; ask never-ask only once |
| Tier 1 PRD/ARCH/ROADMAP/STACK | Each runs `/god-lint` post-write; refuses to advance on errors |
| Tier 1 DESIGN/PRODUCT | Spawned only if UI detected. `god-designer` delegates to `/impeccable teach` if installed; falls back to minimal builder otherwise |
| Tier 2 REPO | Scaffolds files with stable-ID-aware comment templates (e.g., `// Implements: P-MUST-01`) |
| Tier 2 BUILD | After commit: `lib/reverse-sync.js` runs; appends Implementation footers; UI files trigger auto `/impeccable audit` and `npx impeccable detect`; findings flow to REVIEW-REQUIRED.md |
| Tier 3 DEPLOY/OBSERVE | Append Source links to deploy/observability artifacts |
| Tier 3 HARDEN | Auto-runs `/impeccable harden` alongside security audit |
| Tier 3 LAUNCH | **Gate**: auto-runs `/impeccable polish`. Critical findings pause the arc. |
| Final sync | Mandatory `/god-sync` runs full reverse-sync, refreshes AGENTS.md fence with linkage state, generates final REVIEW-REQUIRED.md if any |

Pause checkpoints (default mode pauses on these; user can override with
--yolo):

- Impeccable install consent (if UI detected, first time)
- AGENTS.md context consent (first time)
- PRODUCT.md interview (impeccable's `teach` asks 2-3 rounds of strategic
  questions: register, users, brand personality, anti-references)
- Design token decisions that have no precedent (impeccable's normal
  behavior; god-orchestrator forwards the question)
- `/god-lint` errors on any artifact (must fix before advancing)
- Critical drift findings (e.g., DESIGN drift that breaks contrast WCAG)
- Critical impeccable findings at /god-launch gate
- All existing pause points (mode/scale, missing PRD inputs, etc.)

##### `--yolo` Mode (autonomous; auto-resolve where safe)

`--yolo` does NOT mean "skip validation." It means "auto-resolve the
non-load-bearing decisions and log them; pause only on truly critical
findings."

Explicit rules per concern:

| Concern | Default | `--yolo` |
|---|---|---|
| AGENTS.md context prompt | Pause to ask | Auto-yes; log to YOLO-DECISIONS.md |
| Impeccable install prompt | Pause to ask | Auto-yes (npm + skill copy); log decision |
| PRODUCT.md interview | Pause for 2-3 rounds of questions | **Pause anyway**; these are load-bearing brand decisions. Yolo does NOT auto-fill brand personality, register, or anti-references. Log a "yolo could not resolve" event. |
| Design token decisions (e.g., primary color) | Pause | Auto-pick from impeccable defaults; log proposed value to YOLO-DECISIONS.md; flag for post-arc review |
| `/god-lint` errors | Pause to fix | **Pause anyway**; lint errors are mechanical signal that something is structurally broken. Yolo cannot bypass them. |
| `/god-lint` warnings | Continue | Continue, log warnings to events.jsonl |
| Drift findings (informational) | Continue | Continue |
| Drift findings (breaking, e.g., contrast WCAG) | Pause | **Pause anyway**; breaking drift is a real failure |
| Impeccable critical findings (at /god-launch gate) | Pause | **Pause anyway**; cannot ship a critical-flagged design |
| Impeccable warnings (at /god-launch gate) | Pause to acknowledge | Auto-acknowledge with justification appended to LAUNCH/STATE.md |
| `/god-design polish` recommendations | Apply if non-controversial | Apply silently; log to YOLO-DECISIONS.md |
| REVIEW-REQUIRED.md auto-clear | No (manual review required) | **No anyway**; yolo populates it but does not clear it. User reviews at end of arc. |
| Reverse-sync between tiers | Yes (incremental) | Yes (incremental); yolo does NOT skip sync |
| Mandatory final `/god-sync` | Always runs | Always runs |
| Critical-finding gate | Pause | **Pause anyway** |

The general rule: `--yolo` auto-resolves **mechanical and stylistic**
choices. It never auto-resolves:

- Brand identity (PRODUCT.md interview)
- Mechanical lint failures
- Breaking drift
- Critical findings at launch gate
- Anything in the existing critical-finding gate

This preserves the existing yolo carve-out semantic (auto-resolve when
safe; never bypass real failures) while extending it to the new design
and linkage features.

##### `--with-hygiene` flag interaction

`/god-mode --with-hygiene` already exists. With the new features, hygiene
sweep also includes:

- Linkage coverage % (how many artifact elements have linked code)
- Orphan count (artifact elements with no implementing code)
- Drift count (linked code that has diverged from artifact)
- Outstanding REVIEW-REQUIRED.md items
- Impeccable detect findings on the full UI surface
- DESIGN.md / PRODUCT.md staleness vs current code

Reported in HYGIENE-REPORT.md alongside the existing checks.

##### `--conservative` flag interaction

`/god-mode --conservative` (already exists) requires confirmation on
every gate. With new features, conservative mode also confirms:

- Each impeccable command before dispatch
- Each Implementation footer before reverse-sync writes it
- Each REVIEW-REQUIRED.md entry before adding it
- Each linkage edge before recording it

##### YOLO-DECISIONS.md additions

The existing YOLO-DECISIONS.md log gets new entry types when --yolo
auto-resolves design or linkage decisions:

```
## Yolo Auto-Resolved: [timestamp]

### Impeccable installation
- Decision: auto-yes (UI detected, primary tool: claude-code)
- Action: npm i -g impeccable; cp -r dist/claude-code/.claude

### Design token defaults
- Decision: applied impeccable's "Heritage" preset as starting point
- Rationale: no brand directive in PRD; user can refine post-arc
- Affected: colors.primary, colors.secondary, typography.display

### Drift findings (auto-acknowledged warnings)
- 3 components had minor padding drift (1-2px) from DESIGN.md tokens
- Auto-acknowledged; flagged in REVIEW-REQUIRED.md for post-arc review

### Impeccable findings (auto-acknowledged warnings at launch)
- 2 anti-pattern findings flagged at warning level by /impeccable polish
- Auto-acknowledged; appended to LAUNCH/STATE.md launch-readiness section
```

##### Tests for /god-mode + --yolo

Behavioral tests for the autonomous arc:

- `/god-mode` on UI project: produces all 15+ artifacts including DESIGN
  and PRODUCT; reverse-sync populates linkage; final REVIEW-REQUIRED.md
  may exist (warnings only); arc completes
- `/god-mode --yolo` on UI project: auto-installs impeccable;
  YOLO-DECISIONS.md captures auto-resolved choices; lint errors still
  pause; breaking drift still pauses
- `/god-mode --yolo` on backend-only project: skips DESIGN tier with
  status `not-required`; no impeccable install attempted
- `/god-mode --conservative`: confirms every impeccable bridge dispatch
  and reverse-sync action
- Critical-finding gate: artificial critical drift causes both default
  and --yolo to pause

### Phase 8: Cross-Artifact Generalization

Generalize the linkage system from per-pair (DESIGN -> code) to all
combinations. PRD changes -> ARCH may need delta. ARCH changes -> ADR may
need flip. STACK changes -> impact across multiple artifacts.

**New code:**
- `lib/cross-artifact-impact.js` - "if this artifact changes, what other
  artifacts are affected?"
  - PRD requirement removed -> ARCH containers may be over-spec'd
  - ARCH container split -> DESIGN components may need re-binding
  - STACK dep removed -> ADR referencing it needs flip-point check

**Updates:**
- `agents/god-reconciler.md` - now also reports artifact-to-artifact impact
- `agents/god-updater.md` - now also propagates artifact-to-artifact updates
- `lib/events.js` - new events: `artifact.cross-impact-detected`

**Tests:** ~25 behavioral tests

**Acceptance:** modify a PRD requirement, run /god-sync, verify ARCH
delta is suggested; remove a STACK dep, verify dependent ADRs flagged.

### Phase 9: Documentation Surface

**Updates:**
- `README.md` - new commands, design flow, change-propagation surface,
  bidirectional awareness
- `ARCHITECTURE-MAP.md` - design tier, linkage layer, reverse-sync flow
- `docs/concepts.md` - "Source of Truth" + "Bidirectional Awareness"
- `docs/agent-specs.md` - 4 new agent specs (designer, design-updater,
  impact-analyzer, code-scanner)
- `docs/greenfield-coverage.md` - 15 artifacts now (+DESIGN.md)

**New docs:**
- `docs/design-md.md` - guide to using DESIGN.md (Google Labs format)
- `docs/change-propagation.md` - forward + reverse + cross-artifact;
  REVIEW-REQUIRED.md workflow; drift handling
- `docs/validation.md` - the lint system, mechanical vs interpretive checks
- `docs/linkage.md` - how stable IDs work, annotation conventions, scanner
  rules per language, customization

### Phase 10: Integration Validation (the dog-food run)

Mandatory before declaring this plan complete.

1. Run `/god-init` on a throwaway directory
2. Run `/god-mode` end-to-end on a small UI app spec
3. Verify all 15 artifacts produced
4. Verify `/god-lint` passes on every artifact
5. Verify linkage map is populated with all annotated code references
6. Verify AGENTS.md fence reflects linkage state
7. Manually mutate DESIGN.md (change `colors.primary`)
8. Run `/god-sync`
9. Verify REVIEW-REQUIRED.md is generated with the right files
10. Manually break a have-not (em dash in PRD), verify lint catches it
11. Manually introduce drift (code violates ARCH container), verify drift
    appears in /god-status and /god-sync
12. Run a `/god-feature` mid-arc, verify reverse-sync updates PRD/ARCH/DESIGN
    appropriately
13. Run `/god-design polish` and verify impeccable command dispatches,
    captures findings, and re-triggers reverse-sync
14. Run `npx impeccable detect` directly and confirm findings appear in
    REVIEW-REQUIRED.md after `/god-sync`
15. Document findings in `.planning/dogfood-001-results.md`

If any step fails, fix before declaring the plan complete.

## Scope summary

| Category | Net new |
|---|---|
| New lib modules | 13 (linter, diff, have-nots-validator, design-detector, design-spec, **impeccable-bridge**, design-tracker, design-impact, design-drift, linkage, code-scanner, drift-detector, reverse-sync, impact, cross-artifact-impact) |
| New agents | 5 (designer, **design-reviewer**, design-updater, impact-analyzer, reverse-sync runs in updater) |
| New skills | 8 (lint, design + bridged subcommands, design-impact, design-update, review-changes, scan, link) |
| New routing | 1 (god-design.yaml); ~25 routing files updated |
| New templates | 1 (DESIGN.md, conformant to both Google Labs and impeccable) |
| New examples | 2 complete projects |
| New antipattern refs | 9 (ROADMAP, STACK, BUILD, DEPLOY, OBSERVE, HARDEN, LAUNCH, DESIGN-ANTIPATTERNS, DESIGN-ANATOMY) |
| New behavioral tests | ~320 (was 305; +15 for design-reviewer two-stage gate) |
| Updated files | ~50 (every workflow touched in Phase 7) |
| External deps detected | 2 (impeccable, @google/design.md) - never vendored, only detected |

## Sequencing rationale

Phase 1 first because: nothing else has teeth without the validator.
Phase 2 second because: cheap, immediately raises agent output quality.
Phase 3 third because: now we have validation infrastructure to apply.
Phase 4 fourth because: defines stable IDs and linkage maps everything else uses.
Phase 5 fifth because: forward propagation depends on linkage map.
Phase 6 sixth because: reverse sync depends on linkage map.
Phase 7 seventh because: every workflow now has the infrastructure to wire into.
Phase 8 eighth because: cross-artifact patterns are clear once 7 is wired.
Phase 9 ninth because: documents everything built.
Phase 10 last because: validates the whole system on a real project.

## Estimated effort

Each phase is one focused work session of 30-90 minutes. Phases 4, 6, 7
are the largest. Total: ~10-12 sessions.

## Open questions

1. Should `/god-lint` shell out to `npx @google/design.md` when present?
   (Recommendation: yes, graceful fallback.)
2. Transitive impact (token -> file A -> file B)?
   (Recommendation: yes, depth-2.)
3. Should `REVIEW-REQUIRED.md` auto-clear or require manual review?
   (Recommendation: manual.)
4. Should drift block `/god-build`?
   (Recommendation: warning only, with escalation flag.)
5. Past-work review: just identify, or also suggest diffs?
   (Recommendation: identify in v1, suggest in v2.)
6. **Should reverse-sync run automatically on every commit (git hook)?**
   (Recommendation: optional, off by default; on after /god-build / /god-feature
   / /god-hotfix; manual via /god-scan.)
7. **Linkage annotation language: comments only, or also dedicated config?**
   (Recommendation: comments primary; allow `.godpowers/links/manual.yaml`
   for cases where comments are awkward.)
8. **Stable IDs: human-friendly or hash-based?**
   (Recommendation: human-friendly with collision detection.)
9. **What happens if reverse-sync conflicts with a manual artifact edit?**
   (Recommendation: never overwrite human-written prose; only append the
   `Implementation:` / `Source:` / `Resolved in:` footer in a Godpowers
   fenced section per artifact, same pattern as AGENTS.md fence.)
10. **Should Godpowers vendor impeccable or only detect-and-use?**
    (Recommendation: detect-and-use. Vendoring duplicates effort and
    creates version drift. Godpowers only owns the bridge layer.)
11. **Where do impeccable's 7 domain references live?**
    (Recommendation: stay in impeccable's install path; god-designer reads
    them from there when present. If absent, godpowers' minimal
    fallback uses `references/design/DESIGN-ANATOMY.md` from Phase 2.)
12. **Should bridge commands appear in `/god` recipes?**
    (Recommendation: yes. Add recipes like "polish-the-design",
    "design-needs-attention", "tone-down-the-bold" that map free-text
    intent to `/god-design <impeccable-cmd>`.)
13. **Should /god-design audit / critique / polish be required gates,
    or optional?**
    (Recommendation: required for /god-launch (gate); optional after
    /god-build and /god-feature (warning, recommend); manual everywhere
    else. Provides discipline at ship-time without blocking exploration.)
14. **What about PRODUCT.md updates over time?**
    (Recommendation: same lifecycle as DESIGN.md. Tracked in linkage
    map. Changes propagate via REVIEW-REQUIRED.md. /god-sync refreshes
    pointers in AGENTS.md fence.)

## Next action

Awaiting go-ahead. On approval, start with Phase 1.
