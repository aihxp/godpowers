# @godpowers/data-pack

Data engineering specialists for Godpowers.

## What it adds

| Slash command | Agent | What it knows |
|---|---|---|
| `/god-etl` | god-etl-engineer | Idempotent transforms, dead-letter, backfill, lag SLOs |
| `/god-ml-feature` | god-ml-feature-engineer | Training-serving consistency, freshness, drift |
| `/god-dashboard` | god-dashboard-builder | Question-per-chart, action-per-question, deploy annotations |

Plus 3 workflows and 18 data-specific have-nots.

## When to use

- Building data infrastructure (warehouses, lakes, feature stores)
- Adding ML to a product (use /god-ml-feature before /god-build for the model)
- Standing up internal dashboards (refuses vanity-metric dashboards)

## Install (v0.8+)

```
/god-extension-add @godpowers/data-pack
```

## Status

Scaffold ready in v0.4. Full implementation in v0.8.

## License

MIT
