# Scale Detection

> How god-orchestrator infers project scale from the user's description.

## Five scales

| Scale | Signals | Recommended workflow |
|-------|---------|---------------------|
| Trivial | Single-file change, bug fix, config tweak | /god-fast (skip planning) |
| Small | One feature, one service, <1 week | /god-quick OR lightweight /god-mode |
| Medium | Multiple features, 1-3 services, 1-4 weeks | /god-mode (full project run) |
| Large | Multiple services, team coordination, 1-3 months | /god-mode + /god-sprint (sprints) |
| Enterprise | Multiple teams, compliance, 3+ months | /god-mode + extension packs (security, etc.) |

## Detection signals

### Trivial signals
- "fix typo"
- "change config value"
- "rename variable"
- One file mentioned

### Small signals
- "build [single feature]"
- "add [one thing] to my app"
- One service mentioned
- Time mentioned: "today", "this afternoon"

### Medium signals
- Multiple features mentioned
- Multiple services or components mentioned
- Time mentioned: "next few weeks", "this sprint"
- "SaaS for X" or "MVP" or "side project"

### Large signals
- "platform"
- Multiple teams mentioned
- Time mentioned: "next quarter", "next 2-3 months"
- Mentions multiple stakeholder roles (PM, designer, QA)

### Enterprise signals
- Compliance mentioned (SOC 2, HIPAA, PCI, GDPR)
- Multiple teams mentioned
- Multi-region mentioned
- Time mentioned: "next year", "Q1-Q3"
- Words like "enterprise", "B2B", "regulated industry"

## What scale changes

| Scale | Tiers active | Personas | Ceremonies | Hygiene |
|-------|--------------|----------|------------|---------|
| Trivial | Build only | god-executor | None | None |
| Small | PRD (lightweight), Build, Deploy | PM, Dev | None | None |
| Medium | All tiers | PM, Architect, Dev, QA | None | Weekly /god-hygiene |
| Large | All tiers | All | /god-sprint optional | Weekly /god-hygiene |
| Enterprise | All tiers + extension packs | All + extensions | /god-sprint required | Daily /god-hygiene |

## Worked examples

### "Add a typo fix to the README"
-> Trivial -> /god-fast

### "Build a side project to track my reading list"
-> Small -> lightweight /god-mode (skip ARCH)

### "Build a SaaS for solo founders to track MRR"
-> Medium -> /god-mode

### "Build a platform for our 5-person team to track customer health"
-> Large -> /god-mode + /god-sprint

### "Build a HIPAA-compliant patient portal for a hospital"
-> Enterprise -> /god-mode + @godpowers/security-pack

## When in doubt

If signals are mixed, ask the user explicitly:
> "I detect signals between Medium and Large scale. Are you a solo
> developer or a team? How long do you plan to work on this?"

The user's answer determines the scale.
