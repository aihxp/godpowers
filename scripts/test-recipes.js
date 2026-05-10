#!/usr/bin/env node
/**
 * Tests for lib/recipes.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const recipes = require('../lib/recipes');
const state = require('../lib/state');

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

console.log('\n  Recipes tests\n');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-recipes-test-'));

test('loadAll returns 30+ recipes', () => {
  recipes.clearCache();
  const all = recipes.loadAll();
  if (all.length < 30) throw new Error(`expected 30+, got ${all.length}`);
});

test('getRecipe finds named recipe', () => {
  recipes.clearCache();
  const r = recipes.getRecipe('greenfield-fast');
  if (!r) throw new Error('not found');
  if (r.metadata.name !== 'greenfield-fast') throw new Error('wrong name');
});

test('getRecipe returns null for unknown', () => {
  recipes.clearCache();
  const r = recipes.getRecipe('nonexistent-recipe');
  if (r !== null) throw new Error('should be null');
});

test('matchIntent matches "production down" to hotfix recipe', () => {
  recipes.clearCache();
  const matches = recipes.matchIntent('production down urgent', tmp);
  if (matches.length === 0) throw new Error('no matches');
  if (matches[0].recipe.metadata.name !== 'production-broken') {
    throw new Error(`expected production-broken, got ${matches[0].recipe.metadata.name}`);
  }
});

test('matchIntent matches "add a new feature" to feature recipes', () => {
  recipes.clearCache();
  const matches = recipes.matchIntent('add a new feature', tmp);
  if (matches.length === 0) throw new Error('no matches');
  // Should match feature-addition category recipes
  const featureMatches = matches.filter(m => m.recipe.metadata.category === 'feature-addition');
  if (featureMatches.length === 0) throw new Error('no feature-addition matches');
});

test('matchIntent matches "update dependencies" to deps recipe', () => {
  recipes.clearCache();
  const matches = recipes.matchIntent('update dependencies', tmp);
  if (matches.length === 0) throw new Error('no matches');
  const top = matches[0].recipe.metadata.name;
  if (top !== 'monthly-deps') throw new Error(`expected monthly-deps, got ${top}`);
});

test('matchIntent ranks exact phrase match high (10+)', () => {
  recipes.clearCache();
  const exact = recipes.matchIntent('production down urgent', tmp);
  if (exact.length === 0) throw new Error('no matches');
  if (exact[0].score < 10) {
    throw new Error(`exact phrase should score 10+, got ${exact[0].score}`);
  }
});

test('matchIntent returns empty for unrelated text', () => {
  recipes.clearCache();
  const matches = recipes.matchIntent('the quick brown fox', tmp);
  if (matches.length > 0) {
    // Some might match due to partial words; that's OK if scores are low
    if (matches[0].score > 5) {
      throw new Error('should not match high for unrelated text');
    }
  }
});

test('suggestForState returns recipes matching state', () => {
  recipes.clearCache();
  // tmp is empty (no .godpowers/), should match no-godpowers-dir recipes
  const suggestions = recipes.suggestForState(tmp);
  const greenfields = suggestions.filter(r => r.metadata.category === 'starting');
  if (greenfields.length === 0) throw new Error('should suggest starting recipes for empty dir');
});

test('suggestForState changes when state changes', () => {
  recipes.clearCache();
  // Init the project
  state.init(tmp, 'recipes-test');
  const s = state.read(tmp);
  s['lifecycle-phase'] = 'steady-state-active';
  state.write(tmp, s);

  const suggestions = recipes.suggestForState(tmp);
  // Now should match steady-state recipes (production-broken, weekly-health-check, etc.)
  const steadyState = suggestions.filter(r => {
    const conds = (r.triggers && r.triggers['state-conditions']) || [];
    return conds.some(c => c.includes('steady-state'));
  });
  if (steadyState.length === 0) throw new Error('should suggest steady-state recipes');
});

test('getSequence returns the default sequence steps', () => {
  recipes.clearCache();
  const r = recipes.getRecipe('greenfield-fast');
  const steps = recipes.getSequence(r);
  if (steps.length === 0) throw new Error('no steps');
  if (steps[0].command !== '/god-mode') throw new Error('first step should be /god-mode');
});

test('listByCategory returns recipes in that category', () => {
  recipes.clearCache();
  const featureRecipes = recipes.listByCategory('feature-addition');
  if (featureRecipes.length < 5) throw new Error(`expected 5+ feature recipes, got ${featureRecipes.length}`);
});

test('categories includes all expected', () => {
  recipes.clearCache();
  const cats = recipes.categories();
  for (const expected of ['starting', 'feature-addition', 'production', 'maintaining', 'recovering', 'collaborating', 'knowledge', 'meta']) {
    if (!cats.includes(expected)) throw new Error(`missing category: ${expected}`);
  }
});

test('all recipes have apiVersion: godpowers/v1', () => {
  recipes.clearCache();
  const all = recipes.loadAll();
  for (const r of all) {
    if (r.apiVersion !== 'godpowers/v1') {
      throw new Error(`${r.metadata && r.metadata.name} has wrong apiVersion`);
    }
  }
});

test('all recipes have at least one keyword', () => {
  recipes.clearCache();
  const all = recipes.loadAll();
  for (const r of all) {
    const kws = (r.triggers && r.triggers['intent-keywords']) || [];
    if (kws.length === 0) throw new Error(`${r.metadata && r.metadata.name} has no keywords`);
  }
});

test('all recipes have at least one sequence step', () => {
  recipes.clearCache();
  const all = recipes.loadAll();
  for (const r of all) {
    const steps = recipes.getSequence(r);
    if (steps.length === 0) throw new Error(`${r.metadata && r.metadata.name} has no sequence steps`);
  }
});

// Cleanup
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
