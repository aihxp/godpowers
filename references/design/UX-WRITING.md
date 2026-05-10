# UX Writing

> Godpowers' baseline guidance for product copy. Shallower than
> [Impeccable's ux-writing reference](https://github.com/pbakaus/impeccable/blob/main/skill/reference/ux-writing.md).

## Write for the person doing the task

Every word in the UI should serve the next action. If a button says
"Submit," the user has to translate that to "submit what?" If it says
"Send invoice," they don't.

## Buttons: verb-noun, never "click here"

| Bad | Better |
|---|---|
| Click Here | View invoice |
| OK | Save changes |
| Submit | Send invitation |
| Cancel | Discard changes |
| Yes | Confirm delete |

The button labels its outcome, not the user's gesture.

## Empty states: name the next action

| Bad | Better |
|---|---|
| No data. | No invoices yet. Connect Stripe to import. |
| Empty list. | Nothing in your queue. Add a task to get started. |
| Loading... | Loading your dashboard... |

Empty states are onboarding opportunities, not error states.

## Error messages: 3 rules

1. **Be specific.** "Invalid input" is useless. "Email needs an @
   symbol" is actionable.
2. **Be forward-looking.** Tell them what to do, not what they
   did wrong. "Try a longer password" beats "Password too short."
3. **Avoid blame.** "We couldn't reach Stripe" is better than "You
   entered an invalid Stripe key."

### Status codes by user-facing severity

| Code | User sees |
|---|---|
| 4xx (user error) | Specific, fixable, actionable |
| 5xx (our error) | "Something went wrong on our end. Try again, or contact support." |
| Network failure | "Lost connection. Check your network and retry." |
| Validation | Inline, near the field |

Never show a stack trace or raw error code in production UI.

## Numbers and dates

- **Dates**: relative for recent ("3 days ago"), absolute for far
  ("March 15, 2026").
- **Times**: include timezone unless the user's local context is
  obvious. "9:00 AM ET" not "9:00 AM."
- **Money**: always with currency symbol AND code on first reference
  ("$50 USD"). Subsequent refs can drop the code.
- **Counts**: pluralize correctly. "1 invoice" / "12 invoices."
  Internationalize for non-English locales.

## Pronouns

- **Second person ("you")** for instructions: "Click here to verify
  your email."
- **First person ("I", "we")** for product voice or reflective
  statements: "We'll send you a receipt." / "I want to delete this."
- **Avoid third person** in product UI: "The user can configure..."
  feels like a manual.

## Tone calibration

| Project type | Tone |
|---|---|
| Productivity / serious | Direct, terse, no exclamation marks |
| Creative / playful | Conversational, occasional warmth, light wit |
| Healthcare / financial | Calm, precise, never urgent unless truly is |
| Developer tools | Technical, dense, can use jargon if appropriate |

Pick one. Mismatched tone within a single product reads as
inconsistent.

## Anti-patterns

- **Exclamation overload.** "Welcome! Sign in! Get started!" reads as
  fake enthusiasm. Use exclamations sparingly: success messages,
  achievements, intentional surprise.
- **"Awesome" / "Sweet" / "Boom".** Friendly tone gone too casual.
  Tells the reader the team is trying too hard.
- **All caps for emphasis.** Reads as shouting. Use weight or color.
- **Jargon without explanation.** "OAuth flow failed" means nothing to
  most users. "We couldn't connect to Stripe; please try logging in
  again."
- **Long form labels.** "What is your favorite color?" inside a label
  is a question, not a label. Use "Favorite color" + helper text below.

## Microcopy templates

### Confirmation

> Delete invoice? This cannot be undone.
> [Cancel] [Delete]

### Destructive action

> You're about to delete the production database.
> Type `delete-production` to confirm.

### Success

> Saved. (toast, dismisses after 4s)

### Loading (long task)

> Generating your report. We'll email you when it's ready.

### Onboarding

> Welcome to MRR Tracker. Let's connect your first Stripe account.
> [Connect Stripe]

## Have-Nots

You fail UX writing if:

- Buttons say "Click here," "Submit," "OK," "Cancel" generically
- Error messages don't tell the user what to do
- Empty states don't suggest a next action
- Dates have no timezone
- Money values lack currency code on first reference
- Stack traces or raw error codes shown in production
- Tone shifts within the same product (jokey signup, terse settings)
