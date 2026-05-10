/**
 * SkillUI Bridge
 *
 * Thin invocation layer between godpowers and the SkillUI CLI
 * (https://www.npmjs.com/package/skillui, MIT license). SkillUI
 * statically analyzes a website / git repo / local directory and
 * extracts a complete design system including a DESIGN.md.
 *
 * We use SkillUI as the fallback when:
 *   - User mentions a site that's NOT in the awesome-design-md catalog
 *   - User wants to extract a design system from a private project
 *   - User has a specific URL or repo in mind
 *
 * Never vendored. Detect, dispatch, capture output. Caches per-project
 * under .godpowers/cache/skillui/<slug>/.
 *
 * Public API:
 *   isInstalled() -> bool
 *   extract(target, projectRoot, opts) -> Promise<{ designMd, outputDir, error }>
 *   detectTargetKind(target) -> 'url' | 'repo' | 'dir'
 *   slugifyTarget(target) -> string
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

/**
 * Quick presence check. SkillUI is an npm CLI; check for it via npm + npx.
 */
function isInstalled() {
  try {
    execSync('npx --no-install skillui --version', {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000
    });
    return true;
  } catch (e) {
    // Fall back: check global node_modules
    try {
      execSync('npm ls -g skillui --depth=0', {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 5000
      });
      return true;
    } catch (e2) {
      return false;
    }
  }
}

/**
 * Detect what kind of target was passed.
 */
function detectTargetKind(target) {
  if (!target) return null;
  const s = String(target).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) {
    if (/github\.com\/[^\/]+\/[^\/]+/.test(s)) return 'repo';
    return 'url';
  }
  if (s.match(/^[\w-]+\/[\w-]+$/)) return 'repo'; // org/repo shorthand
  if (fs.existsSync(s) && fs.statSync(s).isDirectory()) return 'dir';
  return 'url'; // default to URL with auto-https prepend
}

/**
 * Turn a target into a stable cache slug.
 */
function slugifyTarget(target) {
  return String(target)
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .replace(/[\/.:]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function cacheDir(projectRoot, slug) {
  return path.join(projectRoot, '.godpowers', 'cache', 'skillui', slug);
}

/**
 * Extract a design system from a target (URL, repo, or dir).
 * Returns the path to the generated DESIGN.md plus the output directory.
 *
 * If skillui is not installed, returns { error: 'not-installed' }.
 */
function extract(target, projectRoot, opts = {}) {
  return new Promise((resolve) => {
    if (!isInstalled() && !opts.forceRun) {
      return resolve({
        designMd: null,
        outputDir: null,
        error: 'not-installed',
        installInstructions: 'npm install -g skillui'
      });
    }

    const kind = detectTargetKind(target);
    const slug = slugifyTarget(target);
    const outDir = cacheDir(projectRoot, slug);
    fs.mkdirSync(outDir, { recursive: true });

    const flag = kind === 'repo' ? '--repo' : kind === 'dir' ? '--dir' : '--url';
    const args = ['skillui', flag, target];
    if (opts.ultra) args.push('--mode', 'ultra');
    args.push('--out', outDir);

    const proc = spawn('npx', args, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: opts.timeout || 300_000 // 5 min default for ultra mode
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        return resolve({
          designMd: null,
          outputDir: outDir,
          error: 'execution-error',
          message: stderr || stdout || `exit ${code}`,
          slug
        });
      }
      // Look for DESIGN.md anywhere in outDir tree
      const designPath = findFirstDesignMd(outDir);
      resolve({
        designMd: designPath,
        outputDir: outDir,
        error: null,
        slug,
        kind
      });
    });

    proc.on('error', (err) => {
      resolve({
        designMd: null,
        outputDir: outDir,
        error: 'spawn-error',
        message: err.message,
        slug
      });
    });
  });
}

function findFirstDesignMd(dir) {
  if (!fs.existsSync(dir)) return null;
  function walk(d) {
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch (e) {
      return null;
    }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        const found = walk(full);
        if (found) return found;
      } else if (e.name === 'DESIGN.md') {
        return full;
      }
    }
    return null;
  }
  return walk(dir);
}

/**
 * Plan a fallback path: given a site reference that's NOT in
 * awesome-design-md, return the extraction plan.
 */
function planFallback(siteName, projectRoot) {
  // Construct a likely URL from the site name
  const url = siteName.startsWith('http') ? siteName : `https://${siteName.replace(/\s+/g, '').toLowerCase()}.com`;
  return {
    target: url,
    kind: 'url',
    slug: slugifyTarget(url),
    outputDir: cacheDir(projectRoot, slugifyTarget(url)),
    requiresInstall: !isInstalled(),
    installCommand: 'npm install -g skillui',
    expectedDesignMd: path.join(cacheDir(projectRoot, slugifyTarget(url)), 'DESIGN.md')
  };
}

/**
 * Read a previously-cached DESIGN.md (no fetch).
 */
function readCached(projectRoot, slug) {
  const designPath = findFirstDesignMd(cacheDir(projectRoot, slug));
  if (!designPath) return null;
  return {
    designMd: designPath,
    content: fs.readFileSync(designPath, 'utf8')
  };
}

module.exports = {
  isInstalled,
  detectTargetKind,
  slugifyTarget,
  extract,
  planFallback,
  readCached,
  cacheDir,
  findFirstDesignMd
};
