/**
 * Runtime surface profile preview and apply helper.
 */

const fs = require('fs');
const path = require('path');

const { resolveRuntime, runtimeKeys } = require('./installer-runtimes');
const profiles = require('./install-profiles');
const installer = require('./installer-core');

function availableSkillNames(srcDir) {
  const skillsDir = path.join(srcDir, 'skills');
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir)
    .filter((file) => /^god.*\.md$/.test(file))
    .map((file) => path.basename(file, '.md'))
    .sort();
}

function isRuntimeSkillName(name) {
  return name === 'god' || name.startsWith('god-');
}

function installedSkillNames(runtime) {
  const skillsDir = path.join(runtime.configDir, runtime.skillsDir);
  if (!fs.existsSync(skillsDir)) return [];
  const names = [];
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
      if (fs.existsSync(skillFile) && isRuntimeSkillName(entry.name)) {
        names.push(entry.name);
      }
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const name = path.basename(entry.name, '.md');
      if (isRuntimeSkillName(name)) names.push(name);
    }
  }
  return [...new Set(names)].sort();
}

function currentProfile(runtime) {
  const marker = path.join(runtime.configDir, 'GODPOWERS_PROFILE');
  if (!fs.existsSync(marker)) return 'unknown';
  const text = fs.readFileSync(marker, 'utf8').trim();
  return text || 'unknown';
}

function targetRuntimeKeys(opts = {}) {
  if (opts.all) return runtimeKeys();
  if (opts.runtimes && opts.runtimes.length > 0) return opts.runtimes.slice();
  return runtimeKeys().filter((key) => {
    const runtime = resolveRuntime(key, opts);
    return runtime && fs.existsSync(path.join(runtime.configDir, 'GODPOWERS_VERSION'));
  });
}

function diffSkills(selected, installed) {
  const selectedSet = new Set(selected);
  const installedSet = new Set(installed);
  return {
    add: selected.filter((name) => !installedSet.has(name)),
    remove: installed.filter((name) => !selectedSet.has(name))
  };
}

function plan(srcDir = path.resolve(__dirname, '..'), opts = {}) {
  const profileList = profiles.normalizeProfiles(opts.profile || 'core');
  const profile = profileList.join(',');
  const available = availableSkillNames(srcDir);
  const selected = [...profiles.selectedSkillNames(profile, available)].sort();
  const keys = targetRuntimeKeys(opts);
  const targets = keys.map((key) => {
    const runtime = resolveRuntime(key, opts);
    const installed = runtime ? installedSkillNames(runtime) : [];
    const diff = diffSkills(selected, installed);
    return {
      key,
      name: runtime ? runtime.name : key,
      configDir: runtime ? runtime.configDir : null,
      skillsDir: runtime ? path.join(runtime.configDir, runtime.skillsDir) : null,
      installed: Boolean(runtime && fs.existsSync(path.join(runtime.configDir, 'GODPOWERS_VERSION'))),
      currentProfile: runtime ? currentProfile(runtime) : 'unknown',
      currentCount: installed.length,
      selectedCount: selected.length,
      add: diff.add,
      remove: diff.remove
    };
  });

  return {
    profile,
    description: profiles.describeProfiles(profile),
    mode: opts.apply ? 'apply' : 'dry-run',
    selectedCount: selected.length,
    availableCount: available.length,
    targets
  };
}

function apply(srcDir = path.resolve(__dirname, '..'), opts = {}) {
  const keys = targetRuntimeKeys(opts);
  if (keys.length === 0) {
    throw new Error('surface apply requires an installed runtime, --all, or an explicit runtime flag');
  }
  const results = [];
  for (const key of keys) {
    const ok = installer.installForRuntime(key, srcDir, { ...opts, profile: opts.profile || 'core' });
    results.push({ key, ok });
  }
  return results;
}

function renderList(items, max = 6) {
  if (!items || items.length === 0) return 'none';
  const shown = items.slice(0, max).join(', ');
  const remaining = items.length - max;
  return remaining > 0 ? `${shown}, and ${remaining} more` : shown;
}

function render(report) {
  const lines = [
    'Godpowers Surface',
    '',
    `Profile: ${report.description}`,
    `Mode: ${report.mode}`,
    `Selected commands: ${report.selectedCount} of ${report.availableCount}`,
    '',
    'Runtime targets:'
  ];

  if (report.targets.length === 0) {
    lines.push('  none detected. Pass --claude, --codex, or --all.');
  } else {
    for (const target of report.targets) {
      lines.push(`  - ${target.name}: current ${target.currentProfile}, selected ${target.selectedCount} commands`);
      lines.push(`    Path: ${target.skillsDir}`);
      lines.push(`    Add: ${renderList(target.add)}`);
      lines.push(`    Remove: ${renderList(target.remove)}`);
    }
  }

  lines.push('');
  lines.push('Next commands:');
  if (report.targets.length === 0) {
    lines.push('- godpowers surface --profile=core --codex --global --dry-run: Preview the core surface for Codex.');
  } else if (report.mode === 'dry-run') {
    const first = report.targets[0];
    lines.push(`- godpowers surface --profile=${report.profile} --${first.key} --global --apply: Apply this profile to ${first.name}.`);
  } else {
    lines.push('- /god-help: Open the compact help view after the surface switch.');
  }
  lines.push('- /god-help all: Show the complete catalog when you need every command.');

  return lines.join('\n');
}

module.exports = {
  availableSkillNames,
  installedSkillNames,
  targetRuntimeKeys,
  plan,
  apply,
  render
};
