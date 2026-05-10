# LAUNCH Antipatterns

## 1. The Quiet Launch

**Sample**: Code is deployed; nobody told anyone. Team waits to see if
users notice.

**Why it fails**: Users don't notice good things. They notice broken ones.
Quiet launches give you adoption signals only when something is wrong.

**Fix**: Launch with intent. At minimum: announcement to existing users,
opening of signup for new users, and clear telemetry to verify the
expected adoption pattern.

## 2. The HARDEN-Skipped Launch

**Sample**: Time pressure; HARDEN gate skipped "to ship Friday."

**Why it fails**: Friday-launched, weekend-on-fire. The skipped harden
review missed an authentication bug; production is breached over the
weekend.

**Fix**: HARDEN is a gate, not a stage. The launch agent (god-launch-
strategist) refuses to advance if HARDEN/FINDINGS.md has open CRITICAL
or HIGH items. Even under --yolo. CRITICAL findings are not waivable.

## 3. The Launch Without Rollback

**Sample**: Launch plan describes how to ship; says nothing about how to
unship.

**Why it fails**: When the new release reveals a problem, the team has
no defined path backwards. Recovery improvises.

**Fix**: Rollback is part of the launch checklist. Trigger conditions
are explicit ("if error rate exceeds 5x baseline for 10 minutes,
rollback"). The rollback path is tested as part of launch prep.

## 4. The Launch Without Success Criteria

**Sample**: Launched; no measurable definition of "the launch worked."

**Why it fails**: Was the launch a success? The team can't tell.
Subsequent decisions ("ship a similar feature?") are made on vibe.

**Fix**: Each launch defines its success criteria up front, drawn from
the PRD success metrics. "M-5 launch is successful when 50 active
accounts within 60 days." The criteria are tracked in LAUNCH/STATE.md.

## 5. The Quiet Failure

**Sample**: A subset of users hits the bug; they don't report it because
it's intermittent. The team doesn't know.

**Fix**: Active error tracking from minute one. Sentry or equivalent
reports unhandled errors with user context. Launch readiness includes
"error tracking captures failures from real users in staging within
30 seconds of the failure occurring."

## 6. The Launched-and-Forgotten Feature

**Sample**: M-3 shipped 6 weeks ago. No follow-up tracking. Nobody knows
adoption.

**Fix**: Launch creates a measurement timeline. T+7d, T+30d, T+60d
checkpoints with the success metric tracked. Below threshold triggers a
god-postmortem (was the feature wrong, the messaging wrong, or the
metric wrong?).
