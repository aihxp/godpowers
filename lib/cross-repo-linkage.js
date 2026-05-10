/**
 * Cross-Repo Linkage
 *
 * Extends the per-repo linkage map (lib/linkage.js) to span multiple
 * repos in a Mode D suite. IDs are repo-qualified to prevent collisions:
 *   <repo-name>:<id>      e.g.,  shared-libs:C-auth-service
 *
 * Public API:
 *   qualifyId(repoName, id) -> string
 *   parseQualifiedId(qid) -> { repo, id } | null
 *   readForwardSuite(hubPath) -> { 'qualified-id': [files] }
 *   crossRepoOrphans(hubPath, knownIds) -> [...]
 *   crossRepoImpact(hubPath, qualifiedId) -> [{ repo, files }]
 *   collectAllIds(hubPath) -> { id, repo, declared, implemented }[]
 */

const fs = require('fs');
const path = require('path');

const linkage = require('./linkage');
const detector = require('./multi-repo-detector');

/**
 * Qualify a stable ID with its repo name.
 */
function qualifyId(repoName, id) {
  return `${repoName}:${id}`;
}

/**
 * Parse a qualified ID. Returns null if not qualified.
 */
function parseQualifiedId(qid) {
  if (!qid || typeof qid !== 'string') return null;
  const idx = qid.indexOf(':');
  if (idx === -1) return null;
  return {
    repo: qid.slice(0, idx),
    id: qid.slice(idx + 1)
  };
}

/**
 * Read each sibling's forward map and build a qualified map for the suite.
 */
function readForwardSuite(hubPath) {
  const config = detector.readSuiteConfig(hubPath);
  if (!config) return {};
  const out = {};
  const siblings = (config.siblings || []).map(sib => {
    if (typeof sib === 'string') return { name: sib, path: path.resolve(hubPath, sib) };
    return { name: sib.name, path: path.resolve(hubPath, sib.path || sib.name) };
  });
  for (const sib of siblings) {
    if (!fs.existsSync(sib.path)) continue;
    const fwd = linkage.readForward(sib.path);
    for (const [id, files] of Object.entries(fwd)) {
      const qid = qualifyId(sib.name, id);
      out[qid] = files.map(f => `${sib.name}/${f}`);
    }
  }
  return out;
}

/**
 * Find IDs that are declared but have no implementing file across all
 * repos.
 *
 * `knownIds` is a list of qualified IDs (e.g., ['shared:C-auth', 'app:P-MUST-01']).
 */
function crossRepoOrphans(hubPath, knownIds) {
  const fwd = readForwardSuite(hubPath);
  return knownIds.filter(qid => !fwd[qid] || fwd[qid].length === 0);
}

/**
 * Given a qualified ID, find files across the suite that depend on it.
 * Useful when removing a token from one repo: scans all sibling repos
 * for usage of the qualified token reference.
 */
function crossRepoImpact(hubPath, qualifiedId) {
  const config = detector.readSuiteConfig(hubPath);
  if (!config) return [];
  const parsed = parseQualifiedId(qualifiedId);
  if (!parsed) return [];

  const siblings = (config.siblings || []).map(sib => {
    if (typeof sib === 'string') return { name: sib, path: path.resolve(hubPath, sib) };
    return { name: sib.name, path: path.resolve(hubPath, sib.path || sib.name) };
  });

  const result = [];
  for (const sib of siblings) {
    if (!fs.existsSync(sib.path)) continue;
    const reverse = linkage.readReverse(sib.path);
    const matches = [];
    for (const [file, ids] of Object.entries(reverse)) {
      if (ids.includes(qualifiedId) || ids.includes(parsed.id)) {
        matches.push(file);
      }
    }
    if (matches.length > 0) {
      result.push({ repo: sib.name, files: matches });
    }
  }
  return result;
}

/**
 * Walk all repos and collect every linked ID with its repo origin.
 * Returns deduplicated list:
 *   [{ qualifiedId, repo, id, fileCount }, ...]
 */
function collectAllIds(hubPath) {
  const fwd = readForwardSuite(hubPath);
  const result = [];
  for (const [qid, files] of Object.entries(fwd)) {
    const parsed = parseQualifiedId(qid);
    if (parsed) {
      result.push({
        qualifiedId: qid,
        repo: parsed.repo,
        id: parsed.id,
        fileCount: files.length
      });
    }
  }
  return result.sort((a, b) => a.qualifiedId.localeCompare(b.qualifiedId));
}

/**
 * Compute coverage across the suite: percent of declared IDs that are
 * implemented in at least one repo.
 */
function suiteCoverage(hubPath, knownIds) {
  if (knownIds.length === 0) return 1;
  const fwd = readForwardSuite(hubPath);
  const linked = knownIds.filter(qid => fwd[qid] && fwd[qid].length > 0).length;
  return linked / knownIds.length;
}

module.exports = {
  qualifyId,
  parseQualifiedId,
  readForwardSuite,
  crossRepoOrphans,
  crossRepoImpact,
  collectAllIds,
  suiteCoverage
};
