# Docs Update Log

> Every claim in docs must be verifiable against code. Drift between docs
> and code is a have-not.

Date: [ISO 8601]
Owner: [user]

## Inventory

### Docs reviewed
- [doc path] - [last modified] - [brief description]
- [...]

### Code surface
- Public APIs: [count]
- CLI commands: [count]
- Env vars: [count]
- Slash commands (if Godpowers project): [count]

## Verified Claims

For each existing doc, every claim was checked against code.

| Doc | Claims checked | Passed | Drift found |
|-----|---------------|--------|-------------|
| README.md | [N] | [N] | [N] |
| CONTRIBUTING.md | [N] | [N] | [N] |

## Drift Found

| Doc | Claim | Reality | Action |
|-----|-------|---------|--------|
| README.md | "npm start" | package.json has "dev" | Updated README |
| docs/api.md | Returns Promise<User> | Returns Promise<User \| null> | Updated docs |

## Updated

- [Doc path]: [what changed and why]

## Created

- [New doc path]: [why it was needed]

## Verified Examples

Every code example in docs was actually run.

| Doc | Example | Result |
|-----|---------|--------|
| README.md | Quick start command | Ran successfully |
| docs/api.md | curl example | Returned expected response |

---

## Have-Nots Checklist

- [ ] Every claim verified against code
- [ ] Drift documented and corrected
- [ ] Examples actually run
- [ ] Substitution test passed (no generic prose)
- [ ] Three-label test passed
- [ ] Diagrams reflect current state (not past or future)
- [ ] Runbooks executed before commit
