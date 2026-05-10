# DESIGN.md Anatomy

> What a good DESIGN.md looks like. Format follows the
> [Google Labs design.md spec](https://github.com/google-labs-code/design.md);
> tone and discipline follow the
> [Impeccable skill](https://github.com/pbakaus/impeccable).

## Structure

A DESIGN.md has two layers:

1. **YAML frontmatter** (machine-readable design tokens, delimited by `---`)
2. **Markdown body** (human-readable rationale organized into `##` sections)

The tokens are normative. The prose explains how to apply them.

## Required frontmatter fields

| Field | Required | Format |
|---|---|---|
| `name` | yes | string (e.g., "Heritage", "MRR Tracker") |
| `description` | yes | one-line summary of the visual register |
| `colors` | yes if visual surface | map of token-name -> color value |
| `typography` | yes if visual surface | map of style-name -> typography object |
| `rounded` | optional | map of scale-level -> dimension |
| `spacing` | yes if visual surface | map of scale-level -> dimension |
| `components` | optional | map of component-name -> sub-token map |

## Section order

Use `##` headings. Sections can be omitted; those present must appear in this order:

| # | Section | Aliases |
|---|---|---|
| 1 | Overview | Brand & Style |
| 2 | Colors | |
| 3 | Typography | |
| 4 | Layout | Layout & Spacing |
| 5 | Elevation & Depth | Elevation |
| 6 | Shapes | |
| 7 | Components | |
| 8 | Do's and Don'ts | |

Duplicate `##` headings are an error.

## Token references

Components can reference tokens via curly-brace syntax: `{colors.primary}`,
`{rounded.sm}`. Token references must resolve to a defined token.

```yaml
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.sm}"
    padding: 12px
```

## What "good" looks like

A good DESIGN.md:

- [DECISION] Names a register: brand or product. Brand surfaces (marketing,
  landing) are ornamental. Product surfaces (app shell, dashboards) serve
  the data.
- [DECISION] Uses OKLCH for colors when wide-gamut accuracy matters.
  Falls back to hex sRGB for compatibility with linters that don't yet
  parse OKLCH.
- [DECISION] Sets typography for one or two type families maximum. The
  display family may differ from the body family if the register calls
  for it.
- [DECISION] Names every component used in the UI. Variants (hover,
  active, disabled) are separate component entries with related keys.
- [DECISION] Includes a Do's and Don'ts section with explicit
  anti-patterns: what NOT to do for this design.
- [DECISION] Stays under 300 lines. Heavy detail (component variations,
  edge cases) lives in code documentation, not DESIGN.md.

## What "bad" looks like

See [DESIGN-ANTIPATTERNS.md](./DESIGN-ANTIPATTERNS.md).

## Validation

Every DESIGN.md should pass:

- `npx @google/design.md lint DESIGN.md` (Google Labs spec linter)
- `npx impeccable detect DESIGN.md` (Impeccable anti-patterns)

Godpowers' god-design-reviewer agent runs both as part of the two-stage
review gate.

## Worked example

See `examples/saas-mrr-tracker/DESIGN.md` for a complete, lint-clean example.

## Domain-specific references

These shorter, focused references cover the 7 design domains at
shallower depth than Impeccable's full skill set. Used by god-designer
when Impeccable is not installed; useful as a baseline regardless:

- [TYPOGRAPHY.md](./TYPOGRAPHY.md) - type families, scales, line-height,
  tabular numerals
- [COLOR.md](./COLOR.md) - OKLCH, 5-color rule, WCAG contrast,
  dark mode, tinted neutrals
- [SPATIAL.md](./SPATIAL.md) - spacing scales, grids, touch targets,
  vertical rhythm
- [MOTION.md](./MOTION.md) - durations, easings, prefers-reduced-motion,
  staggering
- [INTERACTION.md](./INTERACTION.md) - forms, focus states, buttons,
  loading patterns, empty states
- [RESPONSIVE.md](./RESPONSIVE.md) - breakpoints, mobile-first, touch
  targets, container queries
- [UX-WRITING.md](./UX-WRITING.md) - button labels, error messages,
  empty states, tone calibration

For deeper guidance on any domain, install
[Impeccable](https://github.com/pbakaus/impeccable) and use its 7
domain-specific skills.
