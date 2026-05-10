# Vertical Slices

> A slice delivers ONE user-visible behavior end-to-end. Not "set up the
> database." That's horizontal.

## Vertical vs horizontal

### Horizontal (rejected)
- "Set up the database"
- "Build the API layer"
- "Create the UI components"

User can't do anything until ALL three ship. High WIP, late integration.

### Vertical (accepted)
- "User can sign up with email and password"
- "User can connect their Stripe account"
- "User sees current MRR on the dashboard"

Each one ships independently. User sees value progressively.

## Anatomy of a slice

```
Slice 1.3: User can connect Stripe account

Files:
- src/auth/stripe-oauth-init.ts
- src/auth/stripe-oauth-init.test.ts
- src/auth/stripe-oauth-callback.ts
- src/auth/stripe-oauth-callback.test.ts
- src/db/migrations/003_stripe_accounts.sql
- src/components/StripeConnectButton.tsx
- src/components/StripeConnectButton.test.tsx

Tests first (in order, RED -> GREEN -> REFACTOR):
1. test: oauth_init_returns_authorize_url
2. test: oauth_init_includes_csrf_state
3. test: oauth_callback_validates_state
4. test: oauth_callback_stores_encrypted_token
5. test: oauth_callback_redirects_to_dashboard

Implementation steps:
1. RED: write all 5 tests above; run; all fail
2. GREEN: implement init -> callback flow until tests pass
3. REFACTOR: extract common state validation; clean up

Verification:
- All 5 tests green
- Manual: complete OAuth flow in dev environment
- Token visible in stripe_accounts table (encrypted)
- User redirected to dashboard

Dependencies: Slice 1.1 (signup), Slice 1.2 (login)
Wave: 2
```

## Common mistakes

### Slice too big
"User can use the entire dashboard" is not a slice. It's a milestone.

Break it: "User can see MRR card", "User can see growth chart", etc.

### Slice not user-visible
"Refactor the auth middleware" is not a slice (no user behavior changes).
That's a refactor; route to /god-refactor.

### Slice has hidden dependencies
"User can export CSV" depends on data-fetch slice, which depends on auth
slice. Make dependencies explicit.

### Slice spans multiple commits
A slice is one atomic commit. If it takes 5 commits to land safely, it's
too big.
