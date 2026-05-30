const COMMON = [
  'god',
  'god-help',
  'god-version',
  'god-next',
  'god-status',
  'god-progress',
  'god-doctor',
  'god-settings'
];

const PROFILE_SKILLS = {
  core: [
    ...COMMON,
    'god-init',
    'god-mode',
    'god-build',
    'god-review',
    'god-sync',
    'god-quick',
    'god-fast'
  ],
  builder: [
    ...COMMON,
    'god-init',
    'god-mode',
    'god-discuss',
    'god-explore',
    'god-list-assumptions',
    'god-prd',
    'god-design',
    'god-design-impact',
    'god-arch',
    'god-roadmap',
    'god-stack',
    'god-repo',
    'god-build',
    'god-add-tests',
    'god-feature',
    'god-story',
    'god-stories',
    'god-story-build',
    'god-story-verify',
    'god-story-close',
    'god-review',
    'god-test-runtime',
    'god-sync',
    'god-quick',
    'god-fast'
  ],
  maintainer: [
    ...COMMON,
    'god-hygiene',
    'god-update-deps',
    'god-docs',
    'god-repair',
    'god-lint',
    'god-standards',
    'god-preflight',
    'god-audit',
    'god-agent-audit',
    'god-context',
    'god-context-scan',
    'god-locate',
    'god-scan',
    'god-link',
    'god-review-changes',
    'god-reconcile',
    'god-reconstruct',
    'god-migrate',
    'god-automation-status',
    'god-automation-setup',
    'god-extension-add',
    'god-extension-list',
    'god-extension-info',
    'god-extension-remove',
    'god-test-extension',
    'god-budget',
    'god-cost',
    'god-cache-clear',
    'god-logs',
    'god-metrics',
    'god-trace',
    'god-export-otel',
    'god-dogfood',
    'god-quick',
    'god-fast'
  ],
  suite: [
    ...COMMON,
    'god-suite-init',
    'god-suite-status',
    'god-suite-sync',
    'god-suite-patch',
    'god-suite-release',
    'god-workstream',
    'god-pr-branch',
    'god-sync',
    'god-reconcile',
    'god-review',
    'god-quick',
    'god-fast'
  ]
};

const PROFILE_DESCRIPTIONS = {
  core: 'front door, status, init, build, review, sync, quick edits',
  builder: 'core plus planning, design, stories, and runtime verification',
  maintainer: 'core plus hygiene, deps, docs, repair, automation, and extensions',
  suite: 'core plus multi-repo suite and workstream coordination',
  full: 'all shipped slash commands'
};

function normalizeProfiles(value) {
  if (!value) return ['full'];
  const raw = String(value)
    .split(',')
    .map(part => part.trim().toLowerCase())
    .filter(Boolean);
  const profiles = raw.length > 0 ? raw : ['full'];
  for (const profile of profiles) {
    if (profile !== 'full' && !PROFILE_SKILLS[profile]) {
      throw new Error(`Unknown install profile: ${profile}`);
    }
  }
  if (profiles.includes('full')) return ['full'];
  return [...new Set(profiles)];
}

function selectedSkillNames(profileValue, availableNames) {
  const profiles = normalizeProfiles(profileValue);
  if (profiles.includes('full')) return new Set(availableNames);
  const selected = new Set();
  for (const profile of profiles) {
    for (const name of PROFILE_SKILLS[profile]) {
      if (availableNames.includes(name)) selected.add(name);
    }
  }
  return selected;
}

function describeProfiles(profileValue) {
  return normalizeProfiles(profileValue)
    .map(profile => `${profile}: ${PROFILE_DESCRIPTIONS[profile]}`)
    .join('; ');
}

module.exports = {
  PROFILE_SKILLS,
  PROFILE_DESCRIPTIONS,
  normalizeProfiles,
  selectedSkillNames,
  describeProfiles
};
