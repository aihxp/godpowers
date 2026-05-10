# Mode Detection

> How god-orchestrator decides which mode (A/B/C/D) to use.

## Mode A: Greenfield (default)

**Signals**:
- No `.godpowers/` directory exists
- Working directory is empty OR contains only `.git/` and `README.md`
- User describes a "new project" or "from scratch"

**Behavior**: run all tiers from PRD onwards.

## Mode B: Gap-fill

**Signals**:
- Some `.godpowers/<tier>/<artifact>` files already exist
- OR existing codebase signals: package.json, Dockerfile, .github/workflows
- User describes an existing project they want to add Godpowers to

**Behavior**:
1. For each canonical artifact path: check existence on disk
2. For each existing artifact: spawn god-auditor to verify against have-nots
3. If passes: mark tier "imported" in PROGRESS.md, skip
4. If fails: mark tier "in-flight", will re-run
5. If missing: mark tier "pending"

Codebase signals (for inferring partial completion):
- `package.json` exists -> Repo tier likely done
- `.github/workflows/` or `.gitlab-ci.yml` exists -> CI present
- `tests/` or `*.test.*` files exist -> Build tier in progress
- `Dockerfile` + deploy config -> Deploy tier may be done

## Mode C: Audit

**Signals**:
- Triggered explicitly with `--audit` flag
- User says "audit the project" or "score everything"

**Behavior**: run god-auditor on all existing artifacts. Build nothing.

## Mode D: Multi-repo (FUTURE WORK)

**Signals**:
- Working directory contains workspace config (pnpm-workspace.yaml, nx.json, lerna.json, turbo.json)
- OR multiple sub-repos with their own `.git/`
- User describes a system spanning multiple repos

**Status**: documented but not implemented in v0.4. Falls back to Mode A or B for the current repo.

## Worked example

User runs `/god-mode` in a directory with:

```
existing-saas/
  .git/
  package.json
  src/
    auth.ts
    api.ts
  tests/
    auth.test.ts
```

god-orchestrator detects:
- No `.godpowers/` -> normally Mode A
- BUT package.json + src/ + tests/ -> existing codebase -> Mode B

Reports to user:
> "Detected an existing codebase (package.json, src/, tests/ present).
> Setting Mode B (gap-fill). I'll work backward to fill missing artifacts.
> First: I need to understand what this codebase does. Let me start with
> /god-explore or you can describe it briefly."
