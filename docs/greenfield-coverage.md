# Greenfield Artifact Coverage

> What gets created when you run `/god-mode` on a fresh project, and what's
> created lazily on demand.

## TL;DR

`/god-mode` produces **10 of 14** artifact categories during the arc. The
remaining **4 capture artifacts** are lazy: they only exist when you use
those commands.

After the arc, `/god-sync` runs automatically to ensure all 14 categories
are in a consistent state (existing artifacts validated; missing capture
artifacts noted as "not-yet-created").

## What `/god-mode` creates (10 artifacts)

These are produced sequentially as the arc progresses:

| Tier | Sub-step | Artifact path | Created by |
|------|----------|---------------|------------|
| 0 | Orchestration | `.godpowers/state.json` | god-orchestrator |
| 0 | Orchestration | `.godpowers/PROGRESS.md` | god-orchestrator |
| 0 | Orchestration | `.godpowers/intent.yaml` (v0.5+) | god-orchestrator |
| 1 | PRD | `.godpowers/prd/PRD.md` | god-pm |
| 1 | Architecture | `.godpowers/arch/ARCH.md` + `adr/` | god-architect |
| 1 | Roadmap | `.godpowers/roadmap/ROADMAP.md` | god-roadmapper |
| 1 | Stack | `.godpowers/stack/DECISION.md` | god-stack-selector |
| 2 | Repo | `.godpowers/repo/AUDIT.md` + repo source | god-repo-scaffolder |
| 2 | Build | `.godpowers/build/PLAN.md` + `STATE.md` + code | god-planner + god-executor |
| 3 | Deploy | `.godpowers/deploy/STATE.md` | god-deploy-engineer |
| 3 | Observe | `.godpowers/observe/STATE.md` | god-observability-engineer |
| 3 | Harden | `.godpowers/harden/FINDINGS.md` | god-harden-auditor |
| 3 | Launch | `.godpowers/launch/STATE.md` | god-launch-strategist |

Plus the run-level artifact:

| Path | Created by |
|------|------------|
| `.godpowers/runs/<id>/events.jsonl` (v0.5+) | All agents emit events here |

## What's lazy (4 capture artifacts)

These exist only when you use them. Empty placeholder files would be noise.

| Artifact | Created when | Created by |
|----------|--------------|------------|
| `.godpowers/backlog/BACKLOG.md` | first `/god-add-backlog` | god-orchestrator |
| `.godpowers/seeds/<id>.md` | first `/god-plant-seed` | god-orchestrator |
| `.godpowers/todos/TODOS.md` | first `/god-add-todo` or `/god-note` | god-orchestrator |
| `.godpowers/threads/<name>.md` | first `/god-thread new` | god-orchestrator |

When `/god-reconcile` runs, missing capture artifacts return status
`not-yet-created`. This is graceful, not a failure.

## What's lazy beyond the arc

These exist after their workflow runs:

| Artifact | Created by | When |
|----------|------------|------|
| `.godpowers/postmortems/<id>/POSTMORTEM.md` | god-incident-investigator | After /god-postmortem |
| `.godpowers/spikes/<slug>/SPIKE.md` | god-spike-runner | After /god-spike |
| `.godpowers/migrations/<slug>/MIGRATION.md` | god-migration-strategist | After /god-upgrade |
| `.godpowers/features/<slug>/PRD.md` | god-pm (feature-mode) | After /god-feature |
| `.godpowers/explore/<slug>.md` | god-explorer | After /god-explore |
| `.godpowers/discussions/<topic>.md` | god-explorer | After /god-discuss |
| `.godpowers/learnings/<milestone>/LEARNINGS.md` | god-orchestrator | After /god-extract-learnings |
| `.godpowers/sprints/sprint-<n>/PLAN.md` + `RETRO.md` | god-orchestrator + god-retrospective | After /god-sprint |
| `.godpowers/SYNC-LOG.md` | god-updater | After /god-sync (any sync run) |
| `.godpowers/HYGIENE-REPORT.md` | god-orchestrator | After /god-hygiene |
| `.godpowers/AUDIT-REPORT.md` | god-auditor | After /god-audit |
| `.godpowers/HANDOFF.md` | god-orchestrator | After /god-pause-work |
| `.godpowers/YOLO-DECISIONS.md` | god-orchestrator | When --yolo auto-resolves a pause |

## What `/god-mode --yolo` does about sync

After Tier 3 completes (Launch), `god-orchestrator` ALWAYS runs `/god-sync`
to ensure final consistency. This applies regardless of flags:

```
/god-mode                  -> arc + final /god-sync
/god-mode --yolo           -> arc + final /god-sync (auto-applied, no pause)
/god-mode --conservative   -> arc + final /god-sync (with confirmation)
/god-mode --with-hygiene   -> arc + final /god-sync PLUS hygiene check
```

The mandatory final sync ensures:
- All 10 produced artifacts pass their have-nots
- 4 capture artifacts noted as "not-yet-created" (gracefully)
- SYNC-LOG.md gets the arc completion entry
- state.json reflects final tier statuses

This is true for every full-arc run, including autonomous --yolo runs. The
sync step does NOT pause under --yolo: it auto-applies the consistency
checks since they're mechanical.

## Coverage levels

| Coverage | What it means | When it applies |
|----------|---------------|-----------------|
| **Full coverage** (14/14) | All artifacts exist, all sync'd | Active mature project that's used capture commands |
| **Arc coverage** (10/14) | All Tier 0-3 artifacts exist, capture artifacts not yet used | Just-completed `/god-mode` run |
| **Partial coverage** (varies) | Some tiers complete, others pending | Mid-arc or paused |
| **Pre-init** (0/14) | No `.godpowers/` directory | Fresh directory, before `/god-init` |

`/god-status` reports current coverage. `/god-reconcile` checks against
existing artifacts and treats missing ones gracefully.

## Why lazy capture is correct

We don't pre-create empty BACKLOG.md / TODOS.md / etc. because:

1. **No noise**: an empty file in your project is visual clutter.
2. **Honest signal**: file presence means "user has used this".
3. **Reconciler handles it**: `/god-reconcile` returns `not-yet-created`
   gracefully when checking against missing artifacts.
4. **No-op cost**: if you never use `/god-add-todo`, you never need
   TODOS.md.

If you prefer eager creation, you can pre-create them manually. The system
won't complain.

## Implications for /god-feature mid-arc

When you run `/god-feature` during a `/god-mode` arc (mid-development):

1. `/god-reconcile` runs first (all 14 artifacts)
2. For not-yet-created artifacts: status is `not-yet-created` (no impact)
3. For created artifacts: status is `present`, `missing-requirement`,
   `needs-delta`, etc.
4. Reconciler returns recommendation
5. Feature work executes
6. `/god-sync` runs at the end (updates touched artifacts; no-ops on
   not-yet-created ones)

The lazy capture artifacts simply don't participate until they exist. They
join the reconciliation loop the moment they're created.

## See also

- [Architecture Map](../ARCHITECTURE-MAP.md) - file structure and connections
- [Command Flows](command-flows.md) - per-command E2E
- [Arc Integrations](arc-integrations.md) - cross-workflow patterns
- [Recipes](recipes.md) - scenario reference
