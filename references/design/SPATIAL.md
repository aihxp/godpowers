# Spatial Design

> Godpowers' baseline guidance for spacing, grids, and rhythm.
> Shallower than
> [Impeccable's spatial-design reference](https://github.com/pbakaus/impeccable/blob/main/skill/reference/spatial-design.md).

## Pick one spacing scale, use it everywhere

Match the typography ratio. If your type uses 1.25 (Major Third), use
the same for spacing:

```yaml
spacing:
  xs: 8px
  sm: 12px       # 8 * 1.25^1
  md: 16px       # 8 * 1.25^2  (rounded)
  lg: 24px       # 8 * 1.25^3.5 (rounded to grid)
  xl: 32px
  2xl: 48px
  3xl: 64px
```

Powers-of-2 friendly values (8, 16, 24, 32, 48, 64) are good defaults
because they hit common breakpoints and feel anchored.

## Anti-patterns

- **Random px values** (13px, 17px, 22px). The reader can't tell, but
  the system feels noisy. Stick to the scale.
- **Cards-in-cards-in-cards.** Wrap once. Twice if structurally needed.
  Three times means you're nesting visual containers to hide a layout
  problem.
- **Same padding everywhere.** Buttons, cards, and sections need
  different breathing room. Tokenize: `padding-button: md`,
  `padding-card: lg`, `padding-section: 3xl`.
- **Cramped touch targets.** Mobile minimum: 44x44px. UI buttons under
  that fail accessibility heuristics.
- **Inconsistent vertical rhythm.** All baselines should snap to a
  multiple of 4px or 8px.

## Grid

Pick a grid that matches content density:

| Density | Columns | Gutter | Use |
|---|---|---|---|
| Marketing | 12 | 24-32px | Long-form, varied content |
| Product | 8-10 | 16-24px | Tables, dashboards, lists |
| Editorial | 6 | 24-40px | Reading, articles |
| Single-column | 1 | n/a | Narrow product, mobile-first |

Containers cap at:

- 1280-1440px for product UI
- 720-960px for reading content
- 480-640px for forms, focused tasks

Wider than 1440px feels theatrical. Narrower than 480px crowds.

## Whitespace philosophy

Whitespace is a primary layout tool, not "what's left over."

- **Breathing room around blocks**: 2-4x the line-height
- **Adjacent unrelated sections**: 4-8x the line-height
- **Tight related elements**: 0.5-1x the line-height (icon + label,
  caption + image)
- **Padding inside containers**: matches the outer rhythm; 16-32px is
  the typical band

The eye reads grouped elements as related. Gestalt's law of proximity
does layout for you if you let it.

## Container padding

Default rule: container padding equals or exceeds the largest gap
between children. If children sit 24px apart, container padding is at
least 24px.

```css
.section { padding: 64px 32px; }       /* 64 vert, 32 horiz */
.card    { padding: 24px; }
.cta-box { padding: 32px 24px; }
.button  { padding: 12px 20px; }
```

## Vertical rhythm

Section spacing dominates the page feel:

```
Tight:    32-48px between sections
Default:  64-96px
Generous: 96-160px
```

Mismatched section spacing reads as "designed in pieces." Keep it
consistent within a page.

## Have-Nots

You fail spatial if:

- Random px values not on the scale (e.g., 13, 17, 21, 27)
- Touch targets < 44x44px
- Cards nested 3+ levels deep
- Section spacing inconsistent within a page (>20% variance)
- Container padding < largest inner gap
- More than 3 distinct grid systems in one project
