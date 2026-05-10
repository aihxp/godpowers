---
name: MRR Tracker
description: Editorial-warm dashboard for solo SaaS founders. Restrained, data-first, weekday-morning tone.
colors:
  ink: "oklch(20% 0.01 250)"
  ink-soft: "oklch(45% 0.01 250)"
  paper: "oklch(98% 0.005 80)"
  paper-warm: "oklch(95% 0.01 80)"
  rule: "oklch(88% 0.01 250)"
  growth: "oklch(60% 0.15 145)"
  shrink: "oklch(58% 0.20 25)"
  accent: "oklch(55% 0.18 250)"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2rem, 5vw, 3.25rem)"
    fontWeight: 400
    lineHeight: 1.1
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 500
    lineHeight: 1.2
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  numeric:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 600
    fontFeature: "tnum"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
components:
  card:
    backgroundColor: "{colors.paper-warm}"
    rounded: "{rounded.md}"
    padding: "24px"
  number-block:
    typography: "{typography.numeric}"
    textColor: "{colors.ink}"
  growth-pill:
    backgroundColor: "{colors.growth}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  shrink-pill:
    backgroundColor: "{colors.shrink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
---

## Overview

[DECISION] The MRR Tracker dashboard is built for early-morning Monday review:
the founder opens the email digest, clicks through, and within five seconds
sees the cause-of-change for last week. The visual register is editorial
(serif display + sans body) rather than product (sans throughout) to feel
like reading a board update, not configuring an app.

## Colors

[DECISION] Two functional colors carry the entire UI: growth (oklch greens) and
shrink (oklch reds). Both use OKLCH for wide-gamut accuracy and consistent
perceptual lightness. The palette stays warm-paper to avoid the "AI dashboard"
aesthetic that floods category leaders.

- **ink**: deep neutral for body and headlines
- **paper / paper-warm**: warm cream surfaces, never pure white
- **growth**: positive direction; used for new MRR pills
- **shrink**: negative direction; used for contraction pills
- **accent**: drill-down link color; used sparingly

## Typography

[DECISION] Fraunces for display and headlines (editorial), Inter for body and
numeric (legibility). Numeric figures use tabular nums (`tnum`) for column
alignment in tables.

## Layout

[DECISION] Single-column on mobile, two-column (sidebar + content) on desktop.
The cause-of-change breakdown owns the hero position above the fold;
historical chart and customer drill-down sit below.

## Components

The four canonical components above (card, number-block, growth-pill,
shrink-pill) compose every screen. No additional component patterns until
post-V1 demands them.

## Do's and Don'ts

- [DECISION] Do: tabular numbers for any column of figures
- [DECISION] Do: large numeric blocks for the three buckets (new, expansion, contraction)
- [DECISION] Don't: gradients, glass effects, or "AI sheen"
- [DECISION] Don't: bright primary blue (would feel category-AI)
- [DECISION] Don't: nest cards inside cards
