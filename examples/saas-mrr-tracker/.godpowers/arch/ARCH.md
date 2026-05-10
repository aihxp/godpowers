# System Architecture

## System Context (C4 Level 1)

```
[Solo SaaS Founder]
        |
        v
   [MRR Tracker]
   /    |     \
  v     v      v
[Stripe] [Resend] [Vercel KV]
 (data)  (email) (cache+queue)
```

Each connection labeled below the diagram (data flowing, protocol, frequency):

- Founder -> MRR Tracker: HTTPS over Next.js, on-demand
- MRR Tracker -> Stripe API: REST + OAuth, hourly sync (more on key events)
- MRR Tracker -> Resend: REST, weekly Monday 09:00 user-local
- MRR Tracker -> Vercel KV: TLS, on every page load (cached MRR snapshots)

## Container Diagram (C4 Level 2)

| Container | Single Responsibility | Technology |
|-----------|----------------------|------------|
| `web` | Render dashboard, handle OAuth callback | Next.js 15 + React 19 |
| `sync-worker` | Pull Stripe data hourly, build MRR breakdowns | Vercel Cron + Node |
| `digest-worker` | Compose and send weekly email digest | Vercel Cron + Resend SDK |
| `kv-cache` | Store sync snapshots, account state, sessions | Vercel KV (Redis-compatible) |

## Architecture Decision Records

### ADR-001: Stripe as the only data source for V1
- **Context**: PRD scope explicitly excludes Chargebee/Paddle/etc.
- **Decision**: Build directly against Stripe Billing API. No abstraction layer.
- **Rationale**: Premature abstraction adds cost without yield while we have only one provider.
- **Flip point**: When V2 adds a second billing provider, refactor to a `BillingProvider` interface.
- **Consequences**: Faster to V1; introduces refactor cost when scope expands.

### ADR-002: Vercel-only hosting (web + workers + KV)
- **Context**: PRD constrains to Vercel-class hosting; founder is solo, no DevOps.
- **Decision**: Vercel handles web, cron jobs (sync-worker, digest-worker), and KV.
- **Rationale**: Single dashboard, one billing line, zero infra ops.
- **Flip point**: When sync-worker exceeds Vercel function timeout (300s currently), move to a dedicated worker host.
- **Consequences**: Vendor lock-in to Vercel for V1; trades portability for speed.

### ADR-003: OAuth-only authentication (no password)
- **Context**: PRD NFR requires that no Stripe secret keys are stored on our servers.
- **Decision**: User signs in via Stripe Connect OAuth. No separate account.
- **Rationale**: Removes credential storage entirely; user identity equals their Stripe account.
- **Flip point**: When team-seat support arrives (not in V1), introduce a separate identity layer.
- **Consequences**: Simpler security posture; one less thing to compromise.

### ADR-004: Weekly snapshot model (not real-time)
- **Context**: PRD success metrics require weekly digest; founders do not need real-time.
- **Decision**: Sync hourly; compute weekly snapshots on Monday 00:00 UTC for digest.
- **Rationale**: Avoids Stripe API rate-limit pressure and reduces compute cost by 168x.
- **Flip point**: If users request live numbers post-launch, add a "refresh now" button that triggers an on-demand sync (already supported as a manual cron trigger).
- **Consequences**: Numbers can lag real-time by up to an hour; matches the founder workflow.

## NFR-to-Architecture Map

| PRD NFR | Architectural Choice | ADR Reference |
|---------|---------------------|---------------|
| Latency p99 < 800ms | KV cache for dashboard reads (no Stripe round-trip on view) | ADR-004 |
| Availability 99.5% | Vercel SLA (99.99% web) + KV (99.9%); Stripe outage caches degrade gracefully | ADR-002 |
| Scale 200 concurrent OAuth + 5000 customers | Vercel concurrent function limit (1000) + KV horizontal | ADR-002 |
| Security (no Stripe secret keys) | OAuth-only; we store only access tokens encrypted at rest | ADR-003 |
| Privacy (email encryption at rest) | KMS-managed keys via Vercel encrypted envelope | ADR-002 |

[DECISION] Every NFR from PRD has an architectural choice mapped above.

## Trust Boundaries

```
[Stripe API]
    |
=== TRUST BOUNDARY: OAuth access token, scoped read-only ===
    |
[sync-worker]
    |
=== TRUST BOUNDARY: encrypted-at-rest, KMS envelope ===
    |
[Vercel KV]
    |
[web container]
    |
=== TRUST BOUNDARY: HTTPS, signed session cookies ===
    |
[Founder browser]
```

For each external integration:
- **Stripe**: OAuth scoped read-only on customers/subscriptions/invoices. Tokens stored encrypted in KV with 90-day rotation. If breached, revocation is via Stripe dashboard immediately.
- **Resend**: API key stored as Vercel encrypted env var. Read-only outbound; no callback path. If breached, rotate key in Resend dashboard, redeploy.
- **Vercel KV**: Inherited Vercel platform security. KMS keys managed by Vercel. If breached, escalate to Vercel SOC.

## Data Model

### Entities

| Entity | Owner Service | Consistency Model |
|--------|--------------|-------------------|
| `Account` | web | Strong (KV single-writer) |
| `OAuthToken` | web | Strong (KV); rotated 90d |
| `MRRSnapshot` | sync-worker | Weekly snapshot, append-only |
| `CustomerEvent` | sync-worker | Hourly delta from Stripe |
| `Annotation` | web | User-written, single-writer |

### Relationships
- `Account` 1:1 `OAuthToken`
- `Account` 1:N `MRRSnapshot` (one per week)
- `MRRSnapshot` 1:N `CustomerEvent` (events that contributed to this week's MRR change)
- `Account` 1:N `Annotation` (user-attached notes)

## Have-Nots Checklist
- [x] Every container has a clear single responsibility
- [x] Every NFR from PRD has an architectural mapping
- [x] Every ADR has a flip point
- [x] "Scalable" never appears without numbers
- [x] Every external integration has a trust boundary
- [x] Every data entity has an ownership assignment
