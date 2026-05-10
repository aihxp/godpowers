# Deploy Patterns

## Same-Artifact Promotion

Build the artifact ONCE. Promote the SAME artifact through environments.

```
build (CI) -> dev artifact -> dev env
                           -> staging env (same artifact)
                           -> prod env (same artifact)
```

**Why**: prevents "works in staging, broken in prod" caused by build drift.

**How**:
- Tag the artifact (Docker image, binary, bundle) with a version
- Use the tag throughout promotion
- NEVER rebuild per environment
- Configuration is the only thing that differs across environments

## Environment Parity

Configuration shape is the same across environments. Values differ.

```
# All environments use:
DATABASE_URL=...
STRIPE_API_KEY=...
LOG_LEVEL=...

# Values differ:
DATABASE_URL=postgres://dev-host vs postgres://prod-host
LOG_LEVEL=debug vs info
```

**Anti-pattern**: dev has feature flags that prod doesn't have. Or prod has
secrets that dev mocks. Drift accumulates and bites you.

## Expand-Contract for Schema Changes

Multi-step deploy for breaking schema changes:

1. **Expand**: deploy code that supports BOTH old and new schema. Old schema
   still active.
2. **Migrate data**: backfill new schema from old. Both still work.
3. **Switch**: deploy code that reads/writes new schema only.
4. **Contract**: drop old schema in a separate deploy.

Each step is independently deployable and rollback-able.

## Real Health Checks

Application-level. NOT just TCP port.

```js
// Good
GET /health -> {
  status: "ok" | "degraded" | "down",
  database: "connected",
  stripe_api: "reachable",
  worker_lag_seconds: 12,
  version: "1.2.3"
}

// Bad
GET /health -> 200 OK (just because the process is running)
```

## Tested Rollback

Document the rollback. THEN run it in staging. Then commit the runbook.

A rollback that's never been executed is a paper rollback.

```
Rollback procedure for v1.2.3:
1. Tag v1.2.2 in deploy system: kubectl rollout undo deployment/api
2. Verify health endpoint returns version: 1.2.2
3. Verify no DB schema rollback needed (this release was code-only)
4. Estimated time: 90 seconds
5. Last tested: 2026-04-15 (in staging)
```

## Smoke Test Post-Deploy

Automated. Runs against the live environment. Fails the deploy if it fails.

```bash
# After deploy:
curl -sf https://api.example.com/health || rollback
curl -sf https://api.example.com/api/v1/version | grep "1.2.3" || rollback
# Critical user path:
curl -sf https://api.example.com/api/v1/auth/test || rollback
```

## Anti-patterns

### Manual deploy steps
Production deploy requires a human running commands. Each step is a
chance to mess up.

**Fix**: automate end-to-end. Even the "click approve" step should be a
script that opens the right URL.

### Paper canary
Canary deploy "label" exists, but no traffic split. Just calling something
canary doesn't make it one.

**Fix**: actually split traffic at the load balancer. 1% -> 10% -> 50% ->
100%. Verify metrics at each step.
