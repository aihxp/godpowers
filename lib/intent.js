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
  const stack = [{ obj: result, indent: -1, key: null, isArray: false, parent: null }];

  for (let line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    // Strip inline comments (but not # inside quotes)
    const hashIdx = line.indexOf(' #');
    if (hashIdx !== -1) {
      // Make sure the # isn't inside a quoted string
      const before = line.slice(0, hashIdx);
      const dquoteCount = (before.match(/"/g) || []).length;
      const squoteCount = (before.match(/'/g) || []).length;
      if (dquoteCount % 2 === 0 && squoteCount % 2 === 0) {
        line = before;
      }
    }

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    // Pop stack to the right indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].obj;
    const parentMeta = stack[stack.length - 1];

    // List item: "- key: value" or "- value"
    if (trimmed.startsWith('- ')) {
      const rest = trimmed.slice(2);
      const restColonIdx = rest.indexOf(':');

      // Ensure parent is array
      if (!Array.isArray(parent.__items__)) {
        parent.__items__ = [];
      }

      if (restColonIdx === -1) {
        // Simple list value: "- value"
        parent.__items__.push(parseValue(rest.trim()));
      } else {
        // List of objects: "- key: value"
        const itemKey = rest.slice(0, restColonIdx).trim();
        const itemVal = rest.slice(restColonIdx + 1).trim();
        const newObj = {};
        if (itemVal) {
          newObj[itemKey] = parseValue(itemVal);
        } else {
          newObj[itemKey] = {};
          stack.push({ obj: newObj[itemKey], indent: indent + 2, key: itemKey, parent: newObj });
        }
        parent.__items__.push(newObj);
        // Push the new object onto the stack so subsequent indented lines go into it
        stack.push({ obj: newObj, indent: indent, key: '__item__', parent });
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
      stack.push({ obj: child, indent, key, parent });
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
    // Detect array container (legacy or new)
    if (obj.__items__) return obj.__items__.map(cleanArrays);
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
