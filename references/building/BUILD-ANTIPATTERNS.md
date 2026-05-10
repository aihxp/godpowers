# BUILD Antipatterns

> Common ways the build phase fails. Each has a sample, why it fails, and the fix.

## 1. The Horizontal Slice

**Sample**: Sprint 1 = "build the database layer for everything." Sprint
2 = "build the API layer for everything." Sprint 3 = "build the UI."

**Why it fails**: Three sprints of accumulated risk. Nothing ships until
sprint 3. Every layer was built against assumptions that turn out wrong
when the layers meet.

**Fix**: Vertical slices. Sprint 1 = "user can log in and see their
name on a page." That one feature touches DB, API, UI. It works
end-to-end. Each subsequent slice adds one feature that also works
end-to-end.

## 2. Tests Last

**Sample**: All features built first; tests added in the last sprint
"once it's stable."

**Why it fails**: Tests written after the fact rationalize the existing
behavior, including the bugs. Coverage is shallow because the team is
exhausted by the time they're written.

**Fix**: TDD per slice. Write the failing test, write the code to pass,
commit. Each slice ships with its tests already green.

## 3. The Big-Bang Commit

**Sample**: Two weeks of work on a branch, single commit at the end.

**Why it fails**: Code review on a 2-week diff is impossible to do well.
Reviewers skim. Bugs land. If something needs reverting, the entire two
weeks comes with it.

**Fix**: Atomic commits per slice. Each commit ships one tested behavior.
Reviewable in 5-15 minutes. Revertible without taking adjacent work down.

## 4. The Untouched Have-Nots

**Sample**: BUILD/STATE.md lists "12 have-nots verified" but no test
exists for any of them.

**Why it fails**: Self-attestation. The agent (or developer) claims the
have-nots pass without a script that proves it. When a regression slips
in, no test catches it.

**Fix**: Each have-not maps to a test (or a lint rule). "U-08 (no em
dash)" maps to a CI step that runs `npx godpowers lint` over `.godpowers/*`.
The check is mechanical and cannot lie.

## 5. The Forgotten Linkage

**Sample**: Code is committed without the comment annotation that links
it to its PRD requirement (`// Implements: P-MUST-01`).

**Why it fails**: Reverse-sync (Phase 6) needs the annotation to update
the PRD with the implementation footer. Without it, the linkage map
shows orphans. Future agents reading the PRD don't see what was built.

**Fix**: The repo scaffolder generates files with comment template
showing where to put the annotation. The build agent's checklist
includes "annotation present and pointing at correct ID."

## 6. The Drift-Tolerant Build

**Sample**: Build phase makes structural decisions that contradict ARCH.
Example: ARCH says "auth-service owns User entity"; build adds a User
table to billing-service "for convenience."

**Why it fails**: Drift like this is invisible until ARCH changes (or a
new engineer reads ARCH). The convenience compounds; the architecture
is wrong about what exists.

**Fix**: Drift detection runs on every /god-build. If code violates an
ARCH decision, the build fails (default mode) or surfaces a warning
(under --yolo) that flows into REVIEW-REQUIRED.md.

## 7. The "Done" Without Verification

**Sample**: Slice marked done after the developer manually clicked through.

**Why it fails**: Manual verification doesn't replay. Two days later,
a regression introduces the same bug. Nobody catches it because there
was never a test.

**Fix**: A slice is done when its automated test passes in CI. Manual
verification is fine as a sanity check; it does not replace the test.

## 8. The Hidden Cost of "Just One More Refactor"

**Sample**: Mid-build, the developer decides to "quickly" rename a core
module. Three days later, the rename has touched 40 files, broken 20
tests, and the slice is delayed.

**Fix**: Refactors live in their own command (`/god-refactor`) or their
own milestone. Mid-build refactors that exceed 30 minutes are stopped
and rescheduled. The slice ships first; the refactor follows in its
own atomic change.
