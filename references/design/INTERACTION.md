# Interaction Design

> Godpowers' baseline guidance for forms, focus, and feedback.
> Shallower than
> [Impeccable's interaction-design reference](https://github.com/pbakaus/impeccable/blob/main/skill/reference/interaction-design.md).

## Focus states are not optional

Every interactive element gets a visible focus state:

```css
:focus-visible {
  outline: 2px solid var(--colors-accent);
  outline-offset: 2px;
}
```

Use `:focus-visible` (not `:focus`) so mouse clicks don't show focus
rings while keyboard navigation does.

The ring color must pass 3:1 contrast against both surface AND its
adjacent surface. Yellow rings on green surfaces fail that.

## Forms

### Labels above, errors below

```
[Email]
+----------------+
| user@example.. |
+----------------+
Please use a valid work email.
```

Inline labels (placeholder-only) lose context once typing starts. Use
real labels.

### Error messaging

Three rules:

1. **Specific.** "Invalid email" is bad. "Email must include @ and a
   domain" is better. "alice@example is missing the .com" is best.
2. **Forward-looking.** Tell the user what to do, not what they did
   wrong. "Please use a work email address" beats "Personal addresses
   are not allowed."
3. **Inline, not modal.** Modal alerts for form errors are aggressive.
   Place the message under the field that errored.

### When to validate

- **On submit**: always
- **On blur**: yes for required fields and format-specific (email,
  date, phone)
- **On input**: only for soft hints (password strength, character count,
  username availability). Not for "this is wrong" messages until blur.

### Required fields

Mark with a visible indicator (asterisk + colored to accent) AND
include a short note: "Fields marked with * are required." Don't rely
on color alone.

## Buttons

### Hierarchy

| Type | When | Visual |
|---|---|---|
| Primary | The one main action of the screen | Filled accent color |
| Secondary | Important but not primary | Outlined or tinted |
| Tertiary / link | Low-priority or destructive | Text-style, possibly underlined |
| Destructive | Delete, cancel-with-loss | Filled red OR confirmation modal |

One primary per screen. More than one creates ambiguity.

### Anti-patterns

- **All buttons the same weight.** No visual hierarchy.
- **Disabled buttons with no explanation.** If a button is disabled,
  tell the user why (in a tooltip or below).
- **Icon-only buttons without aria-label.** Screen readers say nothing.
- **Two-line button labels.** Wrap is fine, but if your CTA reads on
  multiple lines you've buried the action.

## Loading and feedback

| Action | Feedback |
|---|---|
| < 200ms | Nothing |
| 200ms-1s | Spinner inside the button |
| 1-3s | Skeleton in the affected region |
| 3-10s | Progress bar with percentage if known |
| > 10s | Background-task pattern: dismissible toast, "we'll notify you" |

Always disable the trigger while the action is in flight. Re-enable on
success / failure with appropriate state.

## Confirmations

Three patterns:

1. **Inline confirmation** (default for reversible actions): "Item
   deleted. Undo." with a 5-10s window.
2. **Modal confirmation** (destructive, irreversible): "Delete account?
   This cannot be undone." with explicit Yes/No.
3. **Type to confirm** (catastrophic): "Type 'delete-production' to
   confirm." for destructive cluster-wide operations.

Modal everything is interruption theater.

## Empty states

A blank screen is a missed opportunity. Every empty state should:

1. Explain what would normally be here
2. Show how to populate it (the action that creates the first item)
3. Optionally: a link to docs or a sample dataset

Bad: "No data."
Good: "No invoices yet. Connect Stripe to start tracking MRR."

## Hover states

For desktop:

- Color shift: 10-15% lighter or darker
- Cursor change for clickables (`cursor: pointer` only on actual
  clickables)
- Underline on text links (always; underline-on-hover only is bad
  practice)

For touch devices: hover is unavailable; design for tap-only.

## Have-Nots

You fail interaction if:

- No `:focus-visible` outline
- Focus ring contrast < 3:1 against both surfaces
- Required fields marked with color alone
- Error messages in modals (instead of inline)
- Disabled buttons with no explanation
- Icon-only buttons without aria-label
- Empty states with no path forward
- Clicks on non-buttons styled with `cursor: pointer`
- Trigger not disabled during async action
