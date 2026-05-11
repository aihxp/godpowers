/**
 * Cost Tracker - token + dollar accounting for godpowers runs.
 *
 * The model.call event already exists in the vocabulary. This module
 * adds a typed recorder, per-tier / per-agent / per-model aggregation,
 * and a savings counter (cache hits = tokens that would have been
 * spent but weren't).
 *
 * Token costs surface in two places:
 *   1. Real spend: every LLM call records tokens_in / tokens_out / cost_usd
 *   2. Avoided spend: cache.hit events record savings_tokens / savings_usd
 *
 * Public API:
 *   recordCost(handle, attrs) - emit a cost.recorded event
 *   recordCacheHit(handle, attrs) - emit a cache.hit event with savings
 *   recordCacheMiss(handle, attrs) - emit a cache.miss event
 *   aggregate(projectRoot, runIds?) -> { perTier, perAgent, perModel, totals }
 *   priceTokens({model, in, out}) -> usd estimate
 *
 * Pricing table is approximate, in USD per 1M tokens, May 2026 ballpark.
 * Overridable via opts.pricing in aggregate().
 */

const events = require('./events');

const DEFAULT_PRICING = {
  // Per 1M tokens (input, output). Keep approximate; user can override.
  'claude-3-5-sonnet':     { in: 3.00,  out: 15.00 },
  'claude-3-5-haiku':      { in: 0.80,  out: 4.00 },
  'claude-3-opus':         { in: 15.00, out: 75.00 },
  'claude-4':              { in: 5.00,  out: 25.00 },     // estimate
  'gpt-4o':                { in: 2.50,  out: 10.00 },
  'gpt-4o-mini':           { in: 0.15,  out: 0.60 },
  'gpt-4-turbo':           { in: 10.00, out: 30.00 },
  'gpt-5':                 { in: 5.00,  out: 20.00 },     // estimate
  'gemini-1.5-pro':        { in: 3.50,  out: 10.50 },
  'gemini-1.5-flash':      { in: 0.075, out: 0.30 },
  'o1':                    { in: 15.00, out: 60.00 },
  'o3-mini':               { in: 3.00,  out: 12.00 },
  // Fallback bucket
  '_unknown':              { in: 5.00,  out: 15.00 }
};

/**
 * Compute USD cost from token counts.
 */
function priceTokens({ model, in: inTok, out: outTok, pricing }) {
  const table = pricing || DEFAULT_PRICING;
  const p = table[model] || table[normalizeModel(model)] || table._unknown;
  const inCost  = (inTok || 0)  * p.in  / 1_000_000;
  const outCost = (outTok || 0) * p.out / 1_000_000;
  return Number((inCost + outCost).toFixed(6));
}

function normalizeModel(m) {
  if (!m) return '_unknown';
  const s = String(m).toLowerCase();
  // Order matters: "gemini" contains "mini" as a substring, and "claude" can
  // contain "o" etc. Check the most specific tokens first.
  if (s.includes('haiku')) return 'claude-3-5-haiku';
  if (s.includes('sonnet')) return 'claude-3-5-sonnet';
  if (s.includes('opus')) return 'claude-3-opus';
  if (s.includes('flash')) return 'gemini-1.5-flash';
  if (s.includes('gemini')) return 'gemini-1.5-pro';
  if (s.includes('claude')) return 'claude-4';
  if (s.includes('4o-mini') || s.endsWith('-mini')) return 'gpt-4o-mini';
  if (s.includes('4o')) return 'gpt-4o';
  if (s.includes('gpt-5') || s === 'gpt5') return 'gpt-5';
  if (s.includes('gpt-4') || s === 'gpt4') return 'gpt-4-turbo';
  if (s.includes('o3')) return 'o3-mini';
  if (s.includes('o1')) return 'o1';
  return '_unknown';
}

/**
 * Record a real cost (spend that happened). The caller has a handle
 * from events.startRun.
 *
 * attrs: { model, tokens_in, tokens_out, agent?, tier?, cost_usd? (optional override) }
 */
function recordCost(handle, attrs) {
  const cost_usd = attrs.cost_usd != null
    ? attrs.cost_usd
    : priceTokens({ model: attrs.model, in: attrs.tokens_in, out: attrs.tokens_out, pricing: attrs.pricing });
  handle.emit({
    span_id: attrs.span_id || handle.rootSpanId,
    name: 'cost.recorded',
    attrs: {
      model: attrs.model,
      tokens_in: attrs.tokens_in || 0,
      tokens_out: attrs.tokens_out || 0,
      cost_usd,
      agent: attrs.agent,
      tier: attrs.tier
    }
  });
  return cost_usd;
}

/**
 * Record a cache hit. Estimates the savings as what the spend would
 * have been if the agent had been spawned.
 */
function recordCacheHit(handle, attrs) {
  const savings_usd = attrs.savings_usd != null
    ? attrs.savings_usd
    : priceTokens({
        model: attrs.model,
        in: attrs.would_have_spent_in || 0,
        out: attrs.would_have_spent_out || 0,
        pricing: attrs.pricing
      });
  handle.emit({
    span_id: attrs.span_id || handle.rootSpanId,
    name: 'cache.hit',
    attrs: {
      cache_key: attrs.cache_key,
      agent: attrs.agent,
      tier: attrs.tier,
      model: attrs.model,
      savings_tokens: (attrs.would_have_spent_in || 0) + (attrs.would_have_spent_out || 0),
      savings_usd
    }
  });
  return savings_usd;
}

function recordCacheMiss(handle, attrs) {
  handle.emit({
    span_id: attrs.span_id || handle.rootSpanId,
    name: 'cache.miss',
    attrs: {
      cache_key: attrs.cache_key,
      agent: attrs.agent,
      tier: attrs.tier,
      reason: attrs.reason || 'no-entry'
    }
  });
}

/**
 * Aggregate cost events across one or all runs.
 *
 * Returns:
 *   {
 *     totals: {
 *       spent_usd, spent_tokens, saved_usd, saved_tokens,
 *       cache_hits, cache_misses, hit_rate, calls
 *     },
 *     perTier: { 'tier-1': {spent_usd, spent_tokens, calls, ...}, ... },
 *     perAgent: { 'god-pm': {...}, ... },
 *     perModel: { 'claude-3-5-sonnet': {...}, ... }
 *   }
 */
function aggregate(projectRoot, runIds) {
  if (!runIds) runIds = events.listRuns(projectRoot);
  if (!Array.isArray(runIds)) runIds = [runIds];

  const totals = {
    spent_usd: 0, spent_tokens: 0,
    saved_usd: 0, saved_tokens: 0,
    cache_hits: 0, cache_misses: 0, hit_rate: 0,
    calls: 0
  };
  const perTier = {};
  const perAgent = {};
  const perModel = {};

  function bump(bucket, key, fields) {
    if (!bucket[key]) {
      bucket[key] = { spent_usd: 0, spent_tokens: 0, saved_usd: 0,
                      saved_tokens: 0, calls: 0, cache_hits: 0 };
    }
    for (const [k, v] of Object.entries(fields)) {
      bucket[key][k] = (bucket[key][k] || 0) + v;
    }
  }

  for (const runId of runIds) {
    for (const e of events.readRun(projectRoot, runId)) {
      if (e.name === 'cost.recorded') {
        const a = e.attrs || {};
        const usd = a.cost_usd || 0;
        const tok = (a.tokens_in || 0) + (a.tokens_out || 0);
        totals.spent_usd += usd;
        totals.spent_tokens += tok;
        totals.calls += 1;
        if (a.tier)   bump(perTier,   a.tier,   { spent_usd: usd, spent_tokens: tok, calls: 1 });
        if (a.agent)  bump(perAgent,  a.agent,  { spent_usd: usd, spent_tokens: tok, calls: 1 });
        if (a.model)  bump(perModel,  a.model,  { spent_usd: usd, spent_tokens: tok, calls: 1 });
      } else if (e.name === 'cache.hit') {
        const a = e.attrs || {};
        const usd = a.savings_usd || 0;
        const tok = a.savings_tokens || 0;
        totals.saved_usd += usd;
        totals.saved_tokens += tok;
        totals.cache_hits += 1;
        if (a.tier)  bump(perTier,  a.tier,  { saved_usd: usd, saved_tokens: tok, cache_hits: 1 });
        if (a.agent) bump(perAgent, a.agent, { saved_usd: usd, saved_tokens: tok, cache_hits: 1 });
      } else if (e.name === 'cache.miss') {
        totals.cache_misses += 1;
      }
    }
  }

  const attempts = totals.cache_hits + totals.cache_misses;
  totals.hit_rate = attempts > 0 ? totals.cache_hits / attempts : 0;
  for (const m of ['spent_usd', 'saved_usd']) {
    totals[m] = Number(totals[m].toFixed(6));
  }

  return { totals, perTier, perAgent, perModel };
}

/**
 * Format an aggregate as a readable report.
 */
function formatReport(agg) {
  const t = agg.totals;
  const lines = [];
  lines.push('GODPOWERS COST REPORT');
  lines.push('');
  lines.push(`Spent: $${t.spent_usd.toFixed(4)} across ${t.calls} model calls (${t.spent_tokens} tokens)`);
  lines.push(`Saved: $${t.saved_usd.toFixed(4)} via ${t.cache_hits} cache hits (${t.saved_tokens} tokens)`);
  lines.push(`Cache hit rate: ${(t.hit_rate * 100).toFixed(1)}% (${t.cache_hits}/${t.cache_hits + t.cache_misses})`);
  lines.push('');
  if (Object.keys(agg.perTier).length > 0) {
    lines.push('Per tier:');
    for (const [k, v] of Object.entries(agg.perTier).sort()) {
      lines.push(`  ${k}: $${v.spent_usd.toFixed(4)} (${v.calls} calls, ${v.cache_hits} hits, $${v.saved_usd.toFixed(4)} saved)`);
    }
    lines.push('');
  }
  if (Object.keys(agg.perAgent).length > 0) {
    lines.push('Per agent (top 10 by spend):');
    const sorted = Object.entries(agg.perAgent)
      .sort((a, b) => b[1].spent_usd - a[1].spent_usd)
      .slice(0, 10);
    for (const [k, v] of sorted) {
      lines.push(`  ${k}: $${v.spent_usd.toFixed(4)} (${v.calls} calls)`);
    }
    lines.push('');
  }
  if (Object.keys(agg.perModel).length > 0) {
    lines.push('Per model:');
    for (const [k, v] of Object.entries(agg.perModel).sort()) {
      lines.push(`  ${k}: $${v.spent_usd.toFixed(4)} (${v.calls} calls)`);
    }
  }
  return lines.join('\n');
}

module.exports = {
  recordCost,
  recordCacheHit,
  recordCacheMiss,
  aggregate,
  formatReport,
  priceTokens,
  normalizeModel,
  DEFAULT_PRICING
};
