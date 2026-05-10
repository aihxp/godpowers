# SLO Examples

## SLO Definition

A Service Level Objective ties to a PRD success metric.

```
PRD says: "99.9% uptime over 30 days"
SLO is:   Availability of /api/* endpoints > 99.9% over rolling 30 days
Indicator: 1 - (5xx responses / total responses)
Error budget: 0.1% = 43 minutes/month
```

## SLO + Error Budget Policy

The SLO without a policy is paper.

```
Error budget policy for /api/* availability:
  - Budget remaining > 50%: continue feature work
  - Budget remaining 25-50%: prioritize reliability work next sprint
  - Budget remaining 5-25%: freeze non-critical features; reliability only
  - Budget exhausted: halt deploys to /api/*; engage reliability rotation
```

The policy is what makes the SLO operational.

## Symptom-based Alerting

Alert on user-facing pain, not internal state.

```
GOOD: Alert when error rate on /api/* > 1% sustained for 5 minutes
GOOD: Alert when p99 latency > 2s sustained for 10 minutes
GOOD: Alert when checkout success rate drops 20% from rolling baseline

BAD: Alert when CPU > 80%
BAD: Alert when memory > 75%
BAD: Alert when disk > 85%
```

CPU/memory/disk alerts are good for capacity planning, not for "wake
someone up at 3am". Wake people for symptoms.

## Runbooks

Each alert has a runbook. The runbook has been DRY-RUN.

```
# Runbook: Error rate on /api/* > 1%

Trigger: Error rate alert fires (sustained 5 min)

Diagnostic steps:
1. Check Datadog dashboard "API Health" - which endpoint is failing?
2. Check recent deploys (last 30 min): is there a likely culprit?
3. Check Stripe API status: are we depending on a degraded upstream?
4. Check database connection pool: are we exhausted?

Mitigation:
- If recent deploy: rollback (see DEPLOY-PATTERNS.md)
- If upstream issue: enable degraded mode (return cached data)
- If DB connection: scale connection pool, restart bad pods
- If unknown: page the on-call engineer

Escalation: if not mitigated in 30 minutes, page CTO.

Last dry-run: 2026-04-20 (in staging, simulated 5xx)
```

## Structured Logging

```json
{
  "ts": "2026-05-09T14:23:45.123Z",
  "level": "info",
  "request_id": "req_abc123",
  "user_id": "user_xyz789",
  "endpoint": "/api/mrr",
  "duration_ms": 145,
  "status": 200
}
```

NOT:
```
2026-05-09 14:23:45 INFO Request to /api/mrr from user xyz789 took 145ms (200 OK)
```

Structured logs are queryable. Free-text isn't.

## Anti-patterns

### Vanity Dashboard
Charts with metrics that look impressive but tie to no SLO and no action.

**Fix**: every chart answers a question that ties to an action. Delete the rest.

### Alert without runbook
"Production down!" -- now what?

**Fix**: every alert payload includes the runbook URL.

### Untested runbook
Written once during a quiet afternoon. Never verified.

**Fix**: dry-run quarterly in staging. Update based on what's actually true.
