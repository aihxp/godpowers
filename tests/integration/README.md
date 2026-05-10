# Integration Tests (v0.5+)

End-to-end workflow tests. Implementation arrives in v0.5.

## Test structure (planned)

```js
// tests/integration/full-arc.test.js
import { runWorkflow, fixture, replay } from '../helpers';

describe('/god-mode (full-arc)', () => {
  it('creates all 10 tier artifacts for greenfield', async () => {
    const project = await fixture('greenfield-saas');
    const result = await runWorkflow('full-arc', project, {
      replay: 'full-arc-greenfield-v1'
    });

    expect(result.exit).toBe(0);
    expect(project.exists('.godpowers/prd/PRD.md')).toBe(true);
    expect(project.exists('.godpowers/arch/ARCH.md')).toBe(true);
    expect(project.exists('.godpowers/build/STATE.md')).toBe(true);
    // ...
  });

  it('refuses to launch with Critical security findings', async () => {
    const project = await fixture('greenfield-with-vuln');
    const result = await runWorkflow('full-arc', project);

    expect(result.exit).toBe(0);
    expect(result.paused).toBe(true);
    expect(result.pause.reason).toContain('Critical');
  });
});
```

## Fixtures (planned)

| Fixture | Tests |
|---------|-------|
| `greenfield-saas` | full-arc happy path |
| `greenfield-with-vuln` | Critical-finding pause |
| `legacy-monolith` | feature-arc, refactor-arc |
| `flaky-prod` | hotfix-arc, postmortem |
| `outdated-deps` | update-deps |

## Status

Scaffold only in v0.4. Full implementation in v0.5.
