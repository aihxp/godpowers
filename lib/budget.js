/**
 * Budget Helper - apply/disable/read the intent.yaml budgets block.
 *
 * Used by /god-budget (and any tool that wants programmatic access).
 *
 * The budgets block lives at `.godpowers/intent.yaml > budgets`. This
 * module reads + mutates that block via a minimal YAML round-trip
 * implemented on top of lib/intent.js for reads. Writes use a
 * simple block-style serializer; comments outside the budgets block
 * are preserved.
 *
 * Public API:
 *   defaults() -> recommended values
 *   read(projectRoot) -> budgets object | null
 *   applyOn(projectRoot) -> { applied, budgets }
 *   applyOff(projectRoot) -> { applied: bool, hadBudgets: bool }
 *   set(projectRoot, partial) -> merged budgets
 *   summary(budgets) -> string for display
 */

const fs = require('fs');
const path = require('path');

const intent = require('./intent');

const DEFAULTS = {
  'default-max-tokens': 80000,
  'model-profile': 'standard',
  cache: true,
  'cache-ttl-hours': 24
};

function defaults() {
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function intentPath(projectRoot) {
  return path.join(projectRoot, '.godpowers', 'intent.yaml');
}

/**
 * Read the budgets block. Returns null when intent.yaml is missing,
 * empty object when present but no budgets block.
 */
function read(projectRoot) {
  const i = intent.read(projectRoot);
  if (!i) return null;
  return i.budgets || {};
}

/**
 * Write a full budgets block, replacing any existing one. Preserves
 * all other intent.yaml content via text-level surgery (not a full
 * YAML round-trip).
 */
function writeBlock(projectRoot, newBudgets) {
  const file = intentPath(projectRoot);
  fs.mkdirSync(path.dirname(file), { recursive: true });

  let raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!raw.trim()) {
    // Bootstrap a minimal intent.yaml
    raw = 'apiVersion: godpowers/v1\nkind: Project\nmetadata:\n  name: unnamed\nmode: A\nscale: small\n';
  }

  const yaml = newBudgets ? renderBudgets(newBudgets) : '';
  const stripped = stripBudgets(raw);
  const out = stripped.endsWith('\n') ? stripped + yaml : stripped + '\n' + yaml;
  fs.writeFileSync(file, out);
  return out;
}

/**
 * Strip an existing budgets block from raw intent.yaml text.
 */
function stripBudgets(raw) {
  const lines = raw.split('\n');
  const out = [];
  let inBudgets = false;
  for (const line of lines) {
    if (/^budgets\s*:/.test(line)) { inBudgets = true; continue; }
    if (inBudgets) {
      // End of block when we hit a non-indented non-empty line
      if (/^\S/.test(line)) { inBudgets = false; out.push(line); continue; }
      // Skip block lines
      continue;
    }
    out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * Render a budgets block as YAML text. Handles the canonical shape:
 *
 *   budgets:
 *     default-max-tokens: 80000
 *     model-profile: standard
 *     cache: true
 *     cache-ttl-hours: 24
 *     agents:
 *       god-architect:
 *         max-tokens: 120000
 */
function renderBudgets(b) {
  const lines = ['budgets:'];
  for (const k of ['default-max-tokens', 'model-profile', 'cache', 'cache-ttl-hours']) {
    if (b[k] !== undefined) lines.push(`  ${k}: ${formatValue(b[k])}`);
  }
  if (b.agents && Object.keys(b.agents).length > 0) {
    lines.push('  agents:');
    for (const [name, override] of Object.entries(b.agents)) {
      lines.push(`    ${name}:`);
      for (const [k, v] of Object.entries(override)) {
        lines.push(`      ${k}: ${formatValue(v)}`);
      }
    }
  }
  return lines.join('\n') + '\n';
}

function formatValue(v) {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  // String: quote only if it contains special chars
  const s = String(v);
  if (/[:#\s]/.test(s)) return JSON.stringify(s);
  return s;
}

/**
 * Apply the recommended defaults (the "--on" path). Idempotent.
 *
 * If a budgets block already exists with all keys set, no-op.
 * Otherwise merge defaults onto the existing block.
 */
function applyOn(projectRoot) {
  const current = read(projectRoot) || {};
  const merged = { ...defaults(), ...current };
  // Always force cache: true on --on
  merged.cache = true;
  writeBlock(projectRoot, merged);
  return { applied: true, budgets: merged };
}

/**
 * Remove the entire budgets block (the "--off" path).
 *
 * Cache files on disk are not removed (use /god-cache-clear to free
 * space). Subsequent runs use built-in defaults: no cap, no cache.
 */
function applyOff(projectRoot) {
  const had = read(projectRoot);
  const hadAny = had && Object.keys(had).length > 0;
  writeBlock(projectRoot, null);
  return { applied: true, hadBudgets: !!hadAny };
}

/**
 * Update a subset of fields. Examples:
 *   set(root, { 'default-max-tokens': 60000 })
 *   set(root, { agents: { 'god-pm': { 'max-tokens': 100000 } } })
 */
function set(projectRoot, partial) {
  const current = read(projectRoot) || {};
  const merged = { ...current };
  for (const [k, v] of Object.entries(partial)) {
    if (k === 'agents') {
      merged.agents = { ...(current.agents || {}), ...v };
    } else {
      merged[k] = v;
    }
  }
  writeBlock(projectRoot, merged);
  return merged;
}

/**
 * Plain-English summary for the /god-budget no-arg view.
 */
function summary(budgets) {
  if (!budgets || Object.keys(budgets).length === 0) {
    return 'Budgets: not configured. Built-in defaults apply (no cap, no cache).\n' +
           'Enable with /god-budget --on';
  }
  const lines = ['GODPOWERS BUDGETS', ''];
  lines.push(`  Max input tokens per agent: ${budgets['default-max-tokens'] || '(none)'}`);
  lines.push(`  Model profile: ${budgets['model-profile'] || 'standard'}`);
  lines.push(`  Cache: ${budgets.cache ? 'on' : 'off'}`);
  if (budgets['cache-ttl-hours']) {
    lines.push(`  Cache TTL: ${budgets['cache-ttl-hours']} hours`);
  }
  if (budgets.agents && Object.keys(budgets.agents).length > 0) {
    lines.push('');
    lines.push('  Per-agent overrides:');
    for (const [name, ov] of Object.entries(budgets.agents)) {
      const bits = Object.entries(ov).map(([k, v]) => `${k}=${v}`).join(', ');
      lines.push(`    ${name}: ${bits}`);
    }
  }
  return lines.join('\n');
}

module.exports = {
  defaults,
  read,
  applyOn,
  applyOff,
  set,
  summary,
  writeBlock,
  stripBudgets,
  renderBudgets,
  DEFAULTS
};
