# Stack Decision

## Selected Stack

| Concern | Choice | Lock-in level |
|---------|--------|---------------|
| Runtime | Node 20 LTS | Low |
| Web framework | Next.js 15 + React 19 | Medium (App Router) |
| Hosting + Cron + KV | Vercel | High (single-vendor) |
| Database | Vercel KV (Redis-compatible) | Medium |
| Email delivery | Resend | Low (SMTP-compatible fallback) |
| Auth | Stripe Connect OAuth | High (no separate identity layer) |
| Tests | Vitest | Low |
| Linter / formatter | Biome | Low |
| Analytics | Mixpanel | Medium (event format) |
| Type system | TypeScript strict mode | Low |

## Decisions

### S-runtime: Node 20 LTS
- [DECISION] Latest LTS, supported through 2026-04
- **Flip point**: When Node 22 LTS releases and Vercel marks it default
- **Pairs with**: Vercel functions (Node runtime)

### S-framework: Next.js 15
- [DECISION] App Router for server components and edge-compatible API routes
- **Flip point**: If we need finer control over the build pipeline (rare for V1)
- **Pairs with**: Vercel deployment (Next.js originated there; tightest integration)

### S-hosting: Vercel
- [DECISION] Single vendor for web, cron, KV; matches PRD constraint
- **Flip point**: Per ADR-002 in ARCH.md, when sync-worker exceeds function timeout
- **Lock-in cost**: Migrating off Vercel requires re-platforming cron + KV separately. Estimated 2-week effort.

### S-db: Vercel KV
- [DECISION] Redis-compatible key-value store; sufficient for the snapshot model
- **Flip point**: When relational queries are needed (e.g., cross-account reporting)
- **Pairs with**: Vercel hosting (zero-config networking)

### S-email: Resend
- [DECISION] Modern API, good React Email integration, fair pricing for our scale
- **Flip point**: If we hit volume tier ceiling or need advanced segmentation
- **Lock-in cost**: SMTP-compatible escape hatch keeps cost low

### S-auth: Stripe Connect OAuth
- [DECISION] Per ADR-003, no separate identity layer for V1
- **Flip point**: When team-seat support arrives
- **Pairs with**: Stripe API access tokens (same OAuth grant)

### S-tests: Vitest
- [DECISION] Fast, good TypeScript support, Vite ecosystem
- **Flip point**: Rare; would only switch for a specific compatibility need
- **Pairs with**: Next.js (both Vite-aware)

## Pairing compatibility verified

[DECISION] Next.js 15 + Vercel: officially supported, primary use case.
[DECISION] Vercel KV + Vercel functions: zero-config TLS and IAM.
[DECISION] Resend + Next.js: official `@react-email/components` integration.
[DECISION] Stripe Connect OAuth + Vercel: standard HTTPS callback handler.

No incompatible pairings detected.

## Have-Nots Checklist
- [x] Every selection has a rationale and flip point
- [x] Every high lock-in choice has an estimated migration cost
- [x] Pairing compatibility is verified pairwise
- [x] No untyped or unscoped "TBD" choices
