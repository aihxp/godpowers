## Summary

<!-- What does this PR do? One paragraph. -->

## Type of change

- [ ] Bug fix
- [ ] New feature (slash command, agent, workflow, recipe)
- [ ] Refactor (no behavior change)
- [ ] Documentation
- [ ] Test infrastructure
- [ ] Breaking change

## Checklist

- [ ] Tests pass: `bash scripts/smoke.sh && node scripts/validate-skills.js && node scripts/test-runtime.js && node scripts/test-router.js && node scripts/test-recipes.js`
- [ ] If new slash command: routing/<command>.yaml added
- [ ] If new agent: routing reference updated, smoke test PAIRS updated
- [ ] If new workflow: workflow YAML follows schema, smoke test passes
- [ ] If new recipe: gen-recipes.js entry added, recipe regenerated
- [ ] If new have-not: HAVE-NOTS.md catalog updated
- [ ] CHANGELOG.md entry added under [Unreleased]
- [ ] No em/en dashes introduced (smoke test enforces)
- [ ] No emoji decoration in generated files

## Verification

<!-- How did you verify this works? Test output, screenshots, etc. -->

## Related issues

<!-- Closes #N, or references #N -->
