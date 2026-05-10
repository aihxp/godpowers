# Godpowers Deep Audit - 2026-05-10

> Independent audit run on commit f7ed058 (immediately after the gap-fix
> commit). Findings below are grouped by severity. Each finding includes
> evidence, impact, and recommended fix.

## Audit scope

Seven passes, each a different lens:

| # | Lens | What it catches |
|---|------|-----------------|
| 1 | Reference-integrity sweep | Skills -> agents, routing -> skills, lib refs in docs |
| 2 | Schema-vs-code drift | What code writes vs what the JSON Schema declares |
| 3 | Idempotency walk | Do skills handle re-invocation safely? |
| 4 | Failure-mode walk | What happens when a step errors / times out / loses network? |
| 5 | Security posture | Hooks, child_process, user-input flow to shell |
| 6 | Test-coverage gap | Which lib modules + which agent outputs are untested? |
| 7 | Installer correctness | 15 runtime targets, what each writes, fidelity check |

---

## Severity legend

- **CRITICAL**: silent data loss, security hole, or guaranteed user-visible breakage
- **HIGH**: visible broken feature in a documented happy path
- **MEDIUM**: feature works but is documented inaccurately, or fails ungracefully in edge cases
- **LOW**: minor doc inaccuracy, dead code, code smell
- **INFO**: notable observation, not a defect

---

## Findings

### CRITICAL: none found

The seven-lens pass surfaced zero CRITICAL findings. No silent corruption,
no leaking secrets, no shipping-blocking bugs. Good baseline.

---

### HIGH-1: Mode enum drift between intent.js validator and schema (FIXED in audit)

**Evidence:** `lib/intent.js:170` validated `['A', 'B', 'C', 'D']`. The
intent schema at `schema/intent.v1.yaml.json` (after the Mode D fix
shipped at f7ed058) declares `['A', 'B', 'C', 'E']`. A real intent.yaml
with `mode: E` (bluefield, which is implemented) would pass schema
validation but fail `lib/intent.js` validation.

**Impact:** Any caller that runs intent through `validate()` would
reject valid bluefield projects.

**Fix:** Updated `lib/intent.js:170` to align with the schema:
`['A', 'B', 'C', 'E']`. Comment notes that D is a separate boolean
`mode-d-suite`, not a primary mode.

**Status:** FIXED in this audit pass.

---

### HIGH-2: state.v1.json missed mode + linkage + yolo-decisions fields (FIXED)

**Evidence:** `lib/state.js` `init()` writes `linkage` and `yolo-decisions`
fields. The orchestrator prose says it stores `mode`, `mode-d-suite`,
`mode-detected-from`, `mode-announced-as` in state.json. But
`schema/state.v1.json` had none of these fields AND had
`additionalProperties: false`, meaning the schema would reject every
real state.json produced by the code.

**Impact:** Schema validation would fail on every project. Tests don't
catch this because the test suite reads `lib/state.js` directly, not
through schema validation.

**Fix:** Added 6 fields to `schema/state.v1.json`: `mode`,
`mode-d-suite`, `mode-detected-from`, `mode-announced-as`, `linkage`
(object), `yolo-decisions` (array).

**Status:** FIXED in this audit pass.

---

### HIGH-3: Shell-injection risk in impeccable-bridge (FIXED)

**Evidence:** `lib/impeccable-bridge.js:83` had
`execSync(\`npx ${args.join(' ')}\`)` where `args` includes
`targetPath` which is user-controllable through skill arguments. A
malicious or accidentally-malformed targetPath (spaces, backticks,
`;rm -rf`) would either fail the call or inject commands.

**Impact:** Limited (a user would have to point godpowers at a hostile
path), but the pattern is exactly the kind of "small bridge surface"
that grows over time.

**Fix:** Switched to `execFileSync('npx', args, opts)` with the args
array passed as args, not as a shell-interpolated string. No shell,
no metacharacter interpretation.

**Status:** FIXED in this audit pass.

---

### MEDIUM-1: 9 artifact-producing skills lack idempotency documentation

**Evidence:** `/god-prd`, `/god-arch`, `/god-roadmap`, `/god-stack`,
`/god-deploy`, `/god-observe`, `/god-launch`, `/god-harden`, `/god-design`
all have NO documented idempotency behavior. The skill files don't say
what happens on re-invocation: overwrite, append, error, prompt user?
Only `/god-build` and `/god-init` have explicit handling described.

**Impact:** A user re-running `/god-prd` after editing PRD.md might
get the existing file silently overwritten. The agents may have
fresh-context behavior that handles this, but it's not in the
contract.

**Recommended fix:** Add a "Re-invocation" section to each
artifact-producing skill: either "agent reads existing file and
proposes diff" or "agent overwrites; use `/god-undo` to revert" or
"refuses if artifact exists; require `--force`".

**Status:** OPEN. Recommend a single follow-up commit that adds a
standard `## Re-invocation` block to each.

---

### MEDIUM-2: 20 lib modules without dedicated tests

**Evidence:** `ls scripts/test-*.js` covers 12 lib modules. The
remaining 20 have no dedicated behavioral test:

| Untested module | Risk if it drifts |
|---|---|
| state.js | reads + writes state.json; primary state surface |
| intent.js | parses + validates intent.yaml |
| events.js | event-log appends |
| review-required.js | propagation markers |
| design-spec.js | DESIGN.md parser + WCAG contrast |
| code-scanner.js | linkage discovery |
| drift-detector.js | drift detection across artifacts |
| cross-artifact-impact.js | 6 rule classes for cross-artifact impact |
| have-nots-validator.js | mechanical lint |
| design-detector.js | UI presence detection (24+ frameworks) |
| browser-bridge.js | headless browser cascade |
| agent-browser-driver.js | agent-browser CLI wrapper |
| runtime-audit.js | rendered-style design audit |
| runtime-test.js | acceptance-flow assertions |
| impeccable-bridge.js | impeccable detect-and-delegate |
| meta-linter.js | Mode D byte-identical check |
| suite-state.js | Mode D suite-state I/O |
| multi-repo-detector.js | Mode D detection |
| cross-repo-linkage.js | Mode D linkage |
| workflow-parser.js | parses workflows/*.yaml |

Several of these *are* tested indirectly through integration tests, but
none has a dedicated `test-X.js` with property-level coverage.

**Impact:** Refactoring any of these is high-risk because regressions
aren't caught at unit level.

**Recommended fix:** Backfill `scripts/test-state.js`,
`test-intent.js`, `test-events.js` first (load-bearing); then
`test-design-spec.js`, `test-drift-detector.js`,
`test-cross-artifact-impact.js`. Other modules can be lower priority.

**Status:** OPEN.

---

### MEDIUM-3: Zero agent-output golden tests

**Evidence:** Grep across all 22 test suites finds zero tests that
load an actual PRD.md / ARCH.md / DESIGN.md and assert properties of
its content. All 1554 tests are on lib/ logic (validation, parsing,
linkage). The actual prompts in `agents/god-pm.md`, `agents/god-architect.md`,
etc. are unverified.

**Impact:** Silent quality regression in the agents is invisible to
CI. If `agents/god-pm.md` is edited tomorrow and the new prompt
produces lower-quality PRDs, no test catches it. The substitution
test + three-label test + have-nots validation run at runtime, but
not against a golden corpus in CI.

**Recommended fix:** Build a small "golden fixtures" suite:
- `tests/fixtures/sample-projects/saas-mrr-tracker/` (already exists at
  examples/saas-mrr-tracker; reuse)
- For each Tier-1 agent: golden expected fragments the output should
  contain (specific personas, numeric anchors, ADR-NNN ids, etc.)
- Pass these through the agent-validator and have-nots-validator;
  assert no errors.

**Status:** OPEN. This is the gap that most matters before claiming
"production-ready" for /god-mode.

---

### MEDIUM-4: SessionStart hook duplicates orchestrator's job (smells of drift risk)

**Evidence:** `hooks/session-start.sh` has its own substring-match
table of PRD/ARCH/Roadmap/Stack/Repo/Build/Deploy patterns to map
PROGRESS.md rows to next commands. This logic is also in the
orchestrator agent + lib/recipes.js. Three independent copies of the
same routing knowledge.

**Impact:** Adding a new tier sub-step requires updating three files.
Adding `/god-story-build` to PROGRESS.md wouldn't trigger any next-
command suggestion from the SessionStart hook because the hook's
regex doesn't know about story files.

**Recommended fix:** Either (a) have the hook call `node -e "..."`
that imports `lib/recipes.js` for the canonical answer, or (b) remove
the duplication and have the hook just print "Run /god-next" without
trying to be smart.

**Status:** OPEN.

---

### MEDIUM-5: Workflow YAMLs are documentation, not yet authoritative (now labeled)

**Evidence:** `workflows/full-arc.yaml` etc. declare `uses: god-pm@^1.0.0`
style steps, but `agents/god-orchestrator.md` prose drives runtime
behavior. The YAML and the prose can drift.

**Impact:** A reader who treats `workflows/full-arc.yaml` as authoritative
will see different behavior at runtime than the YAML implies.

**Fix:** As of f7ed058, every `workflows/*.yaml` now starts with a
"STATUS: NOT YET AUTHORITATIVE" header pointing the reader to the
orchestrator prose. Until v0.14 ships the workflow runtime, this is
the right call.

**Status:** LABELED. Real fix is v0.14 (workflow-runtime ships and
parser becomes authoritative).

---

### MEDIUM-6: CHANGELOG named lib/suite-config.js but file is lib/suite-state.js (FIXED)

**Evidence:** CHANGELOG.md v0.12.0 entry said
"`lib/suite-config.js`: Mode D suite registration + version table".
Actual file is `lib/suite-state.js`.

**Impact:** Anyone trying to find the file by name fails.

**Fix:** CHANGELOG updated to `lib/suite-state.js`.

**Status:** FIXED in this audit pass.

---

### LOW: deep-doc claims have minor inaccuracies

Specific small drifts found:

1. `docs/reference.md` "Schemas" section claims `routing.v1.json` as a
   schema but `schema/recipe.v1.json` also exists and isn't listed.
   Recommended fix: add recipe.v1.json to the schemas list.
2. `docs/concepts.md` "Five external integrations" matches the
   CHANGELOG. No drift.
3. `docs/getting-started.md` "60+ commands" was outdated when v0.11
   shipped 60+ but 0.12 has 91. The reference link is correct now.

---

### INFO

1. Test count grew from 1415 (before gap fix) to 1554 (after) because
   the `agent-validator` and `skill-validator` test suites enumerate
   all skills/agents, so adding 9 skills + 36 routing yamls added
   ~140 implicit property tests. This is the right kind of growth.

2. Installer integrity is good: a fresh `npx godpowers --claude --global`
   into a clean home dir copies all 91 skills + 38 agents + 53 routing
   yamls + 36 recipes + references successfully. `GODPOWERS_VERSION`
   marker matches the package.json version.

3. Five external integrations are all detect-and-delegate, no vendored
   copies. Confirmed by grepping for the libraries' source-file
   signatures across the repo — only thin bridges in `lib/*-bridge.js`.

4. 15 runtime configDir paths in `bin/install.js`. None overlap. All
   use `~/.X` convention. Pi additionally writes to `.pi/skills/`
   per the Pi standard.

---

## Recommended follow-up

Priority order for the next cleanup commit:

1. **MEDIUM-1 (idempotency docs)** - add `## Re-invocation` to 9 skills
2. **MEDIUM-3 (golden tests)** - build minimal golden suite for Tier-1
   agents; this unblocks honest "production-ready" claims for /god-mode
3. **MEDIUM-2 (lib tests)** - backfill test-state.js, test-intent.js,
   test-events.js (most load-bearing untested modules)
4. **MEDIUM-4 (SessionStart hook duplication)** - have hook call recipes.js

Items beyond v0.13/v0.14/v0.15 are intentional roadmap items, not gaps.

---

## What this audit did NOT cover

Honest limits of this pass:

- **No end-to-end live execution.** I didn't run `/god-mode` against a
  fresh project and watch what produces. That's the next-most-valuable
  test and I'd want to do it in a dogfood-003 cycle.
- **No security review of the 5 external integrations** themselves.
  Trust boundary check is at the bridge, but their own behavior isn't
  audited.
- **No performance audit.** Some lib operations (linkage scan,
  reverse-sync) walk the whole tree. Big repos may surface latency
  issues that 22-test corpus doesn't expose.
- **No accessibility audit on the runtime-audit output itself.** The
  WCAG contrast check runs against user content, but the audit-report
  format isn't itself a11y-tested.
- **No multi-user / merge-conflict scenario.** What if two devs run
  `/god-feature` on the same project simultaneously? Linkage map
  conflicts are unhandled today.

These are good next questions, not present-day defects.
