# OBSERVE Antipatterns

## 1. The Vanity Dashboard

**Sample**: Beautiful dashboards showing aggregate request counts. Nothing
shows error budget burn or per-feature latency.

**Why it fails**: When something breaks, vanity dashboards don't tell you
what or why.

**Fix**: Dashboards anchored to SLOs, not to metric availability. Every
dashboard panel maps to a question the on-call needs to answer.

## 2. The Alert That Fires Forever

**Sample**: "High error rate" alert fires hourly; team has muted it.

**Why it fails**: An always-firing alert is no alert. The team learns
to ignore the channel; real fires get missed.

**Fix**: Alerts have actionable thresholds and a runbook. If an alert
fires more than weekly without action, it's tuned or removed. Alert
fatigue is a measurable failure.

## 3. The Logs Without Correlation

**Sample**: Logs scattered across services with no trace ID.

**Why it fails**: A user-reported bug touches 5 services. Without
correlation, the on-call greps by timestamp and prays.

**Fix**: Trace IDs propagate end-to-end. Every log line includes the
trace ID. OpenTelemetry standard or equivalent.

## 4. The Missing Error Budget

**Sample**: SLO defined as "99.9% uptime." When breached, no policy.

**Why it fails**: SLOs without error budget policies are theater. The
team has no defined response when reliability slips.

**Fix**: Each SLO has a written error budget policy: "When 50% of monthly
budget is consumed, halt feature work; when 100% consumed, freeze
non-fix deploys." Codified in OBSERVE/STATE.md.

## 5. The Untested Alert

**Sample**: Alerts configured; nobody has ever simulated the underlying
condition to verify the alert actually fires.

**Fix**: Each alert has a documented test (e.g., "kill one pod and
confirm HighErrorRate fires within 5 minutes"). Run quarterly.

## 6. The PII in Logs

**Sample**: User logging includes email, phone, billing address.

**Why it fails**: Logs are usually the least-protected data store. PII
in logs is a privacy incident waiting to happen.

**Fix**: Structured logging with explicit redaction. Schemas mark fields
as "redacted at source." Linting catches violations.
