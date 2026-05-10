# PRD Anatomy

> What a strong PRD looks like, section by section, with what to write and
> what to avoid.

## 1. Problem Statement

**What it does**: states the problem in user terms, not solution terms.

**What good looks like**:
> Solo SaaS founders running between $1k and $10k MRR don't know whether
> their revenue is growing because of new customers or because they raised
> prices. The two have opposite implications. Existing tools like ChartMogul
> and Baremetrics report the metric but don't decompose the cause.

**What bad looks like**:
> We need a tool that tracks MRR with AI insights for modern founders.

The bad version passes the substitution test (any product). The good version
fails it (specific to one segment, one decomposition gap).

## 2. Target Users

**What it does**: names the user with enough context that a designer could
sketch them.

**What good looks like**:
> Solo founders, age 25-45, technical, building B2B SaaS, $1k-$10k MRR,
> looking at their dashboard 2-3 times daily, primarily worried about churn
> vs growth attribution. Use Stripe for payments. Read Indie Hackers and
> Twitter.

**What bad looks like**:
> Developers and small business owners who want better analytics.

## 3. Success Metrics

**What it does**: states observable, time-bound, measurable outcomes.

**What good looks like**:
| Metric | Target | Timeline | Measurement |
|--------|--------|----------|-------------|
| Daily active users | 50 | 30 days post-launch | Mixpanel daily active count |
| Time to first insight | <60 seconds | Always | Page-load timer + first chart render |
| Conversion (visit -> signup) | 3% | First 30 days | Mixpanel funnel |

**What bad looks like**:
> Users find it valuable. Strong growth. Good engagement.

## 4. Functional Requirements

**What it does**: lists what the product DOES, prioritized.

**What good looks like**:

### MUST (V1 launch blockers)
- User can connect Stripe account and view MRR breakdown by new/expansion/churn within 30 seconds
  - Acceptance: OAuth flow completes, dashboard renders within 30s of authorization

### SHOULD (V1 if time)
- User can compare MRR change to a previous period (week, month, quarter)
  - Acceptance: dropdown selector + line chart updates in <500ms

### COULD (post-V1)
- User can export MRR breakdown as CSV
- User can connect multiple Stripe accounts

**What bad looks like**:
- Add MRR tracking
- Build analytics
- Make it nice
- AI insights

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Latency | p99 dashboard load < 2 seconds |
| Availability | 99.9% over 30 days (43 minutes/month error budget) |
| Scale | 1000 concurrent users by month 3, 10000 by month 6 |
| Security | OAuth tokens encrypted at rest; no Stripe API keys ever stored |

## 6. Scope and No-Gos

**What it does**: explicit list of what is NOT being built. Prevents scope creep.

**What good looks like**:
- NOT building: mobile app for V1
- NOT building: payment processing (Stripe handles it)
- NOT building: customer support tooling
- NOT building: white-label / multi-tenant for V1

**What bad looks like**:
- (empty section, or absent)

## 7. Appetite

**What it does**: time and resource constraints, before any planning.

**What good looks like**:
- Time budget: 8 weeks from PRD to production launch
- Resource budget: solo founder, 30 hours/week
- Technical constraints: must work with Stripe, must run on a single $20/mo server for V1

## 8. Open Questions

**What it does**: lists what's NOT decided yet, with owners and due dates.

**What good looks like**:
| Question | Owner | Due Date |
|----------|-------|----------|
| Should we support Paddle or only Stripe for V1? | Founder | Before /god-arch |
| What's the highest-impact metric users want first? | Founder | Before /god-build |

**What bad looks like**:
- "TBD"
- (open questions buried in prose)
