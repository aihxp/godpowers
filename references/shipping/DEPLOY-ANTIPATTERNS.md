# DEPLOY Antipatterns

## 1. The Manual Deploy

**Sample**: "Deploy steps: 1. SSH to server. 2. Git pull. 3. npm restart."

**Why it fails**: Manual steps run by a human are unreproducible, undocumented in
runtime state, and accumulate divergence from what's checked in.

**Fix**: Every deploy is a CI workflow triggered by a tag or merge to main.
The workflow is the deploy spec; the runbook describes the workflow, not
the steps to run by hand.

## 2. The Untested Rollback

**Sample**: Deploy doc lists "rollback: redeploy previous tag." Nobody has
ever tested rollback in production.

**Why it fails**: When you need rollback, it's because something is broken.
That's not the moment to discover the rollback path also broken.

**Fix**: Rollback is exercised at least quarterly (game-day), and the
exercise generates an entry in DEPLOY/STATE.md with the date and outcome.

## 3. The Secret in the Repo

**Sample**: `.env.production` checked in with API keys.

**Why it fails**: Once committed, it lives in git history forever. Rotation
is required; reputation damage is not undone.

**Fix**: Secrets in the platform's secret manager (Vercel env, AWS Secrets
Manager, etc.). `.gitignore` enforces; pre-commit hook scans. Detected
violations BLOCK commit.

## 4. The Big-Bang Deploy

**Sample**: 2-week change merged and deployed all at once.

**Why it fails**: Bisecting a regression across 100 commits is hours of
work. Blast radius is the entire change.

**Fix**: Continuous deploy on merge. Each commit deploys. Feature flags
gate user exposure. Rollback rolls back one commit.

## 5. The Silent Deploy

**Sample**: No notification, no log, no audit when production deploys.

**Why it fails**: When something breaks at 3 AM, you don't know if the
2:55 AM deploy caused it because there's no record.

**Fix**: Every deploy emits an event (Slack, audit log, observability
trace). DEPLOY/STATE.md records the deploy SHA, time, and operator
(human or CI).

## 6. The Environment Drift

**Sample**: Staging works, production fails. Investigation reveals
staging has Node 20 and production runs Node 18.

**Fix**: Identical infrastructure-as-code for staging and production.
Differ only in scale, not in versions. Drift between environments is a
SEV-2 incident in itself.
