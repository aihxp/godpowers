# Typography

> Godpowers' baseline guidance for type. Shallower than
> [Impeccable's typography reference](https://github.com/pbakaus/impeccable/blob/main/skill/reference/typography.md);
> use this when Impeccable isn't installed. Our opinions, not theirs.

## Pick at most two type families

Most projects need exactly two: a **display** family for headlines and a
**body** family for paragraphs and UI. A third, monospace family for
code or numerics is fine. Beyond three, the system fragments.

### Recommended pairings

| Register | Display | Body | Why |
|---|---|---|---|
| Editorial / serious | Fraunces, Newsreader, Instrument Serif | Inter, Söhne, system-ui | Serif gravity + sans clarity |
| Software / product | Geist, Söhne, Inter | Inter, system-ui | Single sans family at varying weights |
| Brand / playful | Cabinet Grotesk, Mona Sans | Inter, Söhne | Geometric display + neutral body |
| Technical / docs | IBM Plex Sans / Mono | IBM Plex Sans | One family across roles |

## Anti-patterns

- **Inter for everything.** It's a fine body face; using it for display
  flattens hierarchy. Pair it with a display face you actually pick.
- **System default fallback chains in production.** `system-ui` is fine
  in dev; ship a real loaded face for display.
- **Five weights of one family used randomly.** Pick three weights:
  body (400), strong (500/600), display (600/700). Stop there.
- **Letter-spacing larger than 0.05em on body text.** Reads like a
  headline; tires the eye.
- **Italic for emphasis on UI elements.** Use weight (or color); italic
  belongs in editorial copy.

## Modular scale

Use a ratio, not arbitrary px values. Common ratios:

| Ratio | Name | Feel |
|---|---|---|
| 1.125 | Major Second | Very tight, technical |
| 1.200 | Minor Third | Compact, dense UI |
| 1.250 | Major Third | Balanced, common default |
| 1.333 | Perfect Fourth | Editorial, generous |
| 1.500 | Perfect Fifth | Marketing, dramatic |

Pick one. Apply to your spacing scale too (Spatial reference).

### Practical scale (1.250)

```
xs:    0.75rem   12px
sm:    0.875rem  14px
base:  1rem      16px
lg:    1.25rem   20px
xl:    1.5rem    24px
2xl:   1.875rem  30px
3xl:   2.5rem    40px
4xl:   3.75rem   60px
```

## Line height

| Use | Line height |
|---|---|
| Display (>32px) | 1.05-1.15 |
| Headline (24-32px) | 1.2-1.3 |
| Body (14-18px) | 1.5-1.65 |
| Dense UI / labels | 1.3-1.4 |

Display lines look broken at 1.5; body lines look cramped at 1.2.

## Tabular numerals

Always enable for numeric columns and tables:

```css
font-feature-settings: "tnum";
```

Or in your DESIGN.md typography token:

```yaml
typography:
  numeric:
    fontFamily: Inter
    fontSize: 2.5rem
    fontFeature: tnum
```

Without `tnum`, columns of numbers wobble.

## OpenType features worth using

| Feature | When |
|---|---|
| `tnum` | Tables, columns, dashboards |
| `case` | All-caps text; aligns punctuation |
| `salt` | Designer-chosen alternates (single-storey 'a', etc.) |
| `liga` | Standard ligatures (default in most browsers) |
| `kern` | Pair kerning (default in modern browsers) |

## Loading

- Self-host `.woff2` whenever possible. Google Fonts is fine; their
  CDN adds latency and a third-party request.
- `font-display: swap` for body, `optional` for display (avoid FOIT).
- Subset to the characters you actually use. A full Latin face is
  ~100KB; a subset can be 20KB.

## Have-Nots

You fail typography if:

- More than 2 families in use (3 if monospace counts; do not exceed 3)
- Letter-spacing > 0.05em on body
- Italic used for UI emphasis
- No tabular numerals on table columns
- Body line-height < 1.4 or > 1.7
- Display line-height > 1.2
- All five weights of the same family in active use
