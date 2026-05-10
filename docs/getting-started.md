# Getting Started with Godpowers

## Install

```bash
npx godpowers --claude --global
```

That's it. No config files. No accounts. The installer copies skills, agents,
hooks, templates, references, and workflows into `~/.claude/`.

For other AI tools: `--codex`, `--cursor`, `--windsurf`, `--gemini`,
`--opencode`, `--copilot`, `--augment`, `--trae`, `--cline`, `--kilo`,
`--antigravity`, `--qwen`, `--codebuddy`, `--pi`. Or `--all` for everything.

### Optional: full design pipeline

For UI work, install these (godpowers detects each lazily; works without
them via the internal fallback path):

```bash
npm install -g agent-browser           # runtime verification (preferred)
agent-browser install                  # downloads Chrome for Testing
npm install -g skillui                 # extract DESIGN.md from any URL
npx skills add https://github.com/pbakaus/impeccable   # design intelligence
```

Catalog (no install): the 71-site awesome-design-md catalog at
github.com/VoltAgent/awesome-design-md is used via lazy fetch when you
run `/god-design from <site>`.

## Your first project (5 minutes)

Open Claude Code in an empty directory. Type:

```
/god-mode
```

Claude will ask what you want to build. Answer in any format. The orchestrator
takes over and runs the full arc:

1. Mode detection (greenfield / gap-fill)
2. Scale detection (trivial / small / medium / large / enterprise)
3. Tier 1: PRD -> Architecture -> Roadmap -> Stack
4. Tier 2: Repo scaffold -> Build (with TDD, two-stage review, atomic commits)
5. Tier 3: Deploy -> Observe -> Harden -> Launch

When complete, you have:
- A working application
- Tests
- Deploy pipeline
- Observability with SLOs
- Security findings (or clean)
- Launch artifacts

All artifacts live in `.godpowers/`. Run `/god-status` any time to see state.

## Want more control?

Skip `/god-mode` and run individual commands:

```
/god-init       Start the project
/god-prd        Write the PRD
/god-arch       Design the architecture
/god-roadmap    Sequence the work
... etc
```

After each, run `/god-next` to see the suggested next command.

## Beyond greenfield

Once you have a working project, ongoing work uses other workflows:

- `/god-feature` to add a feature
- `/god-hotfix` for urgent prod bugs
- `/god-refactor` for safe cleanup
- `/god-spike` for time-boxed research
- `/god-postmortem` after incidents
- `/god-upgrade` for framework migrations
- `/god-docs` for documentation
- `/god-update-deps` for dependency updates
- `/god-hygiene` periodic health check

## Need extensions?

Skill packs add specialized agents:

- `@godpowers/security-pack` - SOC 2, HIPAA, PCI auditors
- `@godpowers/launch-pack` - Show HN, Product Hunt, Indie Hackers, OSS strategists
- `@godpowers/data-pack` - ETL, ML feature, dashboard specialists

In v0.8, install via `/god-extension-add @godpowers/security-pack`.
For now, scaffolds live in `extensions/` and demonstrate the model.

## Disk-authoritative state

Every artifact lives on disk in `.godpowers/`. If a session ends, you can
resume in a new one: it reads the disk and continues. Conversation memory
is never authoritative.

## Pause philosophy

`/god-mode` only pauses for genuine human-only decisions:
1. Ambiguous user intent (two valid directions)
2. Human-constraint flip points (team size, budget, timeline)
3. Statistical ties (two options within 10%)
4. Critical security findings
5. Brand voice / final headline

Add `--yolo` to skip pauses except Critical security. Auto-decisions log to
`.godpowers/YOLO-DECISIONS.md` for review.

## Where to next

- [Concepts](concepts.md) - the vocabulary and mental model
- [Reference](reference.md) - all 60+ commands
- [Tutorial: First Project](tutorials/first-project.md) - end-to-end walkthrough
- [Composing with other tools](../references/shared/ORCHESTRATORS.md) - GSD, Superpowers, BMAD
