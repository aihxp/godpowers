# Responsive Design

> Godpowers' baseline guidance for breakpoints, fluid design, and mobile.
> Shallower than
> [Impeccable's responsive-design reference](https://github.com/pbakaus/impeccable/blob/main/skill/reference/responsive-design.md).

## Mobile-first, always

Write the smallest screen first. Add media queries to scale up.

```css
/* default: mobile */
.container { padding: 16px; font-size: 1rem; }

@media (min-width: 768px) {
  .container { padding: 32px; font-size: 1.125rem; }
}

@media (min-width: 1280px) {
  .container { padding: 64px; font-size: 1.25rem; }
}
```

Don't default to desktop and reverse. Mobile-first compresses better
for the small majority.

## Breakpoints

Pick three. More than three is decoration; fewer is a missed
opportunity.

| Name | Min | Targets |
|---|---|---|
| `sm` | 640px | Large phones, small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Most laptops, monitors |
| `2xl` | 1536px | Large monitors |

Recommended starter trio: `768px`, `1024px`, `1280px`. Add others only
when content demands.

## Container queries (when supported)

Modern browsers support `@container`. Use when components need to
adapt based on their parent's width, not the viewport's:

```css
.card-list { container-type: inline-size; }

@container (min-width: 600px) {
  .card { display: grid; grid-template-columns: 200px 1fr; }
}
```

Better than viewport queries for component libraries that ship in
varied contexts.

## Fluid type and spacing

Use `clamp()` to interpolate between breakpoints:

```css
.heading {
  font-size: clamp(1.5rem, 1rem + 2vw, 3rem);
  /* min 1.5rem, scales with viewport, caps at 3rem */
}
```

This collapses three media queries into one declaration. Type stops
being staircased.

## Touch targets

iOS HIG: 44x44px minimum.
Android Material: 48x48px minimum.

Use 48x48px or larger for primary actions. Smaller targets fail tap
tests for users with motor impairments.

```css
.button { min-height: 48px; min-width: 48px; padding: 0 16px; }
```

Apply to icon-only buttons especially. A 24px icon + 12px padding all
sides = 48x48 hit target.

## Anti-patterns

- **Hover-only interactions.** Touch devices have no hover. Anything
  triggered by hover must also be reachable by tap.
- **Hidden mobile content.** "Show on desktop only" loses critical
  information. If desktop has it, mobile needs it (possibly
  reorganized, never disappeared).
- **Tiny text scales.** `font-size: 11px` on body is unreadable on
  mobile. Minimum 14px, typically 16px.
- **Horizontal scroll on mobile.** Always a bug unless explicitly
  designed (carousel).
- **Fixed pixel widths.** Use rems, percentages, or CSS Grid. Fixed
  px breaks at unusual viewports.

## Common layouts that adapt

### Grid that flows

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}
```

This auto-collapses to fewer columns as the viewport narrows. No media
queries needed.

### Hero that re-flows

```css
.hero {
  display: flex;
  flex-direction: column;     /* mobile: stacked */
  gap: 32px;
}

@media (min-width: 768px) {
  .hero { flex-direction: row; align-items: center; }
}
```

### Navigation that collapses

Mobile: hamburger or bottom-tab bar.
Tablet: condensed top nav.
Desktop: full top nav with all items visible.

Use `<nav>` with semantic markup; let CSS hide/show variants. Avoid
duplicating navigation structure for breakpoints.

## Dark mode + responsive

Test both: dark mode on mobile and dark mode on desktop. Light
backgrounds at small sizes can be glaring; dark variants tend to feel
more natural on phones at night.

## Have-Nots

You fail responsive if:

- Body font < 14px on mobile
- Hover-only interactions exist
- Touch targets < 44x44px
- Horizontal scroll appears on screens >= 320px
- Mobile loses content that desktop has
- Breakpoints scattered randomly (not on the chosen scale)
- Components use viewport queries when container queries are appropriate
- Fixed-px widths in layout containers
