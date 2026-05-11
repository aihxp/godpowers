/**
 * State Lock - cooperative advisory locking for state.json mutations.
 *
 * Contract (from ARCHITECTURE.md "Concurrency contract"):
 *   - Reads are lock-free.
 *   - Writes acquire a lock before mutating, release on completion.
 *   - Lock has a `scope` (e.g. `tier-1.arch`, `linkage`, `all`).
 *     Concurrent writers with non-overlapping scopes may run.
 *   - Stale locks (past `expires`) are reclaimable by any actor;
 *     reclaim emits state.repair with previous holder recorded.
 *
 * The lock lives in state.json under the `lock` key. Acquiring writes
 * { holder, acquired, expires, scope }. Releasing sets lock to null.
 *
 * Scope conflict rules:
 *   - 'all' conflicts with everything.
 *   - 'tier-N.substep' conflicts with another 'tier-N.substep' on same
 *     substep AND with 'all'. Does NOT conflict with 'tier-M.substep'
 *     where M != N.
 *   - 'linkage' conflicts with 'linkage' and 'all'.
 *   - Any custom scope: exact-match conflict only (plus 'all').
 *
 * Public API:
 *   acquire(projectRoot, opts) -> { acquired: true, lock } | { acquired: false, reason, holder }
 *   release(projectRoot, holder) -> { released: bool }
 *   peek(projectRoot) -> lock | null
 *   isStale(lock, nowMs?) -> bool
 *   reclaim(projectRoot, holder) -> { reclaimed: bool, previousHolder? }
 *   scopesConflict(a, b) -> bool
 */

const fs = require('fs');
const path = require('path');

const state = require('./state');

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

function nowIso(offsetMs) {
  const d = offsetMs ? new Date(Date.now() + offsetMs) : new Date();
  return d.toISOString();
}

function peek(projectRoot) {
  const s = state.read(projectRoot);
  return s ? (s.lock || null) : null;
}

/**
 * Return true if the lock is past its `expires` time (or null/malformed).
 */
function isStale(lock, nowMs) {
  if (!lock || !lock.expires) return true;
  const t = (nowMs != null ? nowMs : Date.now());
  const exp = Date.parse(lock.expires);
  return Number.isFinite(exp) ? t > exp : true;
}

/**
 * Determine whether two scopes conflict.
 */
function scopesConflict(a, b) {
  if (!a || !b) return false;
  if (a === 'all' || b === 'all') return true;
  return a === b;
}

/**
 * Try to acquire a lock.
 *
 * opts: { holder (required), scope (default 'all'), ttlMs (default 5min), force }
 *
 * Returns { acquired: true, lock } on success.
 * Returns { acquired: false, reason, holder, scope } on conflict.
 *
 * Reentrant: same holder can re-acquire. If the existing lock is stale,
 * it is silently reclaimed.
 */
function acquire(projectRoot, opts = {}) {
  if (!opts.holder) throw new Error('holder is required');
  const scope = opts.scope || 'all';
  const ttlMs = opts.ttlMs || DEFAULT_TTL_MS;

  const s = state.read(projectRoot);
  if (!s) throw new Error('state.json not initialized');

  const existing = s.lock || null;

  if (existing && !isStale(existing) && !opts.force) {
    // Reentrant: same holder + compatible scope -> refresh expiration
    if (existing.holder === opts.holder &&
        (existing.scope === scope || existing.scope === 'all' || scope === 'all')) {
      existing.expires = nowIso(ttlMs);
      s.lock = existing;
      state.write(projectRoot, s);
      return { acquired: true, lock: existing, reentrant: true };
    }
    if (scopesConflict(existing.scope || 'all', scope)) {
      return {
        acquired: false,
        reason: 'held',
        holder: existing.holder,
        scope: existing.scope,
        expires: existing.expires
      };
    }
    // Compatible scopes: layered lock. We support a simple single-lock
    // slot for now, so reject and tell the caller. Multi-lock support
    // can be added when there's a real second writer.
    return {
      acquired: false,
      reason: 'scope-coexistence-not-supported',
      holder: existing.holder,
      scope: existing.scope
    };
  }

  // existing is null OR stale OR force -> take it
  const lock = {
    holder: opts.holder,
    acquired: nowIso(),
    expires: nowIso(ttlMs),
    scope
  };
  const reclaimedFrom = existing && isStale(existing) ? existing.holder : null;
  s.lock = lock;
  state.write(projectRoot, s);
  return {
    acquired: true,
    lock,
    reclaimed: reclaimedFrom != null,
    reclaimedFrom
  };
}

/**
 * Release a held lock. Only the current holder can release.
 *
 * Returns { released: true } on success, { released: false, reason } otherwise.
 */
function release(projectRoot, holder) {
  if (!holder) throw new Error('holder is required');
  const s = state.read(projectRoot);
  if (!s) return { released: false, reason: 'no-state' };
  const lock = s.lock;
  if (!lock) return { released: false, reason: 'no-lock' };
  if (lock.holder !== holder) {
    return { released: false, reason: 'wrong-holder', heldBy: lock.holder };
  }
  s.lock = null;
  state.write(projectRoot, s);
  return { released: true, releasedAt: nowIso() };
}

/**
 * Force-reclaim a stale lock. Used by /god-repair.
 * Returns { reclaimed, previousHolder? }.
 */
function reclaim(projectRoot, holder) {
  const s = state.read(projectRoot);
  if (!s) return { reclaimed: false, reason: 'no-state' };
  const lock = s.lock;
  if (!lock) return { reclaimed: false, reason: 'no-lock' };
  if (!isStale(lock)) {
    return { reclaimed: false, reason: 'lock-not-stale', expires: lock.expires };
  }
  const prev = lock.holder;
  s.lock = null;
  state.write(projectRoot, s);
  return { reclaimed: true, previousHolder: prev };
}

/**
 * Convenience wrapper: run an async function under a lock.
 * Acquires, runs, releases.
 */
async function withLock(projectRoot, opts, fn) {
  const r = acquire(projectRoot, opts);
  if (!r.acquired) {
    const err = new Error(`lock unavailable: held by ${r.holder} (scope=${r.scope})`);
    err.code = 'LOCK_UNAVAILABLE';
    err.detail = r;
    throw err;
  }
  try {
    return await fn(r.lock);
  } finally {
    release(projectRoot, opts.holder);
  }
}

module.exports = {
  acquire,
  release,
  peek,
  isStale,
  reclaim,
  withLock,
  scopesConflict,
  DEFAULT_TTL_MS
};
