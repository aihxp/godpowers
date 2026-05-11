#!/usr/bin/env node
/**
 * Behavioral tests for first-party extension publishability.
 *
 * For each pack under extensions/, verify:
 *   - package.json is well-formed JSON
 *   - package.json.name matches manifest.metadata.name
 *   - package.json.version matches manifest.metadata.version
 *   - manifest engines.godpowers is satisfied by current godpowers version
 *   - `npm pack --dry-run --json` succeeds
 *   - the resulting tarball includes manifest.yaml, README.md,
 *     agents/, skills/, workflows/
 *   - the tarball does NOT include node_modules, .git, or other
 *     development cruft
 *
 * Does NOT actually publish - publishing is reserved for the release
 * workflow with the user's NPM_TOKEN.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ext = require('../lib/extensions');

const ROOT = path.resolve(__dirname, '..');
const PACKS_DIR = path.join(ROOT, 'extensions');
const ROOT_PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const GODPOWERS_VERSION = ROOT_PKG.version;

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  + ${name}`); passed++; }
  catch (e) { console.error(`  x ${name}: ${e.message}`); failed++; }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function packList() {
  return fs.readdirSync(PACKS_DIR)
    .map(name => path.join(PACKS_DIR, name))
    .filter(p => fs.statSync(p).isDirectory());
}

function readManifest(packDir) {
  const text = fs.readFileSync(path.join(packDir, 'manifest.yaml'), 'utf8');
  return ext.parseManifest(text).manifest;
}

function readPackageJson(packDir) {
  return JSON.parse(fs.readFileSync(path.join(packDir, 'package.json'), 'utf8'));
}

console.log('\n  Extension pack publish-readiness tests\n');
console.log(`  Running godpowers ${GODPOWERS_VERSION}\n`);

const packs = packList();
test('at least one pack exists under extensions/', () => {
  assert(packs.length > 0, 'no packs found');
});

for (const packDir of packs) {
  const packName = path.basename(packDir);

  test(`${packName}: has manifest.yaml`, () => {
    assert(fs.existsSync(path.join(packDir, 'manifest.yaml')),
      `manifest.yaml missing in ${packDir}`);
  });

  test(`${packName}: has package.json`, () => {
    assert(fs.existsSync(path.join(packDir, 'package.json')),
      `package.json missing in ${packDir}`);
  });

  test(`${packName}: has README.md`, () => {
    assert(fs.existsSync(path.join(packDir, 'README.md')),
      `README.md missing in ${packDir}`);
  });

  test(`${packName}: package.json name matches manifest`, () => {
    const m = readManifest(packDir);
    const p = readPackageJson(packDir);
    assert(m.metadata.name === p.name,
      `manifest=${m.metadata.name} pkg=${p.name}`);
  });

  test(`${packName}: package.json version matches manifest`, () => {
    const m = readManifest(packDir);
    const p = readPackageJson(packDir);
    assert(m.metadata.version === p.version,
      `manifest=${m.metadata.version} pkg=${p.version}`);
  });

  test(`${packName}: scoped package with publishConfig.access=public`, () => {
    const p = readPackageJson(packDir);
    assert(p.name.startsWith('@godpowers/'),
      `not @godpowers-scoped: ${p.name}`);
    assert(p.publishConfig && p.publishConfig.access === 'public',
      'publishConfig.access must be "public" for scoped packages');
  });

  test(`${packName}: peerDependencies.godpowers declared`, () => {
    const p = readPackageJson(packDir);
    assert(p.peerDependencies && p.peerDependencies.godpowers,
      'peerDependencies.godpowers required');
  });

  test(`${packName}: manifest engines.godpowers satisfied by current godpowers`, () => {
    const m = readManifest(packDir);
    assert(ext.isCompatible(m.engines.godpowers, GODPOWERS_VERSION),
      `engines '${m.engines.godpowers}' does not satisfy ${GODPOWERS_VERSION}`);
  });

  test(`${packName}: validateManifest passes`, () => {
    const m = readManifest(packDir);
    const errors = ext.validateManifest(m, GODPOWERS_VERSION);
    assert(errors.length === 0, `validation errors: ${errors.join('; ')}`);
  });

  test(`${packName}: provides at least one skill`, () => {
    const m = readManifest(packDir);
    assert(m.provides && Array.isArray(m.provides.skills)
      && m.provides.skills.length > 0,
      'provides.skills empty');
  });

  test(`${packName}: every provided skill has a corresponding file`, () => {
    const m = readManifest(packDir);
    for (const skill of m.provides.skills) {
      const file = path.join(packDir, 'skills', `${skill}.md`);
      assert(fs.existsSync(file), `missing skill file: ${file}`);
    }
  });

  test(`${packName}: every provided agent has a corresponding file`, () => {
    const m = readManifest(packDir);
    if (!m.provides.agents) return;
    for (const agent of m.provides.agents) {
      const file = path.join(packDir, 'agents', `${agent}.md`);
      assert(fs.existsSync(file), `missing agent file: ${file}`);
    }
  });

  test(`${packName}: every provided workflow has a yaml file`, () => {
    const m = readManifest(packDir);
    if (!m.provides.workflows) return;
    for (const wf of m.provides.workflows) {
      const file = path.join(packDir, 'workflows', `${wf}.yaml`);
      assert(fs.existsSync(file), `missing workflow file: ${file}`);
    }
  });

  test(`${packName}: npm pack --dry-run --json succeeds and emits expected files`, () => {
    let raw;
    try {
      raw = execSync('npm pack --dry-run --json --silent',
        { cwd: packDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch (e) {
      throw new Error(`npm pack failed: ${e.message}`);
    }
    const parsed = JSON.parse(raw);
    const entry = Array.isArray(parsed) ? parsed[0] : parsed;
    assert(entry, 'no pack entry in JSON output');
    const fileNames = (entry.files || []).map(f => f.path);
    assert(fileNames.includes('manifest.yaml'),
      `tarball missing manifest.yaml; files: ${fileNames.join(', ')}`);
    assert(fileNames.includes('README.md'),
      `tarball missing README.md; files: ${fileNames.join(', ')}`);
    assert(fileNames.includes('package.json'),
      `tarball missing package.json; files: ${fileNames.join(', ')}`);
    assert(fileNames.some(f => f.startsWith('skills/')),
      `tarball missing skills/; files: ${fileNames.join(', ')}`);
    assert(fileNames.some(f => f.startsWith('agents/') || f.startsWith('workflows/')),
      `tarball missing agents/ or workflows/; files: ${fileNames.join(', ')}`);
    // Negative: nothing that shouldn't be there
    for (const bad of ['node_modules', '.git', '.DS_Store', 'tests/']) {
      assert(!fileNames.some(f => f.startsWith(bad)),
        `tarball must not include ${bad}; got: ${fileNames.filter(f => f.startsWith(bad)).join(', ')}`);
    }
  });
}

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
