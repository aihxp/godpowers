#!/usr/bin/env node
/**
 * Keep public surface claims tied to the repository contents.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));

function countFiles(dir, pattern) {
  return fs
    .readdirSync(path.join(root, dir))
    .filter((name) => pattern.test(name))
    .length;
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function assertIncludes(rel, expected) {
  const content = read(rel);
  if (!content.includes(expected)) {
    throw new Error(`${rel} missing expected text: ${expected}`);
  }
}

const counts = {
  skills: countFiles('skills', /^god.*\.md$/),
  agents: countFiles('agents', /^god.*\.md$/),
  workflows: countFiles('workflows', /\.yaml$/),
  recipes: countFiles(path.join('routing', 'recipes'), /\.yaml$/),
};

const version = pkg.version;
const surface = `${counts.skills} skills, ${counts.agents} agents`;
const commandSurface = `${counts.skills} slash commands`;
const workflowSurface = `${counts.workflows} workflows`;
const recipeSurface = `${counts.recipes} recipes`;

assertIncludes('package.json', `${counts.skills} slash commands and ${counts.agents} specialist agents`);
assertIncludes('README.md', `version-${version}-blue`);
assertIncludes('README.md', `all ${counts.skills} skills + ${counts.agents} agents`);
assertIncludes('USERS.md', `Godpowers is at v${version}. Stable release.`);
assertIncludes('ARCHITECTURE.md', `STABLE v${version}`);
assertIncludes('ARCHITECTURE.md', `Core: ${surface}, ${workflowSurface}`);
assertIncludes('docs/ROADMAP.md', `Current shipped: v${version}`);
assertIncludes('docs/ROADMAP.md', `**${commandSurface}**`);
assertIncludes('docs/ROADMAP.md', `**${counts.agents} specialist agents**`);
assertIncludes('docs/reference.md', `reference for v${version}`);
assertIncludes('docs/reference.md', `Slash commands (${counts.skills} total)`);
assertIncludes('docs/reference.md', `Specialist agents (${counts.agents} total)`);
assertIncludes('skills/god-version.md', `Surface: ${surface}, ${workflowSurface}, ${recipeSurface}`);
assertIncludes('skills/god-doctor.md', `[OK] ${counts.skills} skills installed`);
assertIncludes('skills/god-doctor.md', `[OK] ${counts.agents} agents installed`);

console.log(`  + public surface docs match v${version}: ${surface}, ${workflowSurface}, ${recipeSurface}`);
