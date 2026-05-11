/**
 * Agent Cache - opt-in cache of agent outputs keyed by deterministic
 * input hash. Cache hit = no spawn, no tokens spent.
 *
 * Cache key = sha256(agent_name + agent_version + sorted-inputs JSON +
 *                    state_hash + project_mode)
 *
 * Storage: .godpowers/cache/<keyPrefix>/<fullKey>.json
 * Each entry: {
 *   key, agent, agent_version, model, ts,
 *   inputs_hash, state_hash,
 *   output: <artifact text or structured result>,
 *   tokens: { in, out },
 *   ttl_ms,
 *   expires
 * }
 *
 * Cache is OPT-IN. The orchestrator only consults it when
 * intent.yaml.budgets.cache === true, or `/god-mode --cache` is set.
 *
 * Invalidation:
 *   - TTL expiration (default 24 hours)
 *   - state.json hash mismatch (downstream input changed)
 *   - agent version mismatch (agent was updated)
 *   - manual: /god-cache-clear (all) or by agent name
 *
 * Public API:
 *   cacheDir(projectRoot) -> string
 *   key(agent, version, inputs, stateHash) -> string
 *   get(projectRoot, key) -> entry | null
 *   put(projectRoot, key, entry) -> path
 *   has(projectRoot, key) -> bool (and not expired)
 *   clear(projectRoot, opts) -> { removed: number }
 *   stats(projectRoot) -> { count, totalBytes, oldestTs }
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function cacheDir(projectRoot) {
  return path.join(projectRoot, '.godpowers', 'cache');
}

/**
 * Deterministically compute a cache key.
 *
 * inputs is normalized: top-level keys sorted, nested objects sorted
 * recursively, undefined dropped. Same inputs => same key.
 */
function key(agent, agent_version, inputs, stateHash) {
  const stable = sortKeys(inputs || {});
  const payload = JSON.stringify({
    agent: agent || '',
    agent_version: agent_version || '',
    state_hash: stateHash || '',
    inputs: stable
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function sortKeys(obj) {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj).sort()) {
      if (obj[k] === undefined) continue;
      out[k] = sortKeys(obj[k]);
    }
    return out;
  }
  return obj;
}

function entryPath(projectRoot, k) {
  // Shard by first 2 chars of key to keep dirs flat
  return path.join(cacheDir(projectRoot), k.slice(0, 2), `${k}.json`);
}

function isExpired(entry, now) {
  if (!entry || !entry.expires) return true;
  return (now || Date.now()) > Date.parse(entry.expires);
}

/**
 * Read a cache entry. Returns null on miss or expired.
 */
function get(projectRoot, k) {
  const p = entryPath(projectRoot, k);
  if (!fs.existsSync(p)) return null;
  let entry;
  try { entry = JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { return null; }
  if (isExpired(entry)) return null;
  return entry;
}

function has(projectRoot, k) {
  return get(projectRoot, k) != null;
}

/**
 * Write a cache entry. Returns the file path.
 */
function put(projectRoot, k, entry) {
  const p = entryPath(projectRoot, k);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const ttl = entry.ttl_ms || DEFAULT_TTL_MS;
  const full = {
    key: k,
    ts: new Date().toISOString(),
    expires: new Date(Date.now() + ttl).toISOString(),
    ttl_ms: ttl,
    ...entry
  };
  fs.writeFileSync(p, JSON.stringify(full, null, 2));
  return p;
}

/**
 * Clear cache. opts:
 *   { all: bool, agent: string, expiredOnly: bool, olderThanMs: number }
 *
 * Returns { removed: <count>, kept: <count> }.
 */
function clear(projectRoot, opts = {}) {
  const dir = cacheDir(projectRoot);
  if (!fs.existsSync(dir)) return { removed: 0, kept: 0 };

  let removed = 0;
  let kept = 0;
  const now = Date.now();
  for (const shard of fs.readdirSync(dir)) {
    const shardPath = path.join(dir, shard);
    if (!fs.statSync(shardPath).isDirectory()) continue;
    for (const fname of fs.readdirSync(shardPath)) {
      const fpath = path.join(shardPath, fname);
      let entry;
      try { entry = JSON.parse(fs.readFileSync(fpath, 'utf8')); }
      catch (e) { fs.unlinkSync(fpath); removed++; continue; }
      let shouldRemove = false;
      if (opts.all) shouldRemove = true;
      else if (opts.agent && entry.agent === opts.agent) shouldRemove = true;
      else if (opts.expiredOnly && isExpired(entry, now)) shouldRemove = true;
      else if (opts.olderThanMs && (now - Date.parse(entry.ts)) > opts.olderThanMs) shouldRemove = true;
      if (shouldRemove) { fs.unlinkSync(fpath); removed++; }
      else kept++;
    }
    // Remove empty shard dirs
    if (fs.readdirSync(shardPath).length === 0) fs.rmdirSync(shardPath);
  }
  return { removed, kept };
}

/**
 * Stats: count, total bytes, oldest entry timestamp.
 */
function stats(projectRoot) {
  const dir = cacheDir(projectRoot);
  if (!fs.existsSync(dir)) return { count: 0, totalBytes: 0, oldestTs: null };

  let count = 0;
  let totalBytes = 0;
  let oldestTs = null;
  for (const shard of fs.readdirSync(dir)) {
    const shardPath = path.join(dir, shard);
    if (!fs.statSync(shardPath).isDirectory()) continue;
    for (const fname of fs.readdirSync(shardPath)) {
      const fpath = path.join(shardPath, fname);
      const stat = fs.statSync(fpath);
      totalBytes += stat.size;
      count += 1;
      try {
        const entry = JSON.parse(fs.readFileSync(fpath, 'utf8'));
        if (!oldestTs || entry.ts < oldestTs) oldestTs = entry.ts;
      } catch (e) { /* skip */ }
    }
  }
  return { count, totalBytes, oldestTs };
}

module.exports = {
  cacheDir,
  key,
  get,
  put,
  has,
  clear,
  stats,
  isExpired,
  DEFAULT_TTL_MS
};
