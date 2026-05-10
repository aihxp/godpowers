---
name: god-init
description: |
  Initialize a Godpowers project. Detects operating mode (greenfield, gap-fill,
  audit, multi-repo) and project scale. Creates .godpowers/ directory with
  PROGRESS.md.

  Triggers on: "god init", "start a project", "new project", "initialize"
---

# God Init

Initialize the Godpowers project structure.

## Process

This skill is a thin wrapper. Detection happens automatically; user never
needs to specify a mode.

1. Check if `.godpowers/` already exists:
   - If yes: read PROGRESS.md, report current state, ask if user wants to
     reset or resume
   - If no: proceed with initialization

2. **Auto-detect what kind of project this is** (background, no user prompt):
   - Scan working directory for code presence:
     - package.json / pyproject.toml / Cargo.toml / go.mod / Gemfile / etc.
     - src/ or lib/ with files
     - Existing tests
   - Look for org-level context (current dir + parent dirs):
     - .godpowers/org-context.yaml
     - Workspace configs that share standards

3. **Announce findings in plain English** (no jargon):
   - Empty dir + no org context: "Detected: empty directory. Starting fresh."
   - Empty dir + org context: "Detected: empty directory + org standards.
     I'll respect your org's tooling/infrastructure choices."
   - Code present + no org context: "Detected: existing codebase. I'll
     understand it before changing anything (archaeology + reconstruction)."
   - Code present + org context: "Detected: existing codebase + org standards.
     I'll archaeology, reconstruct, and respect your org's standards."

4. Ask the user to describe what they want to build. Accept any format.

5. Spawn **god-orchestrator** in fresh context with the user's description and
   the detected mode/context.

   The orchestrator will:
   - Run Mode Detection (announced in plain English; stored as A/B/C/E internally)
   - Run Scale Detection (trivial/small/medium/large/enterprise)
   - For brownfield: schedule archaeology + reconstruction as preflight
   - For bluefield: load org-context as constraint
   - Create directory structure
   - Write PROGRESS.md with mode, scale, timestamp, tier states
   - Return mode/scale/announcement to this skill

4. Detect scale by analyzing the description:
   - **Trivial**: Single file change, bug fix, config tweak
   - **Small**: One feature, one service, <1 week
   - **Medium**: Multiple features, 1-3 services, 1-4 weeks
   - **Large**: Multiple services, team coordination, 1-3 months
   - **Enterprise**: Multiple teams, compliance, 3+ months

5. Create the directory structure:
   ```
   .godpowers/
     PROGRESS.md
     prd/
     arch/
       adr/
     roadmap/
     stack/
     repo/
     build/
     deploy/
     observe/
     launch/
     harden/
   ```

6. Write PROGRESS.md with mode, scale, timestamp, all tiers set to `pending`

7. Report to the user:
   - Detected mode and scale
   - Which tiers and personas will activate
   - What to run next (suggest `god prd` or `god mode`)

## Scale-Adaptive Activation

| Scale | Planning depth | Personas | Ceremonies |
|-------|---------------|----------|------------|
| Trivial | Skip to build | Dev only | None |
| Small | Lightweight PRD, skip ARCH | Dev | None |
| Medium | Full PRD, ARCH, Roadmap | PM, Dev, QA | None |
| Large | Full planning, all tiers | PM, Arch, Dev, QA | Optional sprints |
| Enterprise | Full planning, compliance | All personas | Full sprints, retros |

## Output

`.godpowers/PROGRESS.md` created with initial state.

## On Completion

After init completes, print:

```
Godpowers initialized.

Mode: [detected mode]
Scale: [detected scale]

Suggested next: /god-prd (write the requirements)
Or: /god-mode (run the full autonomous arc)
```
