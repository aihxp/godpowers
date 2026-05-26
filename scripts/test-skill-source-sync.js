#!/usr/bin/env node
/**
 * Keep individual skill files as the command source of truth.
 */

const fs = require('fs');
const path = require('path');

const surface = require('../lib/skill-surface');
const { test, assert, report } = require('./test-harness');

console.log('\n  Skill source sync tests\n');

test('skill-surface lists every slash command from skills/', () => {
  const skills = surface.listSkills();
  const files = fs.readdirSync(path.join(__dirname, '..', 'skills'))
    .filter((file) => /^god.*\.md$/.test(file));
  assert(skills.length === files.length, `skills=${skills.length} files=${files.length}`);
  assert(skills.some((skill) => skill.command === '/god-mode'), '/god-mode missing');
});

test('each listed skill has frontmatter name and command path', () => {
  const missing = surface.listSkills().filter((skill) => !skill.name || !skill.command);
  assert(missing.length === 0, missing.map((skill) => skill.file).join(', '));
});

test('SKILL.md declares individual skill files as authoritative', () => {
  const master = fs.readFileSync(path.join(__dirname, '..', 'SKILL.md'), 'utf8');
  assert(master.includes('Individual command files in `skills/` are the source of truth'),
    'SKILL.md does not declare skill source of truth');
  assert(master.includes('lib/skill-surface.js'),
    'SKILL.md does not point to skill-surface parser');
});

report();
