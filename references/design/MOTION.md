# Motion

> Godpowers' baseline guidance for animation and transition.
> Shallower than
> [Impeccable's motion-design reference](https://github.com/pbakaus/impeccable/blob/main/skill/reference/motion-design.md).

## Three durations, three easings

Most products need only this:

| Duration | Use |
|---|---|
| `100ms` | Hover states, focus rings, color shifts |
| `200ms` | Element appear/disappear, expand/collapse |
| `400ms` | Page transitions, route changes, modals |

```css
:root {
  --motion-fast: 100ms;
  --motion-default: 200ms;
  --motion-slow: 400ms;
}
```

Anything longer than 500ms feels broken or theatrical (unless it's a
page transition with intentional staging).

## Easings

| Curve | When |
|---|---|
| `ease-out` (cubic-bezier(0.16, 1, 0.3, 1)) | Default for most things |
| `ease-in-out` (cubic-bezier(0.65, 0, 0.35, 1)) | Both ends matter (modals, drawers) |
| `linear` | Loading bars, scroll progress, durations the user controls |

Avoid:

- **Bounce** (cubic-bezier with overshoot): feels dated, mid-2010s
- **Elastic** / spring with too much stiffness: distracting in product UI
- **ease-in alone**: feels heavy, fights user attention

## Anti-patterns

- **Animating everything.** Page-level animations on every interaction
  are exhausting. Restrict to: state changes, navigation, gating.
- **Slow exits.** When something should leave the screen (modal close,
  toast dismiss), use `100ms`. Slow exits make the user wait.
- **Motion without intent.** A spinning logo, ambient particles,
  hover pulses on every card. Decoration that doesn't serve.
- **Ignoring `prefers-reduced-motion`.** Always honor.
- **Bounce on production UI.** Acceptable in marketing/illustration;
  in product UI it reads as toy.

## prefers-reduced-motion

Always respect:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Or in JS via `window.matchMedia('(prefers-reduced-motion: reduce)')`.
Disable nonessential motion entirely; keep essential transitions
near-instant.

## Staggering

When multiple elements animate together (e.g., a list rendering),
stagger by 30-50ms per item, max 8-10 items before the cascade feels
like a wait.

```js
items.forEach((item, i) => {
  item.style.transitionDelay = `${i * 40}ms`;
});
```

Beyond 10 items: animate the container, not each child.

## Scroll-driven motion

Use sparingly. One scroll-tied animation per long page is plenty.

Acceptable:
- Hero parallax (subtle, < 30% velocity ratio)
- Progress indicator at the top
- Reveal-on-scroll for hero sections

Not acceptable:
- Every section parallax
- Counter-scroll text
- Multiple scroll-pinned sections

## Loading patterns

| Wait | Pattern |
|---|---|
| < 200ms | No indicator |
| 200-1000ms | Subtle skeleton or muted spinner |
| > 1000ms | Skeleton with shape, optional progress bar |
| > 5000ms | Status text + progress bar |
| User-initiated long task | Indeterminate -> determinate progress, ETA if known |

## Have-Nots

You fail motion if:

- `prefers-reduced-motion` not honored
- Bounce/elastic easing on production UI
- Animation duration > 500ms for non-page-level transitions
- Slow exits (> 200ms) on dismissable elements
- Decorative motion without intent
- Stagger applied to > 10 items
