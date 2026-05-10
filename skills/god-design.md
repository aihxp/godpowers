---
name: god-design
description: |
  Design lifecycle commands. Owns DESIGN.md (Google Labs spec) and
  PRODUCT.md (impeccable strategic file). Detects impeccable; bridges
  to its 23 commands when present. Falls back to a minimal builder when
  not.

  Triggers on: "god design", "/god-design", "design system", "visual identity",
  "polish design", "critique design", "audit design", "design tokens",
  "brand register", "design.md", "product.md"
---

# /god-design

Front door for all design work in a Godpowers project. Bridges to
[Impeccable](https://github.com/pbakaus/impeccable) when installed,
producing DESIGN.md in the
[Google Labs design.md format](https://github.com/google-labs-code/design.md).

## Forms

| Form | Action |
|---|---|
| `/god-design` | Run the full setup flow (delegates to /impeccable teach if installed) |
| `/god-design teach` | Strategic interview + DESIGN.md + PRODUCT.md (impeccable teach) |
| `/god-design document` | Regenerate DESIGN.md from existing code (impeccable document) |
| `/god-design refresh` | Alias for document |
| `/god-design extract` | Pull components into design system (impeccable extract) |
| `/god-design shape` | Plan UX/UI before code (impeccable shape) |
| `/god-design critique [scope]` | UX design review (impeccable critique) |
| `/god-design audit [scope]` | a11y / perf / responsive (impeccable audit) |
| `/god-design polish [scope]` | Final pass before shipping (impeccable polish) |
| `/god-design harden` | Error handling, i18n, edge cases (impeccable harden) |
| `/god-design onboard` | First-run flows, empty states (impeccable onboard) |
| `/god-design bolder` | Amplify boring designs (impeccable bolder) |
| `/god-design quieter` | Tone down overly bold (impeccable quieter) |
| `/god-design distill` | Strip to essence (impeccable distill) |
| `/god-design animate` | Add purposeful motion (impeccable animate) |
| `/god-design colorize` | Strategic color (impeccable colorize) |
| `/god-design typeset` | Fix font choices, hierarchy (impeccable typeset) |
| `/god-design layout` | Fix layout, spacing (impeccable layout) |
| `/god-design delight` | Add moments of joy (impeccable delight) |
| `/god-design overdrive` | Technically extraordinary effects (impeccable overdrive) |
| `/god-design clarify` | Improve unclear UX copy (impeccable clarify) |
| `/god-design adapt` | Adapt for different devices (impeccable adapt) |
| `/god-design optimize` | Performance improvements (impeccable optimize) |
| `/god-design live` | Visual variant mode (impeccable live) |
| `/god-design status` | Lint findings + drift report |
| `/god-design impact "<change>"` | What-if analysis (delegates to god-impact-analyzer) |

## Process

1. Verify `.godpowers/` exists. If not: "Run `/god-init` first."
2. Read `.godpowers/state.json` for project state.
3. Detect:
   - `lib/design-detector.isUiProject()` - is UI required?
   - `lib/design-detector.isImpeccableInstalled()` - is impeccable available?
4. If UI not required: warn that DESIGN is unusual for this project type;
   confirm before proceeding.
5. Spawn `god-designer` with the requested subcommand.
6. After god-designer returns: surface any lint findings, suggest
   `/god-design polish` if warnings exist.

## Detection-driven behavior

- **UI + impeccable installed**: bridges to impeccable's commands
  through `lib/impeccable-bridge.js`. All 23 commands available.
- **UI + impeccable NOT installed**: prompts to install impeccable; if
  declined, falls back to god-designer's minimal builder. A subset of
  commands (teach, document, status, impact) work in fallback.
- **No UI**: tries to dissuade. If user insists, fallback builder runs
  but recommends skipping the DESIGN tier entirely.

## Two-stage review on changes

When DESIGN.md or PRODUCT.md change as a result of any subcommand:

1. `god-design-reviewer` runs in two-stage gate (spec + quality)
2. PASS: change applied; downstream propagation runs (impact, REVIEW-REQUIRED)
3. WARN: change applied with warnings logged
4. BLOCK: change rejected; appended to `.godpowers/design/REJECTED.md`;
   user told why and what to fix

This pattern mirrors code review (god-spec-reviewer + god-quality-reviewer)
applied to design.

## Output

Project root:
- `DESIGN.md` (Google Labs format, lint-clean)
- `PRODUCT.md` (impeccable strategic file, when impeccable installed)

Inside `.godpowers/design/`:
- `STATE.md` (lint history, version, impeccable command log)
- `HISTORY.md` (append-only log of design changes; populated by god-design-updater)
- `REJECTED.md` (append-only log of blocked changes; populated by god-design-reviewer)

## Output to events.jsonl

For every subcommand dispatch:

```json
{ "name": "impeccable.dispatch", "command": "polish", "scope": "header" }
{ "name": "design.review-verdict", "verdict": "PASS|WARN|BLOCK" }
{ "name": "design.lint-result", "errors": 0, "warnings": 1 }
```

## See also

- `lib/design-detector.js` - UI and impeccable detection
- `lib/design-spec.js` - Google Labs format parser and linter
- `lib/impeccable-bridge.js` - command dispatch layer
- `agents/god-designer.md` - lifecycle owner
- `agents/god-design-reviewer.md` - two-stage review gate
- `references/design/DESIGN-ANATOMY.md` - what good DESIGN.md looks like
- `references/design/DESIGN-ANTIPATTERNS.md` - what to avoid
