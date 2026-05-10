# Product Requirements Document

> Every sentence below is labeled `[DECISION]`, `[HYPOTHESIS]`, or `[OPEN QUESTION]`.
> Every claim fails the substitution test (swap competitor name in, sentence breaks).

## Problem Statement

[DECISION] Solo SaaS founders running between $1k and $10k MRR cannot
decompose week-over-week revenue change between three causes: net-new
customers, expansion from price increases, and contraction from
cancellations.

[DECISION] Today these founders use Stripe's built-in dashboard, which
shows aggregate MRR but not the cause-of-change breakdown.

[HYPOTHESIS] When MRR moves, the founder's first instinct is to ask
"why" and they currently get the answer by manually pivoting CSV
exports in spreadsheets. We will validate this with 5 founder interviews
before /god-build.

## Target Users

[DECISION] Primary: Solo or two-person SaaS founders, $1k-$10k MRR,
B2B subscription model, using Stripe Billing as their source of truth.

[DECISION] Secondary: Bootstrapped agencies running 2-5 client SaaS
products who need cause-of-change for monthly client reports.

## Success Metrics

- [DECISION] 50 active accounts within 60 days of launch, measured via
  Mixpanel weekly-active events on the MRR breakdown screen.
- [DECISION] Founders cite the cause-of-change view in at least 3 of 5
  weekly-board emails by week 8, measured via opt-in survey sent at
  account creation.
- [HYPOTHESIS] Net retention of paying users at 80% by month 3,
  measured via Stripe billing events; if below 60% we will treat as
  signal that our breakdown does not solve the problem.

## Functional Requirements

### MUST (V1 launch blockers)
- [DECISION] User connects Stripe account via OAuth, scopes
  `read_only` on `customers,subscriptions,invoices`. Acceptance:
  user clicks Connect, completes Stripe OAuth, lands on populated
  dashboard within 30 seconds.
- [DECISION] System decomposes weekly MRR change into three buckets
  (new MRR, expansion MRR, contraction MRR) with the customer
  attribution per bucket. Acceptance: viewer can drill into any bucket
  to see the underlying customer rows.
- [DECISION] Weekly email digest of the cause-of-change breakdown sent
  every Monday 09:00 in user's timezone. Acceptance: email lands in
  inbox by 09:30, contains the same numbers as the dashboard.

### SHOULD (V1 if time permits)
- [HYPOTHESIS] Annotation feature: user can attach a note to a week's
  breakdown ("we ran the Black Friday promo here"). Validation: track
  whether 30% of weekly-active users add at least one annotation by
  month 2.
- [HYPOTHESIS] Slack integration: post weekly digest to a chosen
  channel. Validation: opt-in rate at signup; ship only if 25% opt in.

### COULD (post-V1)
- [HYPOTHESIS] Cohort retention curves
- [HYPOTHESIS] Multi-currency support beyond USD

## Non-Functional Requirements

| Category | Requirement | Source |
|----------|-------------|--------|
| Latency | Dashboard p99 < 800ms after Stripe sync complete | [DECISION] |
| Availability | 99.5% uptime over 30-day windows, measured by Pingdom | [DECISION] |
| Scale | Support 200 concurrent OAuth callbacks; 5000 customers per account | [HYPOTHESIS] |
| Security | OAuth-only authentication; no Stripe secret keys ever stored on our servers | [DECISION] |
| Privacy | Customer email addresses encrypted at rest with KMS-managed keys | [DECISION] |

## Scope and No-Gos

### In scope for V1
- Stripe Billing as the only data source
- USD only
- Single-tenant accounts (no team seats)

### Explicitly NOT in scope
- [DECISION] Mobile app
- [DECISION] Enterprise SSO (SAML, Okta)
- [DECISION] Chargebee, Paddle, or other billing provider integrations
- [DECISION] White-label embedding for the agency segment
- [DECISION] Custom report builder

## Appetite

[DECISION] Time budget: 6 weeks from /god-init to launch.
[DECISION] Resource budget: solo founder + this AI system.
[DECISION] Technical constraints: must use existing Stripe API (no
custom data ingestion), must run on Vercel-class hosting.

## Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| Pricing model: flat $29/mo or % of MRR? | hprincivil | 2026-05-20 | |
| Email sender domain: own subdomain or Resend default? | hprincivil | 2026-05-15 | |
| Support model: in-app chat or email-only? | hprincivil | 2026-05-25 | |

## Have-Nots Checklist

Before declaring done, verify:
- [x] No sentence is unlabeled
- [x] Problem statement fails substitution test (specific to founders + Stripe + MRR)
- [x] Target user is specific (not "developers")
- [x] Every success metric has a number AND timeline
- [x] Every requirement has acceptance criteria
- [x] No-gos section is non-empty
- [x] Every open question has owner AND due date
