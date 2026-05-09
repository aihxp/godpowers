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

1. Check if `.godpowers/` already exists:
   - If yes: read PROGRESS.md, report current state, ask if user wants to
     reset or resume
   - If no: proceed with initialization

2. Ask the user to describe what they want to build. Accept any format.

3. Detect operating mode:
   - **Mode A (greenfield)**: No existing code, no existing artifacts
   - **Mode B (gap-fill)**: Existing codebase, missing artifacts
   - **Mode C (audit)**: Existing artifacts to score
   - **Mode D (multi-repo)**: Multiple repositories to coordinate

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
