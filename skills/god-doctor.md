---
name: god-doctor
description: |
  Diagnose Godpowers install state and project state. Reports installed
  runtimes, version mismatches, missing files, broken artifact paths,
  unwired skills, and orphan routing. Suggests fixes.

  Triggers on: "god doctor", "/god-doctor", "diagnose godpowers", "what's
  broken", "is godpowers ok"
---

# /god-doctor

Run a system-state diagnostic. Build nothing. Touch nothing. Report only.

## What it checks

### Install integrity (per runtime)
1. Is the runtime config dir present? (e.g. `~/.claude/`)
2. Is `<runtime>/skills/god-*.md` populated?
3. Is `<runtime>/agents/god-*.md` populated?
4. Is `<runtime>/godpowers-references/` populated?
5. Does `<runtime>/GODPOWERS_VERSION` match `bin/install.js` VERSION?
6. Are all referenced agents present in `agents/`?
7. Are all routing YAMLs paired with skill files?

### Project state integrity
1. Is `.godpowers/` present?
2. Is `state.json` valid against `schema/state.v1.json`?
3. Is `intent.yaml` valid against `schema/intent.v1.yaml.json`?
4. Do declared artifact paths exist on disk?
5. Is the reflog (`.godpowers/log`) parseable?
6. Are there entries in `.godpowers/.trash/`?
7. Do declared linkage entries point at real code files?

### External integration health
1. Is impeccable present? `node_modules/impeccable` or `~/.claude/skills/impeccable`?
2. Is agent-browser installed and reachable on PATH?
3. Is SkillUI present?

## Output

Plain-text report grouped by severity:

```
GODPOWERS DOCTOR

Install: claude (~/.claude/)
  [OK] 106 skills installed
  [OK] 39 agents installed
  [OK] VERSION matches (1.6.3)
  [WARN] routing/god-doctor.yaml exists but skill file did not until now

Project: /Users/.../my-project/.godpowers/
  [OK] state.json valid
  [WARN] PRD declared but .godpowers/prd/PRD.md missing -> run /god-prd
  [INFO] 2 entries in .trash/; run /god-restore to review

External integrations:
  [OK] impeccable found via npx
  [WARN] agent-browser not installed -> /god-test-runtime falls back to Playwright

Suggested next steps:
  1. /god-prd  (fill missing artifact)
  2. /god-restore  (review trash)
```

## Subcommands

### `/god-doctor`
Full diagnostic across install + project + integrations.

### `/god-doctor --install-only`
Skip project checks.

### `/god-doctor --project-only`
Skip install checks. Useful inside the project.

### `/god-doctor --fix`
Attempt to repair detected issues automatically (only for safe categories: regenerate missing routing YAMLs, repair PROGRESS.md from state.json, etc.). Pauses before any destructive change.

## Implementation

Built-in, no spawned agent. Reads:
- `<runtime>/GODPOWERS_VERSION` (compare to package.json)
- `<runtime>/skills/` and `<runtime>/agents/` listings
- `.godpowers/state.json`, `intent.yaml`, `log`, `linkage.json`
- `bin/install.js` VERSION constant

## Exit codes

- 0: everything green
- 1: warnings present, but functional
- 2: errors present, manual repair needed
