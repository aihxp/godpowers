# Godpowers

**Ship fast. Ship right. Ship everything. Ship accountably.**

Godpowers is an AI-powered development system that takes a project from raw
idea to hardened production. It runs as **slash commands inside your AI coding
tool** (Claude Code, Codex, Cursor, etc.) that orchestrate **specialist agents**
in fresh contexts to do the work.

It fuses four disciplines into one unified workflow:

- **Artifact discipline** - every sentence in every document is a labeled
  decision, hypothesis, or open question. Mechanically verified failure modes.
- **Execution engine** - fresh-context agents in parallel waves with atomic
  commits. No context rot. No sequential bottlenecks.
- **Quality immune system** - TDD enforcement, two-stage code review (spec
  compliance + code quality), verification before completion.
- **Team intelligence** - scale-adaptive complexity, specialized agent personas
  (PM, Architect, Executor, Reviewer, Harden Auditor, etc.).

## Install

```bash
npx godpowers --claude --global
```

Other targets: `--codex`, `--cursor`, `--windsurf`, `--opencode`, `--gemini`,
`--copilot`, `--augment`. Or `--all` for everything.

The installer copies:
- Slash command skills to `<runtime>/skills/`
- Specialist agents to `<runtime>/agents/`
- SessionStart hook (Claude Code only) to `<runtime>/hooks/`

## Usage

Open your AI coding tool in any project directory and type:

```
/god-mode
```

That's the autonomous arc. It will run all tiers from idea to hardened
production, pausing only when it has a real question for you.

### Slash Commands

| Command | What it does | Spawns agent |
|---------|--------------|--------------|
| `/god-mode` | Full autonomous arc | god-orchestrator |
| `/god-init` | Start a project, detect mode and scale | (built-in) |
| `/god-prd` | Write the PRD | god-pm |
| `/god-arch` | Design architecture | god-architect |
| `/god-roadmap` | Sequence the work | god-roadmapper |
| `/god-stack` | Pick the technology stack | god-stack-selector |
| `/god-repo` | Scaffold the repository | god-repo-scaffolder |
| `/god-build` | Build it (TDD, parallel waves) | god-planner + god-executor + reviewers |
| `/god-deploy` | Set up deploy pipeline | god-deploy-engineer |
| `/god-observe` | Wire observability | god-observability-engineer |
| `/god-launch` | Launch (gated on harden) | god-launch-strategist |
| `/god-harden` | Adversarial security review | god-harden-auditor |
| `/god-status` | Re-derive state from disk | (built-in) |
| `/god-audit` | Score artifacts against have-nots | god-auditor |
| `/god-debug` | 4-phase systematic debug | god-debugger |
| `/god-review` | Two-stage code review | god-spec-reviewer + god-quality-reviewer |

### God Mode Flags

```
/god-mode                # Standard: pauses for real questions only
/god-mode --yolo         # Zero pauses. Picks every default. Full send.
/god-mode --conservative # More checkpoints
/god-mode --from=arch    # Resume from a specific tier
/god-mode --audit        # Score existing artifacts. Build nothing.
/god-mode --dry-run      # Plan everything. Build nothing.
```

## Architecture

### Slash Command + Specialist Agent Pattern

Each slash command is a **thin orchestrator**. It does NOT do the work itself.
It spawns the right specialist agent in a **fresh context** to do the work.

```
You type:        /god-prd
Skill loads:     skills/god-prd.md
Skill spawns:    god-pm agent (fresh 200K context)
Agent reads:     .godpowers/PROGRESS.md
Agent writes:    .godpowers/prd/PRD.md
Skill verifies:  artifact exists, have-nots pass
Skill updates:   PROGRESS.md
```

### The Four Tiers

| Tier | Sub-steps | Specialists |
|------|-----------|-------------|
| 0: Orchestration | mode detection, scale, progress | god-orchestrator |
| 1: Planning | PRD, ARCH, ROADMAP, STACK | god-pm, god-architect, god-roadmapper, god-stack-selector |
| 2: Building | repo, plan, execute, review | god-repo-scaffolder, god-planner, god-executor, god-spec-reviewer, god-quality-reviewer |
| 3: Shipping | deploy, observe, launch, harden | god-deploy-engineer, god-observability-engineer, god-launch-strategist, god-harden-auditor |

### Artifact Paths

```
.godpowers/PROGRESS.md         Cross-tier progress ledger
.godpowers/prd/PRD.md          Product Requirements Document
.godpowers/arch/ARCH.md        System Architecture
.godpowers/arch/adr/           Architecture Decision Records
.godpowers/roadmap/ROADMAP.md  Sequenced Roadmap
.godpowers/stack/DECISION.md   Stack Decision (with flip points)
.godpowers/repo/AUDIT.md       Repo Scaffold Audit
.godpowers/build/PLAN.md       Build Plan (slices, waves)
.godpowers/build/STATE.md      Build State
.godpowers/deploy/STATE.md     Deploy Pipeline State
.godpowers/observe/STATE.md    Observability State
.godpowers/launch/STATE.md     Launch State
.godpowers/harden/FINDINGS.md  Security Findings
```

## Quality Guarantees

Every artifact passes these mechanical checks:

| Check | What it catches |
|---|---|
| Substitution test | AI-slop (generic output that reads the same for any product) |
| Three-label test | Unlabeled assumptions hiding as decisions |
| Have-nots | Named failure modes, grep-testable per tier |
| Artifact-on-disk | Phantom resume (agent claims done, file does not exist) |
| Critical-finding gate | Shipping with known security holes |
| TDD enforcement | Code without tests |
| Two-stage review | Code that passes tests but violates spec or quality |

## Pause Philosophy

God Mode pauses only when:

1. User intent is genuinely ambiguous (two valid directions)
2. A flip-point depends on human-only constraints (team size, budget)
3. Two options score within 10% with no objective tiebreaker
4. A Critical security finding needs human judgment
5. Brand/copy decisions require the human's voice

Every pause includes: what the question is, why only the human can answer,
options with tradeoffs, and a default if the user just says "go".

## Supported Tools

Claude Code, Codex, Cursor, Windsurf, Gemini CLI, OpenCode, Copilot, Augment.

## License

MIT
