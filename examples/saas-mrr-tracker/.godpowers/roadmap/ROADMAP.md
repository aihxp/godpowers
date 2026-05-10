# Roadmap

## Milestones

### M-1: Sync foundation (week 1-2)
- [DECISION] Stripe OAuth flow with token storage and refresh
- [DECISION] sync-worker pulling customers/subscriptions/invoices hourly
- [DECISION] KV schema for `Account`, `OAuthToken`, `MRRSnapshot`
- [DECISION] Unit tests on MRR decomposition logic with at least 10 test cases
  covering new, expansion, contraction, and combinations

**Gate**: a test account synced end-to-end produces correct MRR breakdown
matching a hand-computed reference for a known fixture.

### M-2: Dashboard view (week 3)
- [DECISION] Dashboard page rendering current week's breakdown
- [DECISION] Drill-down to per-customer rows
- [DECISION] Historical week selector (last 12 weeks)

**Gate**: dashboard p99 < 800ms measured by Vercel Analytics on a seeded account
with 5000 customers and 12 weeks of history.

### M-3: Weekly digest (week 4)
- [DECISION] digest-worker composing the email from the same data the dashboard reads
- [DECISION] Resend integration with sender domain verification
- [DECISION] Unsubscribe link and preference management

**Gate**: a synthetic account receives the Monday email at the correct user-local
time with numbers matching the dashboard within the same minute.

### M-4: Beta launch (week 5)
- [DECISION] Onboard 10 founder beta users from the validation cohort
- [DECISION] Collect cause-of-change usage telemetry via Mixpanel
- [DECISION] Stripe production OAuth credentials live

**Gate**: 10 beta accounts active, with at least 5 returning on day 7.

### M-5: Public launch (week 6)
- [DECISION] Public signup page open
- [DECISION] Pricing model live (resolved from PRD open question by week 4)
- [DECISION] Marketing site at root domain with founder-focused copy

**Gate**: 50 active accounts within 60 days, measured per PRD success metrics.

## Roadmap Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-05-10 | Initial roadmap | Project start |
