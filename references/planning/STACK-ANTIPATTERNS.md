# STACK Antipatterns

> Common ways stack decisions fail. Each has a sample, why it fails, and the fix.

## 1. The Resume-Driven Choice

**Sample**: "Selected Rust because it's a great learning opportunity."

**Why it fails**: The PRD does not require Rust's strengths (extreme
performance, no GC). The team takes 3x longer building features than they
would in TypeScript. The choice serves the resume, not the user.

**Fix**: Map each choice to a PRD requirement. "Rust because PRD NFR
requires processing 10MB logs in under 500ms with zero allocations in
hot path; benchmarks show TypeScript is 4x slower at this." If the PRD
doesn't pull, the stack doesn't push.

## 2. The Lock-In Without Acknowledgment

**Sample**: "Selected Vercel for hosting" with no flip point and no
estimated migration cost.

**Why it fails**: Single-vendor lock-in is sometimes the right choice,
but it must be acknowledged. Without a documented flip point, the team
can't tell when the choice has become a liability.

**Fix**: Every high-lock-in choice has a flip point and a migration cost
estimate. "Vercel; flip point when sync-worker exceeds 300s function
timeout; migration to Fly.io estimated at 2 weeks (cron + KV
re-platforming)."

## 3. The Pairing Mismatch

**Sample**: "Selected Next.js + AWS Lambda + DynamoDB."

**Why it fails**: Next.js is built around Vercel's runtime. Lambda has
cold-start issues for Next.js's SSR model. DynamoDB requires a different
data access pattern than the Next.js server-component idiom assumes. The
pairing fights itself.

**Fix**: Verify pairing compatibility pairwise. Document any
incompatibilities found. If a pair fights, either change the pair or
explicitly accept the friction with a Mitigations section.

## 4. The Buzzword Stack

**Sample**: A small SaaS app stack listing Kubernetes, Kafka, Cassandra,
Redis, Elasticsearch, and Spark.

**Why it fails**: Each tool is a category leader for its problem, but
the project doesn't have those problems yet. Operating six distributed
systems for 200 users is a full-time job; the actual product never ships.

**Fix**: Match operational complexity to current scale. A SaaS at $5k
MRR runs on Postgres + a single Node process. Add Kafka the day you
need event streaming you can't get from Postgres LISTEN/NOTIFY.

## 5. The Untyped Selection

**Sample**: "TBD on database; will decide during build."

**Why it fails**: Stack decisions made under build-time pressure are
worse than stack decisions made up front. The team picks whatever is
fastest in the moment; that choice locks in operational debt.

**Fix**: STACK.md has zero "TBD" entries before /god-build starts. If
genuinely unresolved, the entry says "/god-spike scheduled to evaluate
options X, Y, Z by date" and is gated as Tier 1 incomplete until the
spike resolves.

## 6. The "We'll Just Use" Trap

**Sample**: Casual sentence in PRD: "We'll just use Postgres."

**Why it fails**: That casual line skipped STACK entirely. No flip point,
no rationale, no pairing check. The choice is now load-bearing for
several other decisions and nobody owns it.

**Fix**: Promote every stack decision to STACK.md. If a PRD or ARCH
sentence implies a stack choice, that choice gets its own row in
STACK.md with rationale and flip point, even if the decision feels
obvious.

## 7. The Migration That Wasn't

**Sample**: STACK.md says "we use library X 2.x" but package.json shows 1.4.

**Why it fails**: Stack drift between the document and the code is
invisible until something breaks. The doc has aspirational truth; the
code has actual truth. Reverse-sync (Phase 6) catches this.

**Fix**: STACK.md entries get reverse-sync'd from `package.json` /
`go.mod` / `Cargo.toml` etc. The sync runs on /god-sync and updates
"Used in: X files; current version: 1.4" footers. Drift between stated
and actual is flagged in REVIEW-REQUIRED.md.
