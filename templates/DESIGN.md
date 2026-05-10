---
name: [Name your design system; one-word codename or product name]
description: [One line. Visual register and feel. Brand vs product.]
colors:
  # Use OKLCH for wide-gamut accuracy; fall back to hex sRGB if linter requires.
  ink: "oklch(20% 0.01 250)"
  paper: "oklch(98% 0.005 80)"
  accent: "oklch(60% 0.18 250)"
  rule: "oklch(88% 0.01 250)"
typography:
  display:
    fontFamily: "[Display family, Georgia, serif]"
    fontSize: "clamp(2rem, 5vw, 3.25rem)"
    fontWeight: 400
    lineHeight: 1.1
  body:
    fontFamily: "[Body family, system-ui, sans-serif]"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "[Body family, system-ui, sans-serif]"
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
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "24px"
---

## Overview

[DECISION] [One paragraph. What register is this (brand vs product)? What
does it feel like, grounded in named references? Who is it for?]

## Colors

[DECISION] [Explain palette choices. Why these colors, what they signal,
what they avoid. Reference impeccable's anti-patterns: no purple-blue
gradients, no pure black, no gray text on colored backgrounds.]

## Typography

[DECISION] [Why this type pairing. What each style is used for. Tabular
numerals for tables.]

## Layout

[DECISION] [Grid model, breakpoints, default spacing rhythm.]

## Components

[DECISION] [Name only the canonical components. Variants (hover, active,
disabled) are systematic, not bespoke.]

## Do's and Don'ts

- [DECISION] Do: [specific positive pattern]
- [DECISION] Don't: [specific anti-pattern to avoid]
