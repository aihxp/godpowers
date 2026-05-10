---
name: god-set-profile
description: |
  Switch model profile for Godpowers agents. Different profiles balance
  quality vs cost vs speed differently. Updates intent.yaml.

  Triggers on: "god set profile", "/god-set-profile", "model profile",
  "switch model"
---

# /god-set-profile

Switch the model profile for Godpowers agents.

## Profiles

### quality
Optimized for output quality. Use the strongest model available.
- Slower, more expensive
- Best for production-bound work

### balanced (default)
Strong model for orchestration and review; cheaper for implementation.
- Good cost/quality tradeoff for most projects

### budget
Cheaper model where possible. Quality is acceptable but not maximum.
- Best for hobby projects or early prototyping

### inherit
Use whatever the AI tool's default is. No override.

## Process

1. Show current profile (from intent.yaml config.model-profile)
2. Ask which to set
3. Update intent.yaml
4. Confirm

## Output

```
Model profile: balanced -> quality

Updated .godpowers/intent.yaml.

Effect on next agent spawn:
  - Orchestrator: opus (was sonnet)
  - Reviewers: opus (was sonnet)
  - Executor: sonnet (unchanged)

Override per-command via flags if needed.
```

## Notes

This is a hint to the AI tool, not a hard contract. Some tools may not
honor every profile; check tool's docs.
