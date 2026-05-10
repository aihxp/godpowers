/**
 * Intent Manager
 *
 * Read .godpowers/intent.yaml. Validate basic structure.
 *
 * Note: this is a minimal YAML reader, intentionally avoiding a YAML
 * dependency. Handles the subset of YAML our intent files use.
 * For complex YAML, agents read the file directly.
 */

const fs = require('fs');
const path = require('path');

function intentPath(projectRoot) {
  return path.join(projectRoot, '.godpowers', 'intent.yaml');
}

/**
 * Read intent.yaml. Returns parsed object or null if not found.
 *
 * Minimal YAML parser: handles the subset our schema uses
 * (key: value, nested objects, arrays of strings, booleans).
 * For full YAML, agents should use a real parser.
 */
function read(projectRoot) {
  const file = intentPath(projectRoot);
  if (!fs.existsSync(file)) return null;
  const content = fs.readFileSync(file, 'utf8');
  return parseSimpleYaml(content);
}

/**
 * Parse a simple YAML subset. Just enough for intent.yaml structure.
 * Real-world: replace with `yaml` npm package when we add deps.
 */
function parseSimpleYaml(content) {
  const lines = content.split('\n');
  const result = {};
  const stack = [{ obj: result, indent: -1 }];

  for (let line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].obj;

    if (trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim();
      if (Array.isArray(parent.__pending_array__)) {
        parent.__pending_array__.push(parseValue(value));
      }
      continue;
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const valueStr = trimmed.slice(colonIdx + 1).trim();

    if (!valueStr) {
      const child = {};
      parent[key] = child;
      stack.push({ obj: child, indent, key });
    } else if (valueStr === '|' || valueStr === '>') {
      parent[key] = '';
    } else {
      parent[key] = parseValue(valueStr);
    }
  }

  return cleanArrays(result);
}

function parseValue(str) {
  if (str === 'true') return true;
  if (str === 'false') return false;
  if (str === 'null' || str === '~') return null;
  if (/^-?\d+$/.test(str)) return parseInt(str, 10);
  if (/^-?\d+\.\d+$/.test(str)) return parseFloat(str);
  if (/^".*"$/.test(str) || /^'.*'$/.test(str)) return str.slice(1, -1);
  // Inline array: [/god-mode, /god-foo]
  if (/^\[.*\]$/.test(str)) {
    const inner = str.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map(s => parseValue(s.trim()));
  }
  return str;
}

function cleanArrays(obj) {
  if (Array.isArray(obj)) return obj.map(cleanArrays);
  if (obj && typeof obj === 'object') {
    if (obj.__pending_array__) return obj.__pending_array__;
    const cleaned = {};
    for (const [k, v] of Object.entries(obj)) {
      cleaned[k] = cleanArrays(v);
    }
    return cleaned;
  }
  return obj;
}

/**
 * Get a setting from intent.yaml using dot notation.
 * Example: get(root, 'config.yolo')
 */
function get(intent, key) {
  if (!intent) return undefined;
  return key.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), intent);
}

/**
 * Validate the structure of an intent object against expected shape.
 * Returns array of error messages (empty if valid).
 */
function validate(intent) {
  const errors = [];
  if (!intent) return ['intent is null'];
  if (intent.apiVersion !== 'godpowers/v1') errors.push('apiVersion must be godpowers/v1');
  if (intent.kind !== 'Project') errors.push('kind must be Project');
  if (!intent.metadata || !intent.metadata.name) errors.push('metadata.name required');
  if (!['A', 'B', 'C', 'D'].includes(intent.mode)) errors.push('mode must be A, B, C, or D');
  if (!['trivial', 'small', 'medium', 'large', 'enterprise'].includes(intent.scale)) {
    errors.push('scale must be trivial/small/medium/large/enterprise');
  }
  return errors;
}

module.exports = { read, get, validate, intentPath, parseSimpleYaml };
