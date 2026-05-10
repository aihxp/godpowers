/**
 * Event Reader
 *
 * Reads events.jsonl files and produces three views:
 *   - timeline(runId): chronological readable summary
 *   - metrics(runId | runIds): per-tier durations, pauses, retries
 *   - trace(runId, tier): deep dive on one tier's events
 *
 * Companion to lib/events.js which is the writer.
 *
 * Public API:
 *   readAll(projectRoot, runId) -> Event[]
 *   timeline(projectRoot, runId, opts) -> string (formatted) or rows array
 *   metrics(projectRoot, runIds | null) -> { perTier, totals }
 *   trace(projectRoot, runId, tier) -> Event[] (filtered)
 *   summarize(events) -> { agentCount, pauseCount, errorCount, durationMs }
 */

const fs = require('fs');
const path = require('path');

const events = require('./events');

function readAll(projectRoot, runId) {
  return events.readRun(projectRoot, runId);
}

/**
 * Render events as a readable timeline.
 *
 * opts: { limit, since (ISO), filter (event-name regex) }
 *
 * Returns an array of { ts, name, attrs, durationMs? } rows.
 */
function timeline(projectRoot, runId, opts = {}) {
  const all = readAll(projectRoot, runId);
  let rows = all;
  if (opts.since) {
    rows = rows.filter(e => e.ts >= opts.since);
  }
  if (opts.filter) {
    const re = new RegExp(opts.filter);
    rows = rows.filter(e => re.test(e.name));
  }
  if (opts.limit) rows = rows.slice(-opts.limit);

  // Pair agent.start / agent.end to compute durations
  const startMap = new Map();
  const result = rows.map(e => {
    const row = { ts: e.ts, name: e.name, attrs: e.attrs || {} };
    if (e.name === 'agent.start') {
      startMap.set(e.span_id, new Date(e.ts).getTime());
    }
    if (e.name === 'agent.end') {
      const start = startMap.get(e.span_id);
      if (start) row.durationMs = new Date(e.ts).getTime() - start;
    }
    return row;
  });
  return result;
}

/**
 * Format a timeline as a human-readable string.
 */
function formatTimeline(rows) {
  return rows.map(r => {
    const dur = r.durationMs != null ? ` (${(r.durationMs / 1000).toFixed(2)}s)` : '';
    const tier = r.attrs.tier ? ` [${r.attrs.tier}]` : '';
    const agent = r.attrs.agent ? ` ${r.attrs.agent}` : '';
    return `${r.ts} ${r.name}${tier}${agent}${dur}`;
  }).join('\n');
}

/**
 * Compute per-tier metrics across one or all runs.
 *
 * If runIds is null, walks every run in the project.
 *
 * Returns:
 *   {
 *     perTier: {
 *       'tier-1': { count, totalMs, avgMs, pauseCount, errorCount },
 *       ...
 *     },
 *     totals: { runs, agents, pauses, errors, totalMs }
 *   }
 */
function metrics(projectRoot, runIds) {
  if (!runIds) runIds = events.listRuns(projectRoot);
  if (!Array.isArray(runIds)) runIds = [runIds];

  const perTier = {};
  const totals = { runs: runIds.length, agents: 0, pauses: 0, errors: 0, totalMs: 0 };

  for (const runId of runIds) {
    const all = readAll(projectRoot, runId);
    const starts = new Map();
    for (const e of all) {
      const tier = (e.attrs && e.attrs.tier) || 'unknown';
      if (!perTier[tier]) {
        perTier[tier] = { count: 0, totalMs: 0, pauseCount: 0, errorCount: 0 };
      }
      if (e.name === 'agent.start') {
        starts.set(e.span_id, { tier, ts: new Date(e.ts).getTime() });
      }
      if (e.name === 'agent.end') {
        const s = starts.get(e.span_id);
        if (s) {
          const dur = new Date(e.ts).getTime() - s.ts;
          perTier[s.tier].count += 1;
          perTier[s.tier].totalMs += dur;
          totals.agents += 1;
          totals.totalMs += dur;
        }
      }
      if (e.name === 'agent.pause') {
        perTier[tier].pauseCount += 1;
        totals.pauses += 1;
      }
      if (e.name === 'error') {
        perTier[tier].errorCount += 1;
        totals.errors += 1;
      }
    }
  }

  for (const t of Object.keys(perTier)) {
    const p = perTier[t];
    p.avgMs = p.count > 0 ? Math.round(p.totalMs / p.count) : 0;
  }
  return { perTier, totals };
}

/**
 * Filter events for one tier across a run.
 */
function trace(projectRoot, runId, tier) {
  return readAll(projectRoot, runId).filter(e =>
    e.attrs && e.attrs.tier === tier
  );
}

function summarize(eventList) {
  const summary = { agentCount: 0, pauseCount: 0, errorCount: 0, durationMs: 0 };
  const starts = new Map();
  let firstTs = null, lastTs = null;
  for (const e of eventList) {
    if (!firstTs || e.ts < firstTs) firstTs = e.ts;
    if (!lastTs || e.ts > lastTs) lastTs = e.ts;
    if (e.name === 'agent.start') {
      starts.set(e.span_id, new Date(e.ts).getTime());
    }
    if (e.name === 'agent.end') {
      const s = starts.get(e.span_id);
      if (s) summary.agentCount += 1;
    }
    if (e.name === 'agent.pause') summary.pauseCount += 1;
    if (e.name === 'error') summary.errorCount += 1;
  }
  if (firstTs && lastTs) {
    summary.durationMs = new Date(lastTs).getTime() - new Date(firstTs).getTime();
  }
  return summary;
}

module.exports = {
  readAll,
  timeline,
  formatTimeline,
  metrics,
  trace,
  summarize
};
