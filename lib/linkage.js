/**
 * Linkage Map Manager
 *
 * Bidirectional linkage between artifact elements (PRD requirements,
 * ADRs, ARCH containers, ROADMAP milestones, STACK decisions, DESIGN
 * tokens/components) and code files.
 *
 * Storage:
 *   .godpowers/links/artifact-to-code.json   - forward map
 *   .godpowers/links/code-to-artifact.json   - reverse map
 *   .godpowers/links/LINKAGE-LOG.md          - append-only history
 *
 * Stable ID format:
 *   PRD requirement:  P-{MUST,SHOULD,COULD}-NN  (e.g., P-MUST-01)
 *   ADR:              ADR-NNN
 *   ARCH container:   C-{slug}                  (e.g., C-auth-service)
 *   ROADMAP milestone: M-{slug}                 (e.g., M-launch-v1)
 *   STACK decision:   S-{slug}                  (e.g., S-postgres-15)
 *   DESIGN token:     YAML path                 (e.g., colors.primary)
 *   DESIGN component: D-{slug}                  (e.g., D-button-primary)
 */

const fs = require('fs');
const path = require('path');

const ID_PATTERNS = {
  prd: /^P-(MUST|SHOULD|COULD)-\d+$/,
  adr: /^ADR-\d+$/,
  container: /^C-[\w-]+$/,
  milestone: /^M-[\w-]+$/,
  stack: /^S-[\w-]+$/,
  story: /^STORY-[\w-]+-\d+$/,
  design: /^D-[\w-]+$/,
  token: /^[a-z][\w-]*\.[\w.-]+$/   // colors.primary, typography.display, etc.
};

function classifyId(id) {
  for (const [kind, regex] of Object.entries(ID_PATTERNS)) {
    if (regex.test(id)) return kind;
  }
  return 'unknown';
}

function linksDir(projectRoot) {
  return path.join(projectRoot, '.godpowers', 'links');
}

function forwardPath(projectRoot) {
  return path.join(linksDir(projectRoot), 'artifact-to-code.json');
}

function reversePath(projectRoot) {
  return path.join(linksDir(projectRoot), 'code-to-artifact.json');
}

function logPath(projectRoot) {
  return path.join(linksDir(projectRoot), 'LINKAGE-LOG.md');
}

function ensureDir(projectRoot) {
  const dir = linksDir(projectRoot);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readMap(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return {};
  }
}

function writeMap(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Read forward map: artifact ID -> array of file paths.
 */
function readForward(projectRoot) {
  return readMap(forwardPath(projectRoot));
}

/**
 * Read reverse map: file path -> array of artifact IDs.
 */
function readReverse(projectRoot) {
  return readMap(reversePath(projectRoot));
}

/**
 * Add a link: artifact ID <-> file path. Bidirectional, idempotent.
 * Returns { added: bool, ... }.
 */
function addLink(projectRoot, artifactId, filePath, opts = {}) {
  ensureDir(projectRoot);
  const fwd = readForward(projectRoot);
  const rev = readReverse(projectRoot);

  const normFile = path.relative(projectRoot, path.resolve(projectRoot, filePath));
  if (!fwd[artifactId]) fwd[artifactId] = [];
  if (!rev[normFile]) rev[normFile] = [];

  const fwdHad = fwd[artifactId].includes(normFile);
  const revHad = rev[normFile].includes(artifactId);

  if (!fwdHad) fwd[artifactId].push(normFile);
  if (!revHad) rev[normFile].push(artifactId);

  fwd[artifactId].sort();
  rev[normFile].sort();

  writeMap(forwardPath(projectRoot), fwd);
  writeMap(reversePath(projectRoot), rev);

  if (!fwdHad || !revHad) {
    appendLog(projectRoot, `+ link: ${artifactId} <-> ${normFile}` + (opts.source ? ` (via ${opts.source})` : ''));
  }
  return { added: !fwdHad || !revHad, artifactId, file: normFile };
}

/**
 * Remove a link.
 */
function removeLink(projectRoot, artifactId, filePath) {
  ensureDir(projectRoot);
  const fwd = readForward(projectRoot);
  const rev = readReverse(projectRoot);
  const normFile = path.relative(projectRoot, path.resolve(projectRoot, filePath));

  let removed = false;
  if (fwd[artifactId]) {
    const before = fwd[artifactId].length;
    fwd[artifactId] = fwd[artifactId].filter(f => f !== normFile);
    if (fwd[artifactId].length === 0) delete fwd[artifactId];
    if (before !== (fwd[artifactId] ? fwd[artifactId].length : 0)) removed = true;
  }
  if (rev[normFile]) {
    const before = rev[normFile].length;
    rev[normFile] = rev[normFile].filter(id => id !== artifactId);
    if (rev[normFile].length === 0) delete rev[normFile];
    if (before !== (rev[normFile] ? rev[normFile].length : 0)) removed = true;
  }

  writeMap(forwardPath(projectRoot), fwd);
  writeMap(reversePath(projectRoot), rev);

  if (removed) {
    appendLog(projectRoot, `- link: ${artifactId} <-> ${normFile}`);
  }
  return { removed };
}

/**
 * Query: given an artifact ID, return linked files.
 */
function queryByArtifact(projectRoot, artifactId) {
  const fwd = readForward(projectRoot);
  return fwd[artifactId] || [];
}

/**
 * Query: given a file path, return linked artifact IDs.
 */
function queryByFile(projectRoot, filePath) {
  const rev = readReverse(projectRoot);
  const normFile = path.relative(projectRoot, path.resolve(projectRoot, filePath));
  return rev[normFile] || [];
}

/**
 * List orphan artifact IDs (no implementing file).
 * `knownIds` is an array of artifact IDs the user wants to check (typically
 * sourced by parsing PRD/ARCH/etc. for declared IDs).
 */
function listOrphans(projectRoot, knownIds) {
  const fwd = readForward(projectRoot);
  return knownIds.filter(id => !fwd[id] || fwd[id].length === 0);
}

/**
 * Compute coverage: percentage of known IDs that have at least one link.
 */
function coverage(projectRoot, knownIds) {
  if (knownIds.length === 0) return 1;
  const fwd = readForward(projectRoot);
  const linked = knownIds.filter(id => fwd[id] && fwd[id].length > 0).length;
  return linked / knownIds.length;
}

/**
 * Append to LINKAGE-LOG.md.
 */
function appendLog(projectRoot, message) {
  ensureDir(projectRoot);
  const ts = new Date().toISOString();
  const line = `${ts} ${message}\n`;
  fs.appendFileSync(logPath(projectRoot), line);
}

/**
 * Replace all links from a source (used by code-scanner to do bulk updates).
 */
function bulkReplaceFromSource(projectRoot, source, links) {
  ensureDir(projectRoot);
  const log = [];
  for (const { artifactId, file } of links) {
    const r = addLink(projectRoot, artifactId, file, { source });
    if (r.added) log.push(`from ${source}: ${artifactId} -> ${file}`);
  }
  return { count: links.length, added: log.length };
}

module.exports = {
  classifyId,
  ID_PATTERNS,
  readForward,
  readReverse,
  addLink,
  removeLink,
  queryByArtifact,
  queryByFile,
  listOrphans,
  coverage,
  appendLog,
  bulkReplaceFromSource,
  forwardPath,
  reversePath,
  logPath,
  linksDir
};
