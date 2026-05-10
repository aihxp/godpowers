#!/usr/bin/env node
/**
 * Behavioral tests for lib/awesome-design.js (VoltAgent catalog integration).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ad = require('../lib/awesome-design');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  + ${name}`);
    passed++;
  } catch (e) {
    console.error(`  x ${name}: ${e.message}`);
    failed++;
  }
}

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-awesome-test-'));
}

console.log('\n  awesome-design catalog integration tests\n');

// ============================================================================
// catalog
// ============================================================================

test('CATALOG has 71 entries', () => {
  if (ad.CATALOG.length !== 71) throw new Error(`expected 71, got ${ad.CATALOG.length}`);
});

test('every catalog entry has slug, displayName, category, aliases', () => {
  for (const entry of ad.CATALOG) {
    if (!entry.slug) throw new Error(`missing slug: ${JSON.stringify(entry)}`);
    if (!entry.displayName) throw new Error(`missing displayName: ${entry.slug}`);
    if (!entry.category) throw new Error(`missing category: ${entry.slug}`);
    if (!Array.isArray(entry.aliases)) throw new Error(`missing aliases: ${entry.slug}`);
  }
});

test('list() returns entries with rawUrl and previewUrl', () => {
  const items = ad.list();
  if (items.length !== 71) throw new Error(`expected 71`);
  if (!items[0].rawUrl) throw new Error('rawUrl missing');
  if (!items[0].rawUrl.includes('raw.githubusercontent.com')) throw new Error('rawUrl wrong host');
  if (!items[0].previewUrl) throw new Error('previewUrl missing');
});

// ============================================================================
// lookupSite
// ============================================================================

test('lookupSite finds Linear by display name', () => {
  const r = ad.lookupSite('Linear');
  if (!r) throw new Error('Linear not found');
  if (r.slug !== 'linear.app') throw new Error('wrong slug');
});

test('lookupSite finds Stripe by display name', () => {
  const r = ad.lookupSite('Stripe');
  if (!r || r.slug !== 'stripe') throw new Error('Stripe not found');
});

test('lookupSite is case-insensitive', () => {
  const r1 = ad.lookupSite('LINEAR');
  const r2 = ad.lookupSite('linear');
  if (!r1 || !r2) throw new Error('case sensitivity broken');
  if (r1.slug !== r2.slug) throw new Error('different slugs');
});

test('lookupSite finds aliases (mistral, mistralai)', () => {
  const r1 = ad.lookupSite('Mistral');
  const r2 = ad.lookupSite('MistralAI');
  if (!r1 || !r2) throw new Error('alias not found');
  if (r1.slug !== 'mistral.ai') throw new Error('wrong slug');
  if (r2.slug !== 'mistral.ai') throw new Error('wrong slug');
});

test('lookupSite finds slug forms with dots', () => {
  const r = ad.lookupSite('linear.app');
  if (!r || r.slug !== 'linear.app') throw new Error('slug form not matched');
});

test('lookupSite returns null for unknown', () => {
  if (ad.lookupSite('NotARealSite') !== null) throw new Error('false positive');
});

// ============================================================================
// extractSiteReferences
// ============================================================================

test('extractSiteReferences finds direct mention', () => {
  const text = 'We want our app to feel like Linear, with the same precision.';
  const refs = ad.extractSiteReferences(text);
  if (!refs.find(r => r.slug === 'linear.app')) throw new Error('Linear not found');
});

test('extractSiteReferences finds multiple sites in same text', () => {
  const text = 'Like Linear for layout, but with Stripe purple gradients.';
  const refs = ad.extractSiteReferences(text);
  if (!refs.find(r => r.slug === 'linear.app')) throw new Error('Linear missed');
  if (!refs.find(r => r.slug === 'stripe')) throw new Error('Stripe missed');
});

test('extractSiteReferences deduplicates same site', () => {
  const text = 'Linear is our reference. We love Linear. Linear-style.';
  const refs = ad.extractSiteReferences(text);
  const linearMatches = refs.filter(r => r.slug === 'linear.app');
  if (linearMatches.length !== 1) throw new Error(`expected 1 Linear, got ${linearMatches.length}`);
});

test('extractSiteReferences ignores partial matches at word boundaries', () => {
  const text = 'I like the term "minimalism" but not minimalist.';
  // Should NOT match anything; "minimalism" doesn't equal a site
  const refs = ad.extractSiteReferences(text);
  // None of our slugs should match
  if (refs.length !== 0) {
    throw new Error(`expected 0 matches, got ${refs.length}: ${refs.map(r => r.displayName)}`);
  }
});

test('extractSiteReferences finds Apple', () => {
  const text = 'Apple-style minimalism with white space.';
  const refs = ad.extractSiteReferences(text);
  if (!refs.find(r => r.slug === 'apple')) throw new Error('Apple missed');
});

test('extractSiteReferences includes rawUrl in results', () => {
  const refs = ad.extractSiteReferences('we like Linear');
  if (!refs[0].rawUrl) throw new Error('rawUrl missing');
});

// ============================================================================
// suggestByBrandHints
// ============================================================================

test('suggestByBrandHints suggests Linear/Vercel for "minimal dark dev"', () => {
  const sugs = ad.suggestByBrandHints('minimal dark dev tool');
  if (!sugs.find(s => s.slug === 'linear.app')) throw new Error('Linear missing');
});

test('suggestByBrandHints suggests Stripe/Wise for "fintech payment"', () => {
  const sugs = ad.suggestByBrandHints('fintech payment app');
  if (!sugs.find(s => s.slug === 'stripe')) throw new Error('Stripe missing');
});

test('suggestByBrandHints returns empty for unrelated text', () => {
  const sugs = ad.suggestByBrandHints('random unrelated text about gardening');
  if (sugs.length !== 0) throw new Error('false positive suggestions');
});

// ============================================================================
// cache + fetch
// ============================================================================

test('cachePath returns expected location', () => {
  const tmp = mkTmp();
  const p = ad.cachePath(tmp, 'linear.app');
  if (!p.includes('.godpowers/cache/awesome-design/linear.app.md')) {
    throw new Error('cache path wrong');
  }
});

test('isCached returns false initially', () => {
  const tmp = mkTmp();
  if (ad.isCached(tmp, 'linear.app')) throw new Error('false positive');
});

test('fetchDesign returns cached content when available', async () => {
  const tmp = mkTmp();
  const cachePath = ad.cachePath(tmp, 'test-fake');
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, '---\nname: cached test\n---\n## Overview');
  const r = await ad.fetchDesign(tmp, 'test-fake');
  if (!r.cached) throw new Error('should be cached');
  if (!r.content.includes('cached test')) throw new Error('wrong content');
});

// ============================================================================
// normalize
// ============================================================================

test('normalize strips whitespace and punctuation', () => {
  if (ad.normalize('Linear.app') !== 'linearapp') throw new Error(`got ${ad.normalize('Linear.app')}`);
  if (ad.normalize('  Linear ') !== 'linear') throw new Error('whitespace not trimmed');
  if (ad.normalize('X.AI') !== 'xai') throw new Error('xai normalization');
});

test('normalize handles empty', () => {
  if (ad.normalize(null) !== '') throw new Error('null');
  if (ad.normalize('') !== '') throw new Error('empty');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
