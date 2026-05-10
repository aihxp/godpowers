# Roadmap Anatomy

## Now / Next / Later (Shape Up flavor)

**Now**: currently building. Committed. Has a target date but slippage is OK.
**Next**: planned to start when Now ships. Order is set, scope is flexible.
**Later**: intent. May change. Captures direction without commitment.

## Milestone Structure

Each milestone has:
- **Goal**: what users can DO when this ships (substitution-tested)
- **Completion gate**: observable criterion ("not feels done")
- **Size**: S / M / L (T-shirt; no day-precision without capacity input)
- **Depends on**: explicit upstream milestones
- **Features**: from PRD (no speculative features)

## Examples

### Good
> Milestone 1 (Now): Connect Stripe + see basic MRR
> - Goal: User can connect Stripe in <60s and see current MRR breakdown by new/expansion/churn
> - Gate: 5 friendly users complete onboarding without help
> - Size: M
> - Depends on: none
> - Features: PRD-MUST-1, PRD-MUST-2

### Bad
> Milestone 1: Build the dashboard
> - Goal: have a dashboard
> - Gate: it works
> - Size: ?
> - Features: dashboard, charts, things

## Velocity Tracking

After 2 sprints, you have a baseline. Use it for Next milestones.

| Sprint | Committed | Delivered | Notes |
|--------|-----------|-----------|-------|
| 1 | 5 slices | 4 | Auth slice underestimated |
| 2 | 5 slices | 6 | Recovered the auth overhang |
| Avg | 5/sprint | 5/sprint | Stable baseline |
