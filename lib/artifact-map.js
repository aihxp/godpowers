/**
 * Shared Godpowers artifact map.
 *
 * The map is intentionally small and mechanical. It names the on-disk
 * artifacts that release gates, dashboards, and docs can reference without
 * duplicating tier path rules.
 */

const TIER_ALIASES = {
  product: 'design',
  architecture: 'arch',
  stackDecision: 'stack',
  stackdecision: 'stack',
  audit: 'repo',
  hardening: 'harden'
};

const TIER_ARTIFACTS = {
  prd: [
    { id: 'prd', path: '.godpowers/prd/PRD.md', required: true, lint: true }
  ],
  design: [
    { id: 'design', paths: ['DESIGN.md', '.godpowers/design/DESIGN.md'], required: true, lint: true },
    { id: 'product', path: 'PRODUCT.md', required: false, lint: true },
    { id: 'design-state', path: '.godpowers/design/STATE.md', required: false, lint: true }
  ],
  arch: [
    { id: 'arch', path: '.godpowers/arch/ARCH.md', required: true, lint: true }
  ],
  roadmap: [
    { id: 'roadmap', path: '.godpowers/roadmap/ROADMAP.md', required: true, lint: true }
  ],
  stack: [
    { id: 'stack', path: '.godpowers/stack/DECISION.md', required: true, lint: true }
  ],
  repo: [
    { id: 'repo-audit', path: '.godpowers/repo/AUDIT.md', required: true, lint: true }
  ],
  build: [
    { id: 'build-state', path: '.godpowers/build/STATE.md', required: true, lint: true }
  ],
  harden: [
    { id: 'harden-findings', path: '.godpowers/harden/FINDINGS.md', required: true, lint: true }
  ]
};

function normalizeTier(tier) {
  if (!tier) return null;
  const raw = String(tier)
    .trim()
    .replace(/^\/god-/, '')
    .replace(/^god-/, '')
    .replace(/^tier-\d+[.:/-]?/, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return TIER_ALIASES[raw] || raw;
}

function tierArtifacts(tier) {
  const key = normalizeTier(tier);
  return key && TIER_ARTIFACTS[key] ? TIER_ARTIFACTS[key].map(copyArtifact) : [];
}

function copyArtifact(artifact) {
  return {
    ...artifact,
    paths: artifact.paths ? artifact.paths.slice() : undefined
  };
}

function primaryPath(tier) {
  const artifacts = tierArtifacts(tier);
  if (artifacts.length === 0) return null;
  return artifacts[0].path || (artifacts[0].paths && artifacts[0].paths[0]) || null;
}

function knownTiers() {
  return Object.keys(TIER_ARTIFACTS);
}

module.exports = {
  TIER_ARTIFACTS,
  normalizeTier,
  tierArtifacts,
  primaryPath,
  knownTiers
};
