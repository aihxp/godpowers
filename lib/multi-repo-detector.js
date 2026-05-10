/**
 * Multi-Repo Detector
 *
 * Detects whether the working directory is part of a multi-repo suite
 * (Mode D in the repo-ready taxonomy).
 *
 * Detection signals (any one is enough):
 *   1. `.godpowers/suite-config.yaml` declares siblings (canonical)
 *   2. Multiple `.godpowers/` dirs under a common parent that user
 *      explicitly registered (via /god-suite-init)
 *   3. Hub indicator: directory contains a suite-config.yaml AND has
 *      no source code of its own (pure coordination repo)
 *
 * Per the locked plan answer Q1: explicit declaration only. We do NOT
 * auto-walk parent dirs to find siblings. Users must register them.
 *
 * Public API:
 *   detect(projectRoot) -> { isMultiRepo, role, siblings, hubPath }
 *   readSuiteConfig(projectRoot) -> { siblings, byteIdentical, ... } | null
 *   isHub(projectRoot) -> bool
 *   findHub(projectRoot) -> hubPath | null
 */

const fs = require('fs');
const path = require('path');
const { parseSimpleYaml } = require('./intent');

/**
 * Look for .godpowers/suite-config.yaml in projectRoot or any
 * registered parent. Returns parsed content or null.
 */
function readSuiteConfig(projectRoot) {
  const localConfig = path.join(projectRoot, '.godpowers', 'suite-config.yaml');
  if (fs.existsSync(localConfig)) {
    try {
      const content = fs.readFileSync(localConfig, 'utf8');
      return parseSimpleYaml(content);
    } catch (e) {
      return null;
    }
  }
  // Check if state.json points to a hub
  const statePath = path.join(projectRoot, '.godpowers', 'state.json');
  if (fs.existsSync(statePath)) {
    try {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      if (state.suite && state.suite.hubPath) {
        const hubConfigPath = path.join(state.suite.hubPath, '.godpowers', 'suite-config.yaml');
        if (fs.existsSync(hubConfigPath)) {
          return parseSimpleYaml(fs.readFileSync(hubConfigPath, 'utf8'));
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

/**
 * Is this directory the hub of a suite?
 * Heuristic: has suite-config.yaml AND declares siblings AND is not
 * itself listed in those siblings.
 */
function isHub(projectRoot) {
  const config = readSuiteConfig(projectRoot);
  if (!config) return false;
  const siblings = (config.siblings || []).map(s => normalize(s));
  const myName = normalize(path.basename(projectRoot));
  return siblings.length > 0 && !siblings.includes(myName);
}

/**
 * Find the hub from a sibling repo. Walks up via state.json.suite.hubPath.
 * Returns hub absolute path or null.
 */
function findHub(projectRoot) {
  const statePath = path.join(projectRoot, '.godpowers', 'state.json');
  if (!fs.existsSync(statePath)) return null;
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (state.suite && state.suite.hubPath) {
      return state.suite.hubPath;
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * Detect this directory's role in a suite.
 *
 * Returns:
 *   {
 *     isMultiRepo: bool,
 *     role: 'hub' | 'sibling' | null,
 *     siblings: [{ name, path }],   // populated when isMultiRepo
 *     hubPath: string | null
 *   }
 */
function detect(projectRoot) {
  const config = readSuiteConfig(projectRoot);
  if (!config) {
    return { isMultiRepo: false, role: null, siblings: [], hubPath: null };
  }

  const myName = path.basename(projectRoot);
  const declaredSiblings = config.siblings || [];

  // Resolve sibling paths. Per Q1, paths are explicit (relative or absolute)
  // in suite-config.yaml.
  const siblingsResolved = declaredSiblings.map(sib => {
    if (typeof sib === 'string') {
      return { name: sib, path: path.resolve(projectRoot, sib) };
    }
    if (typeof sib === 'object' && sib.name) {
      return {
        name: sib.name,
        path: sib.path ? path.resolve(projectRoot, sib.path) : null
      };
    }
    return null;
  }).filter(Boolean);

  const isCurrentHub = isHub(projectRoot);

  if (isCurrentHub) {
    return {
      isMultiRepo: true,
      role: 'hub',
      siblings: siblingsResolved,
      hubPath: projectRoot
    };
  }

  // We're a sibling. Find the hub.
  const hubPath = findHub(projectRoot);
  return {
    isMultiRepo: !!hubPath,
    role: hubPath ? 'sibling' : null,
    siblings: siblingsResolved,
    hubPath
  };
}

/**
 * List byte-identical files declared in the suite config.
 * Returns [{ path, description }].
 */
function getByteIdenticalFiles(projectRoot) {
  const config = readSuiteConfig(projectRoot);
  if (!config) return [];
  const list = config['byte-identical'] || config.byteIdentical || [];
  return list.map(item => {
    if (typeof item === 'string') return { path: item, description: '' };
    return { path: item.path, description: item.description || '' };
  });
}

/**
 * Get the version table from suite-config.
 * Format: { 'package-name': { 'repo-name': '1.2.3' } }
 */
function getVersionTable(projectRoot) {
  const config = readSuiteConfig(projectRoot);
  if (!config) return {};
  return config['version-table'] || config.versionTable || {};
}

function normalize(name) {
  return String(name || '').toLowerCase().trim();
}

module.exports = {
  detect,
  readSuiteConfig,
  isHub,
  findHub,
  getByteIdenticalFiles,
  getVersionTable
};
