# DESIGN.md Antipatterns

> Common ways DESIGN.md fails. Each has a sample, why it fails, and the fix.

## 1. The Tellable Token Set

**Sample**: `colors.primary: "#4f46e5"` (purple-blue), `colors.gradient:
"linear-gradient(...)"`, every heading uses Inter, every CTA uses an
indigo-to-purple gradient.

**Why it fails**: Every AI-generated SaaS in 2024-2025 uses this palette.
The tokens betray that the design system was generated, not chosen.

**Fix**: Pick a register first (brand vs product) and a reference (a real
brand whose voice resembles yours). Avoid the 5 tells: Inter everywhere,
purple-blue gradients, cards-in-cards, gray text on colored backgrounds,
rounded-square icon tiles above every heading.

## 2. The Reference That Doesn't Resolve

**Sample**:
```yaml
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
```
But `colors.tertiary` is not defined in the colors block.

**Why it fails**: Token references break silently. The UI renders with
fallback colors that don't match the design intent.

**Fix**: Run the Google Labs linter; it catches unresolved references
mechanically. The god-design-reviewer agent gates on this.

## 3. The Theme Without a Reason

**Sample**: DESIGN.md exists but has no Overview section explaining the
visual register or rationale.

**Why it fails**: Future agents (and team members) don't know what the
design is meant to feel like. The first refactor or new component drifts
toward whatever the current contributor's defaults are.

**Fix**: Overview section answers two questions: "what register is this?"
(brand vs product) and "what does it feel like?" (one-paragraph mood
description grounded in named references).

## 4. The Component Sprawl

**Sample**: `components` block has 50 entries: every shade of every
button variant, every modal type, every input state.

**Why it fails**: 50 components means 50 places drift can hide. Each is
usually slightly inconsistent. The system becomes its own anti-system.

**Fix**: Name only the canonical components. Variants (hover, active,
disabled) are systematic, not bespoke. If you have 50 components, you
have a redundancy problem.

## 5. The Contrast Failure

**Sample**: `colors.cta-bg: "#fda4af"` (light pink), `colors.cta-text:
"#ffffff"` (white). Contrast ratio: 1.8:1. WCAG AA fails.

**Why it fails**: The button is unreadable for users with low vision,
in bright sunlight, or on calibrated-low-contrast displays. Often
unreadable for everyone.

**Fix**: Linter computes WCAG contrast ratio for every text-on-background
component pair. Anything below 4.5:1 (AA) is BLOCKED by the design
reviewer. AAA requires 7:1.

## 6. The Stale Tokens

**Sample**: DESIGN.md says `colors.primary: "#1A1C1E"`. The actual app
uses `#000000` because someone "fixed it" in the CSS without updating
the spec.

**Why it fails**: DESIGN.md becomes aspirational. Code is the source of
truth; nobody trusts the spec.

**Fix**: Reverse-sync (Phase 6) detects drift between DESIGN.md tokens
and actual usage in CSS/styled-components. Drift findings flow into
REVIEW-REQUIRED.md.

## 7. The Missing Anti-References

**Sample**: PRODUCT.md says "we want a calm, editorial feel." DESIGN.md
implements the colors and typography but doesn't list what to avoid.

**Why it fails**: AI agents and developers look for cues. Without explicit
anti-references, they import patterns from popular component libraries
(shadcn defaults, Material Design) that may not match the intended feel.

**Fix**: Do's and Don'ts section names specific patterns to avoid:
"don't use bright primary blue (would feel category-AI)", "don't nest
cards inside cards", "don't use gradients."

## 8. The Token Without a Use

**Sample**: 30 colors defined; only 8 referenced in components.

**Why it fails**: Unused tokens are dead weight. They suggest options
that aren't actually offered. Future contributors apply them
incorrectly because they exist.

**Fix**: Linter reports unused tokens. Remove or use them.
