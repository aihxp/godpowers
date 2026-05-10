# Composing with Other AI Coding Workflow Systems

> Godpowers is one of several skill-based AI dev tools. Here's how it
> composes with others, what's safe to combine, and how to resolve
> conflicts.

Godpowers does not assume it's the only AI workflow system installed.
Many users layer multiple tools (planning frameworks, discipline harnesses,
codebase mappers, story trackers). The rules below let them coexist.

## Coexistence principles

1. **One state directory per project.** Godpowers owns `.godpowers/`.
   Other systems own their own directories (e.g. `.planning/`,
   `.<vendor>/`). Don't point two systems at the same directory.

2. **Skills can coexist in `~/.claude/skills/`** (or the equivalent for
   other AI tools). The AI tool routes by description match. Multiple
   `/god-*` skills and any other namespace coexist fine.

3. **Don't mix recovery commands across systems.** `/god-undo` reverts
   Godpowers state only. If another tool also writes to `.godpowers/`,
   recovery drifts. Keep recovery scopes disjoint.

4. **Hooks are per-tool but share the directory.** SessionStart hooks
   from multiple systems live in `~/.claude/hooks/` and run sequentially.
   Order is not guaranteed; do not rely on cross-tool hook ordering.

5. **Resolve conflicts by state-directory ownership.** If Godpowers
   says X and another tool says Y about the same artifact, follow
   whichever system owns the directory the artifact lives in.

## When two systems overlap

| Overlap kind | Strategy |
|---|---|
| Both write to the same artifact | Pick one as authoritative. Disable the other's writer for that artifact. |
| Both define a planning workflow | Pick one for planning. Mixing creates duplicate state and divergent truth. |
| One reasons (TDD, review), the other plans (PRD/ARCH) | Stack them. They're orthogonal. |
| Both ship slash commands with similar names | Disambiguate by prefix. `/god-*` is reserved for Godpowers. |

## Migration into Godpowers

If you arrive at Godpowers carrying artifacts from another system,
`/god-init` Mode B (gap-fill) reads what exists and maps it forward:

- Existing PRD-like documents -> `.godpowers/prd/PRD.md` (after
  substitution-test rewrite if needed)
- Existing ADRs -> `.godpowers/arch/adr/`
- Existing roadmap / milestones -> `.godpowers/roadmap/ROADMAP.md`
- Existing story / ticket files -> `.godpowers/stories/STORY-*.md`
  (via `/god-story`)

Mode B does not delete the source files. It produces Godpowers
artifacts alongside them. Once parity is reached, you can retire the
older system at your own pace.

## Migration out of Godpowers

Every Godpowers artifact is a plain Markdown file with optional
frontmatter. There's no proprietary binary state. To leave:

1. Copy `.godpowers/prd/`, `arch/`, `roadmap/`, `stack/` somewhere.
2. Strip the fenced "Implementation Linkage" footers if the target
   system doesn't understand them (they're recoverable from code
   annotations).
3. Delete `.godpowers/`.

## What Godpowers does not try to be

Godpowers is opinionated about: artifact discipline, bidirectional
linkage, the four-tier arc, the single-orchestrator rule, headless
runtime verification, and the substitution / three-label / have-nots
gates. It is intentionally not opinionated about: team ceremonies,
sprint cadence, ticket trackers, knowledge graphs, prompt engineering
methodology. If you need those, run them alongside.
