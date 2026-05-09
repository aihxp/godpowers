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

## Workflow Routing (when PROGRESS.md exists and user has options)

If the project is in steady state and the user wants to do something specific,
match intent to workflow:

| User intent | Workflow |
|-------------|----------|
| Add a feature to existing project | `/god-feature` |
| Production bug, urgent | `/god-hotfix` |
| Bug found in dev, no urgency | `/god-debug` |
| Refactor code without behavior change | `/god-refactor` |
| Research a technical question | `/god-spike` |
| Review an incident after the fact | `/god-postmortem` |
| Migrate framework or version | `/god-upgrade` |
| Update docs | `/god-docs` |
| Update dependencies | `/god-update-deps` |
| Score existing artifacts | `/god-audit` |
| Quick inline fix | `/god-fast` |
| Small task with TDD | `/god-quick` |

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
