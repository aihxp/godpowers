---
name: god-next
description: |
  Auto-detect what to run next based on disk state. Reads PROGRESS.md, scans
  artifact paths, and suggests (or runs) the next logical command in the
  Godpowers arc.

  Triggers on: "god next", "/god-next", "what's next", "what should I do next",
  "next step", "continue"
---

# /god-next

Detect the next logical command and either suggest it or run it.

## Process

1. Check if `.godpowers/PROGRESS.md` exists.
   - If not: route to `/god-init`. Output: "No project found. Run `/god-init` to start."

2. Read PROGRESS.md from disk (NEVER from memory).

3. Scan all artifact paths to verify what actually exists on disk.

4. Reconcile PROGRESS.md with disk truth:
   - If PROGRESS.md says "done" but artifact missing: phantom resume. Repair PROGRESS.md.
   - If artifact exists but PROGRESS.md says "pending": untracked work. Repair PROGRESS.md.

5. Identify the first non-done sub-step in tier order.

6. Apply the routing table below.

7. Present the next command with one-line context. Ask the user if they want
   to run it now (default yes) or stop here.

## Routing Table

| Current State | Next Command | Why |
|---------------|--------------|-----|
| No PROGRESS.md | `/god-init` | Initialize the project |
| PRD pending | `/god-prd` | Write the requirements |
| Architecture pending | `/god-arch` | Design the system (gated on PRD) |
| Roadmap pending | `/god-roadmap` | Sequence the work (gated on ARCH) |
| Stack pending | `/god-stack` | Pick the tech (gated on ARCH) |
| Repo pending | `/god-repo` | Scaffold the repo (gated on Stack) |
| Build pending | `/god-build` | Build the milestone (gated on Roadmap + Repo) |
| Deploy pending | `/god-deploy` | Set up deploy pipeline (gated on Build) |
| Observe pending | `/god-observe` | Wire monitoring (gated on Deploy) |
| Harden pending | `/god-harden` | Adversarial review (gated on Build) |
| Launch pending, harden has Criticals | (pause) | Resolve Criticals first |
| Launch pending, harden clean | `/god-launch` | Launch the product |
| All done | (none) | Project complete. Suggest `/god-audit` to score everything. |

## Workflow Routing (steady state)

When all planning tiers are done (project in steady state), use signal-based
detection to suggest a workflow.

### Detection signals

Check disk state in this order:

| Signal | Suggest |
|--------|---------|
| Active incident in `.godpowers/postmortems/` with no POSTMORTEM.md | `/god-postmortem` |
| Recent `/god-hotfix` commit in last 48 hours, no postmortem | `/god-postmortem` |
| `package.json` outdated >30 days OR audit shows CVEs | `/god-update-deps` |
| Existing `.godpowers/migrations/<slug>/MIGRATION.md` with status != complete | continue `/god-upgrade` |
| Existing `.godpowers/spikes/<slug>/SPIKE.md` with status = inconclusive | suggest `/god-spike` follow-up |
| README or core docs older than last release | `/god-docs` |
| All else equal | ask the user (see User Intent Map below) |

### User Intent Map

If you cannot detect a clear signal, ask:

```
What kind of work are you doing?

  1. Add a feature to existing project   -> /god-feature
  2. Fix urgent production bug           -> /god-hotfix
  3. Debug a non-urgent issue            -> /god-debug
  4. Refactor without behavior change    -> /god-refactor
  5. Research a technical question       -> /god-spike
  6. Investigate a past incident         -> /god-postmortem
  7. Upgrade framework or major dep      -> /god-upgrade
  8. Update documentation                -> /god-docs
  9. Update dependencies                 -> /god-update-deps
  10. Score existing artifacts           -> /god-audit
  11. Quick inline fix                   -> /god-fast
  12. Small task with TDD discipline     -> /god-quick

Or describe what you want to do in your own words and I'll route.
```

### Free-form intent matching

If the user describes their intent in prose, match keywords:

- "feature", "add", "new functionality" -> /god-feature
- "production down", "users seeing errors", "p0", "p1", "urgent" -> /god-hotfix
- "bug", "broken", "doesn't work" -> /god-debug
- "refactor", "clean up", "rename", "extract", "DRY" -> /god-refactor
- "POC", "prototype", "spike", "explore", "research", "feasibility" -> /god-spike
- "postmortem", "RCA", "after-action", "incident review", "what happened" -> /god-postmortem
- "upgrade", "migrate", "bump major", "Node 22", "React 19" -> /god-upgrade
- "docs", "documentation", "README", "API docs" -> /god-docs
- "deps", "dependencies", "npm audit", "outdated" -> /god-update-deps

## Output Format

```
Godpowers Next

Current state: [where we are]
Next: [/god-X]

Why: [one-line reason]

Run it now? (yes / no)
```

If user says yes: invoke the next command directly.
If user says no: stop. They can run it manually later.

## Special Cases

### Stuck on a have-not failure
If the current sub-step is marked `failed` (e.g., PRD failed have-nots check):
suggest re-running the same command rather than skipping forward.

```
Current state: PRD failed have-nots check (target user too generic)
Next: /god-prd (re-run with feedback)
```

### Multiple sub-steps could run in parallel
After Build, both Deploy and Harden are gated only on Build. Suggest the
critical-path option first (Harden, because it gates Launch):

```
Current state: Build done. Two paths available.
Next: /god-harden (gates Launch)

Alternative: /god-deploy (parallel-safe)
Or run both: /god-harden in this session, /god-deploy in another
```

### Mid-build resume
If Build is in-flight (some slices done, some pending):

```
Current state: Build in progress. Wave 2 of 4 complete.
Next: /god-build (continues from wave 3)
```
