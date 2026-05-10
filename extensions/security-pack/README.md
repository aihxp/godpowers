# @godpowers/security-pack

Compliance-aware security agents for Godpowers.

## What it adds

- `god-soc2-auditor` + `/god-soc2-audit` - SOC 2 Common Criteria
- `god-hipaa-auditor` + `/god-hipaa-audit` - HIPAA Security Rule
- `god-pci-auditor` + `/god-pci-audit` - PCI-DSS 4.0
- Workflows: `soc2-arc.yaml`, `hipaa-arc.yaml`, `pci-arc.yaml`
- Extension-specific have-nots (SOC2-XX, HIPAA-XX, PCI-XX)

## When to use

- Approaching a SOC 2 / HIPAA / PCI audit
- Building a HIPAA-covered or PCI-merchant product from greenfield
- Periodic compliance health check

## Install

```bash
# Inside Godpowers (v0.8+):
/god-extension-add @godpowers/security-pack

# Or directly via npm (v0.9+):
npm install -g @godpowers/security-pack
```

## Status

Scaffold ready in v0.4. Full implementation arrives in v0.8 alongside the
extension loader.

This directory shows what an extension looks like. v0.8's extension loader
will copy these files into the active runtime when installed.

## Relationship to god-harden-auditor

`god-harden-auditor` (core) finds vulnerabilities. `god-soc2-auditor`
(extension) maps controls to evidence. Both should run before a real audit.

A clean god-harden-auditor run is necessary but not sufficient for SOC 2
compliance. SOC 2 has process requirements (training, access reviews,
incident response history) that vulnerability scanning doesn't cover.

## License

MIT
