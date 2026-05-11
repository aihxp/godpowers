/**
 * Code Scanner
 *
 * Scans a codebase for linkage signals between code and artifact IDs.
 *
 * Discovery mechanisms:
 *   1. Comment annotations: // Implements: P-MUST-01, // ADR-007, // Token: {colors.primary}
 *   2. Filename heuristics: src/components/Button.tsx -> D-button-primary; src/auth/ -> C-auth-service
 *   3. Import analysis: importing a STACK dep links to its decision ID
 *   4. Style-system parsing: tokens used in CSS / styled-components / Tailwind
 *   5. Test descriptions: describe('P-MUST-01: user can log in') -> link
 *
 * Returns structured links: [{ artifactId, file, source, line? }]
 *
 * Public API:
 *   scan(projectRoot, opts) -> { links, stats }
 *   scanFile(filePath, opts) -> [...links from this file]
 *   parseAnnotation(line) -> [...] // exposed for testing
 */

const fs = require('fs');
const path = require('path');

const linkage = require('./linkage');

// ============================================================================
// Annotation patterns (across languages, comment styles)
// ============================================================================

// Match: `// Implements: P-MUST-01` or `# Implements: P-MUST-01` etc.
const ANNOTATION_PATTERNS = [
  // Implements: <id>
  /(?:\/\/|\/\*|\*|#|--|<!--)\s*Implements?\s*:\s*([A-Za-z][\w.-]*(?:,\s*[A-Za-z][\w.-]*)*)/i,
  // Fixes: P-MUST-NN  or  Fixes: incident-001
  /(?:\/\/|\/\*|\*|#|--|<!--)\s*Fixes?\s*:\s*([A-Za-z][\w.-]*)/i,
  // ADR-007 mentioned anywhere in a comment line
  /(?:\/\/|\/\*|\*|#|--|<!--)[^\n]*\b(ADR-\d+)\b/i,
  // Token: {colors.primary}
  /(?:\/\/|\/\*|\*|#|--|<!--)\s*Token\s*:\s*\{([\w.-]+)\}/i,
  // Pattern: ADR-007 or Source: C-auth-service
  /(?:\/\/|\/\*|\*|#|--|<!--)\s*(?:Pattern|Source|Container)\s*:\s*([A-Za-z][\w.-]+)/i,
  // Implements: D-button-primary (design component)
  /(?:\/\/|\/\*|\*|#|--|<!--)\s*Implements?\s*:\s*(D-[\w-]+)/i
];

const SCAN_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.go', '.rb', '.rs', '.java', '.kt', '.swift',
  '.css', '.scss', '.less', '.styl',
  '.html', '.vue', '.svelte', '.astro',
  '.md', '.mdx',
  '.yml', '.yaml',
  '.sh', '.bash'
]);

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out',
  '.cache', '.parcel-cache', '.turbo', 'target', '__pycache__',
  '.pytest_cache', '.venv', 'venv', '.tox', '.idea', '.vscode',
  'coverage', '.nyc_output', '.svelte-kit', '.vercel',
  '.godpowers'
]);

/**
 * Parse a single line of source for annotations. Returns array of artifact IDs.
 */
function parseAnnotation(line) {
  const ids = [];
  for (const pattern of ANNOTATION_PATTERNS) {
    const m = line.match(pattern);
    if (m && m[1]) {
      // Comma-separated list support: "P-MUST-01, P-MUST-02"
      const tokens = m[1].split(',').map(t => t.trim()).filter(Boolean);
      ids.push(...tokens);
    }
  }
  return [...new Set(ids)];
}

/**
 * Scan a single file and return all annotation-based links.
 */
function scanFile(filePath, opts = {}) {
  const links = [];
  if (!fs.existsSync(filePath)) return links;

  const ext = path.extname(filePath);
  if (!SCAN_EXTENSIONS.has(ext)) return links;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const ids = parseAnnotation(lines[i]);
    for (const id of ids) {
      links.push({
        artifactId: id,
        file: filePath,
        source: 'annotation',
        line: i + 1
      });
    }
  }
  return links;
}

/**
 * Filename heuristic: src/components/Button.tsx -> [D-button]
 */
function filenameHeuristic(filePath, projectRoot) {
  const links = [];
  const rel = path.relative(projectRoot, filePath);

  // src/components/Button.tsx -> D-button
  const compMatch = rel.match(/components?\/([\w-]+)\.(tsx?|jsx?|vue|svelte)$/i);
  if (compMatch) {
    const slug = kebab(compMatch[1]);
    links.push({ artifactId: `D-${slug}`, file: filePath, source: 'filename' });
  }

  // src/auth/foo.ts -> C-auth-service (if matches container slug pattern)
  const containerMatch = rel.match(/^(?:src|lib|app|services?)\/([a-z][\w-]*)/);
  if (containerMatch) {
    const slug = containerMatch[1];
    // Heuristic: only treat as container if the slug looks service-y
    if (/service|server|api|db|auth|core/i.test(slug)) {
      links.push({ artifactId: `C-${slug}`, file: filePath, source: 'filename' });
    }
  }
  return links;
}

/**
 * Style-system: scan CSS/JSX for token references like var(--colors-primary)
 * or Tailwind class fragments that look like our tokens.
 */
function styleSystemScan(filePath, opts = {}) {
  const links = [];
  const ext = path.extname(filePath);
  if (!['.css', '.scss', '.less', '.styl', '.tsx', '.jsx', '.vue', '.svelte', '.html'].includes(ext)) {
    return links;
  }
  if (!fs.existsSync(filePath)) return links;
  const content = fs.readFileSync(filePath, 'utf8');

  // CSS variables: var(--colors-primary) or var(--token-name)
  // Tokens like `colors.primary` get translated to CSS vars `--colors-primary`
  const cssVarRegex = /var\(--([a-z][\w-]*)\)/g;
  let m;
  while ((m = cssVarRegex.exec(content)) !== null) {
    const cssName = m[1]; // e.g., "colors-primary"
    // Convert back to token path: colors-primary -> colors.primary (heuristic)
    const tokenPath = cssName.replace(/-/g, '.');
    if (linkage.classifyId(tokenPath) === 'token') {
      links.push({ artifactId: tokenPath, file: filePath, source: 'css-var' });
    }
  }

  // Direct {token.path} references in styled-components or Tailwind config
  const tokenRefRegex = /\{(colors|typography|spacing|rounded)\.([\w-]+)\}/g;
  while ((m = tokenRefRegex.exec(content)) !== null) {
    const tokenPath = `${m[1]}.${m[2]}`;
    links.push({ artifactId: tokenPath, file: filePath, source: 'token-ref' });
  }

  return links;
}

/**
 * Top-level scan: walks the project tree, applies all discovery mechanisms.
 */
function scan(projectRoot, opts = {}) {
  const root = path.resolve(projectRoot);
  const links = [];
  const stats = {
    filesScanned: 0,
    filesWithLinks: 0,
    annotationLinks: 0,
    filenameLinks: 0,
    styleLinks: 0
  };

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (IGNORE_DIRS.has(e.name)) continue;
        walk(full);
      } else if (e.isFile()) {
        const ext = path.extname(e.name);
        if (!SCAN_EXTENSIONS.has(ext)) continue;

        stats.filesScanned++;
        const before = links.length;

        // 1. Annotation scan
        const annLinks = scanFile(full);
        links.push(...annLinks);
        stats.annotationLinks += annLinks.length;

        // 2. Filename heuristic
        const fnLinks = filenameHeuristic(full, root);
        links.push(...fnLinks);
        stats.filenameLinks += fnLinks.length;

        // 3. Style-system scan
        if (opts.skipStyleScan !== true) {
          const styleLinks = styleSystemScan(full);
          links.push(...styleLinks);
          stats.styleLinks += styleLinks.length;
        }

        if (links.length > before) stats.filesWithLinks++;
      }
    }
  }

  walk(root);
  return { links, stats };
}

/**
 * Apply scan results to linkage map. Returns counts of additions.
 */
function applyScan(projectRoot, scanResult, opts = {}) {
  const { links } = scanResult;
  const source = opts.source || 'code-scanner';
  const result = linkage.bulkReplaceFromSource(projectRoot, source, links);
  return { totalLinks: links.length, added: result.added, removed: result.removed };
}

// ============================================================================
// Helpers
// ============================================================================

function kebab(s) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

module.exports = {
  parseAnnotation,
  scanFile,
  filenameHeuristic,
  styleSystemScan,
  scan,
  applyScan,
  ANNOTATION_PATTERNS,
  SCAN_EXTENSIONS,
  IGNORE_DIRS
};
