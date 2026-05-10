# PRD Antipatterns

> Common ways PRDs fail. Each has a sample, why it fails, and the fix.

## 1. The Hollow PRD

**Sample**: All sections filled, but no actual decisions. Every claim is
[HYPOTHESIS] with no validation plan.

**Why it fails**: Engineering can't build from hypotheses. Designers can't
design for "users who want value". A hollow PRD is theater.

**Fix**: For every [HYPOTHESIS], either commit it to a [DECISION] with
rationale, or schedule a validation step (user interview, spike, market
research) with a date.

## 2. The Solution-First PRD

**Sample**:
> Problem: Users don't have an AI-powered MRR tracking dashboard.

**Why it fails**: The problem statement names the solution. You haven't
defined the user pain; you've assumed AI tracking is the answer. If the
real problem is "I can't tell why MRR changed," AI tracking might not be
the right shape.

**Fix**: Restate the problem in user-pain terms. "Users can't tell why
their MRR changed week-over-week." Then ask whether AI is the right shape
or whether a clearer breakdown view would do.

## 3. The Feature Laundry List

**Sample**:
- Add MRR tracking
- Add charts
- Add Stripe integration
- Add user settings
- Add notifications

**Why it fails**: No prioritization. No acceptance criteria. Every item
looks equally important. Engineering will pick whichever is easiest first.

**Fix**: Tag each as MUST / SHOULD / COULD. Add acceptance criteria
("user can do X within Y, measured by Z"). Order MUSTs by user value.

## 4. The Assumption Soup

**Sample**:
> We assume users will love our AI insights and will pay $99/mo.

**Why it fails**: Multiple stacked assumptions, none labeled or validated.
What does "love" mean? Why $99? What if they don't?

**Fix**:
- "We hypothesize that solo SaaS founders [DECISION: target persona] will
  pay $99/mo for [DECISION: specific feature], based on [evidence]. We
  will validate by [user interviews, pricing test, or letter of intent]
  before /god-build. [OPEN QUESTION] what's the price ceiling? Owner: founder.
  Due: end of this week."

## 5. The Moving Target

**Sample**: PRD updated silently after engineering started building. No
notification, no diff, no re-validation.

**Why it fails**: Engineer builds X, comes back to find PRD now says Y.
Trust collapses.

**Fix**: All PRD changes after consumption (by ARCH, ROADMAP, or downstream)
must be tracked. Append a changelog. Notify downstream agents. Re-run their
have-nots checks.

## 6. The Generic Target User

**Sample**:
> Target users: developers and businesses who want better analytics.

**Why it fails**: "developers" is 30 million people with wildly different
needs. "Businesses" is meaningless. Substitution test passes (any tool
serves "developers").

**Fix**: Name a specific persona with role, context, and current pain.
"Solo SaaS founders running B2B businesses at $1k-$10k MRR using Stripe."

## 7. The Vanity Metric

**Sample**:
> Success metric: 10,000 users.

**Why it fails**: Users without retention is vanity. Users without revenue
(if revenue is the goal) is vanity. The number doesn't tie to the problem.

**Fix**: Tie the metric to the problem statement. If the problem is
"founders can't tell why MRR changed," the metric is "% of users who
correctly identify their primary growth driver after using the dashboard
for 7 days, measured by exit survey."

## 8. The Buzzword Bingo

**Sample**:
> AI-powered, cloud-native, scalable, robust, modern dashboard.

**Why it fails**: Substitution test passes for any product. None of these
words decide anything.

**Fix**: Replace each buzzword with a specific claim:
- "AI-powered" -> "uses GPT-4 to summarize the top growth driver in plain English"
- "Scalable" -> "supports 10000 concurrent users by month 6"
- "Modern" -> (delete; modernity isn't a feature)

## 9. The Empty No-Gos

**Sample**: Scope and No-Gos section is missing or empty.

**Why it fails**: Without explicit no-gos, engineering will drift toward
nice-to-haves. Scope creep is guaranteed.

**Fix**: List 3-5 specific no-gos that you might be tempted to build but
shouldn't:
- NOT building: mobile app for V1
- NOT building: customer support tooling
- NOT building: multi-tenant / white-label
- NOT building: AI-generated chart commentary (defer to V2)

## 10. The Owner-less Open Question

**Sample**:
> Open questions: should we support Paddle? TBD.

**Why it fails**: "TBD" without owner or due date means nobody resolves it.
The question stays open forever or gets decided by accident during build.

**Fix**:
| Question | Owner | Due |
|----------|-------|-----|
| Support Paddle in V1? | Founder | Before /god-arch |

If you don't know who owns it, the founder owns it.
