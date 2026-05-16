# Godpowers - Agent Brief

This is the Godpowers repository: an AI-powered development system that takes
projects from raw idea to hardened production.

## Reading Order

1. `README.md` - what this is, how to use it
2. `SKILL.md` - the core skill (the brain)
3. `skills/god-mode.md` - the autonomous orchestrator
4. `skills/god-init.md` - project initialization
5. `skills/god-prd.md` through `skills/god-harden.md` - individual tier skills

## Architecture

- `SKILL.md` is the main entry point, loaded by AI coding tools
- `skills/` contains individual command skills (one per file)
- `references/` contains per-tier reference material (antipatterns, examples)
- `bin/` contains the CLI installer and `god` command
- `scripts/` contains validation and testing scripts
- `templates/` contains artifact templates

## Conventions

- Every skill file has YAML frontmatter with `name`, `description`, and trigger phrases
- Every tier skill documents its gate check (upstream dependency)
- Every tier skill documents its have-nots (failure modes)
- Artifacts are written to `.godpowers/<tier>/` paths
- State is tracked in `.godpowers/PROGRESS.md`
- Disk state is authoritative; conversation memory is not

## Quality Rules

- No em dashes or en dashes (use commas, colons, semicolons, or parentheses)
- No emojis (use `+`, `-`, `x`, `!` for status indicators)
- Every sentence in generated artifacts must be labeled: DECISION, HYPOTHESIS, or OPEN QUESTION
- Every claim must fail the substitution test (swap in a competitor, sentence must break)

<!-- pillars:begin -->
## Godpowers Pillars Protocol

- [DECISION] Load `agents/context.md` and `agents/repo.md` before Godpowers commands make durable project decisions.
- [DECISION] Load additional `agents/*.md` pillar files only when their frontmatter matches the task.
- [DECISION] Treat `.godpowers/state.json`, `.godpowers/PROGRESS.md`, and `.godpowers/CHECKPOINT.md` as workflow state.
- [DECISION] Treat Pillars files as portable project context for any coding agent that opens this repository.
- [DECISION] Disk state wins over conversation memory when these sources disagree.
<!-- pillars:end -->
