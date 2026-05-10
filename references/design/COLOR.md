# Color

> Godpowers' baseline guidance for color. Shallower than
> [Impeccable's color-and-contrast reference](https://github.com/pbakaus/impeccable/blob/main/skill/reference/color-and-contrast.md);
> use this when Impeccable isn't installed.

## Use OKLCH

Modern displays support wide gamuts. OKLCH gives you:

- Perceptually uniform lightness (a 60% L color reads as the same
  brightness regardless of hue)
- Predictable contrast adjustments (drop L by 10 to darken, period)
- Wide-gamut accuracy for modern displays
- A graceful fallback through CSS Color 4

```yaml
colors:
  ink: "oklch(20% 0.01 250)"     # near-black, slight blue cast
  paper: "oklch(98% 0.005 80)"   # warm white
  accent: "oklch(60% 0.18 250)"  # blue accent
```

If your linter requires hex (e.g., Google Stitch): use hex for tokens,
add OKLCH equivalents in CSS variables, document both.

## The 5-color rule

A small palette ships faster and looks more confident than a large one.
Aim for:

1. **ink** - body text and headlines
2. **paper** - canvas / background
3. **rule** - borders, dividers, hairlines
4. **accent** - the one chromatic color used for action and emphasis
5. **muted** - secondary text, disabled states

Add growth/shrink (positive/negative) only if the product has
directional data (charts, dashboards). Add success/warning/danger only
if the product has stateful UI (forms, alerts). Otherwise stop at 5.

## Anti-patterns

- **Purple-to-blue gradients on CTAs.** The default of every AI-built
  SaaS in 2024-2025. Tells.
- **Pure black (#000) on pure white (#fff).** Too much contrast at
  large sizes; eye-tiring on long reads. Use near-black (10-15% L).
- **Gray text on colored backgrounds.** Gray on cream looks like CSS
  rendering broke. Use a colored variant matched to the background.
- **Rainbow palettes.** Six chromatic colors competing. Pick one.
- **Bright Material-style red for errors.** Reserved for genuine
  destructive actions, not validation messages.

## Contrast (WCAG)

| Ratio | Level | Use |
|---|---|---|
| 3:1 | AA Large (>=18pt or 14pt bold) | Display headlines |
| 4.5:1 | AA Normal | Body text, labels, links |
| 7:1 | AAA Normal | High-bar accessibility |
| 4.5:1 | AA non-text | Icons, focus rings, borders |

The runtime audit (Phase 11) checks 4.5:1 on text-on-background
components. Below that, BLOCK.

### Common pairings that work

| Background | Text | Ratio |
|---|---|---|
| `#1a1c1e` (near-black) | `#f7f8f8` (paper) | 18.4 (AAA) |
| `#fafafa` (paper) | `#0f1011` (deep) | 19.7 (AAA) |
| `#f4ebdc` (cream) | `#1f1a15` (ink) | 13.5 (AAA) |

### Common pairings that fail

| Background | Text | Ratio | Status |
|---|---|---|---|
| `#fda4af` (pink) | `#ffffff` | 1.8 | Fail |
| `#a3a3a3` (gray) | `#ffffff` | 2.6 | Fail |
| `#1f1a15` (dark) | `#5b4f44` (taupe) | 5.9 | Pass AA |

## Dark mode

If you support dark mode, design it as its own surface, not an
inversion. Tokens needed:

```yaml
colors:
  canvas-light: "oklch(98% 0.005 80)"
  canvas-dark: "oklch(15% 0.01 250)"
  ink-light: "oklch(20% 0.01 250)"   # on light canvas
  ink-dark: "oklch(95% 0.01 250)"    # on dark canvas
```

Mapping rule: dark mode lowers contrast slightly (16:1 -> 12:1) to
reduce eye strain. Don't simply invert; that produces glaring
reverse-contrast surfaces.

## Tinted neutrals

Pure grays look industrial and cold. Tint your neutrals toward the
accent's hue family:

```yaml
colors:
  # accent is blue (250 hue); tint neutrals toward 250
  ink: "oklch(20% 0.01 250)"     # subtly blue-cast
  rule: "oklch(88% 0.005 250)"   # subtly blue-cast border
```

Even 0.005 chroma at the same hue makes neutrals feel intentional.

## Have-Nots

You fail color if:

- Pure #000000 or #ffffff in regular text use
- Purple-blue gradient on primary CTA
- Gray text on colored background
- More than 5 base colors before semantic additions
- WCAG AA fail on any text-on-background component
- More than 3 chromatic colors in the palette
