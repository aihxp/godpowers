/**
 * Browser Bridge
 *
 * Headless-only browser automation for runtime verification.
 *
 * Two backends:
 *   1. Local: Playwright (when @playwright/test or playwright installed)
 *   2. Cloud: Vercel Browser API (when project deploys to Vercel)
 *
 * Headless is non-negotiable. No interactive windows. Never. Period.
 *
 * Public API:
 *   isPlaywrightInstalled() -> bool
 *   hasVercelBrowserConfig(projectRoot) -> bool
 *   getActiveBackend(projectRoot) -> 'playwright' | 'vercel-browser' | null
 *   launch(opts) -> Promise<{ browser, backend, error? }>
 *   newPage(browser) -> Promise<page>
 *   close(browser) -> Promise<void>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Quick presence check for Playwright via require.resolve.
 * Returns true if either `playwright` or `@playwright/test` is resolvable.
 */
function isPlaywrightInstalled() {
  try {
    require.resolve('playwright');
    return true;
  } catch (e1) {
    try {
      require.resolve('@playwright/test');
      return true;
    } catch (e2) {
      // Fall back: check global install
      try {
        execSync('npm ls -g playwright --depth=0', {
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 5000
        });
        return true;
      } catch (e3) {
        return false;
      }
    }
  }
}

/**
 * Check whether the project has Vercel Browser API configuration.
 * Signals: vercel.json with browser config, OR @vercel/browser-api in deps,
 * OR VERCEL_BROWSER_TOKEN env var.
 */
function hasVercelBrowserConfig(projectRoot) {
  // 1. vercel.json with browser config
  const vercelJson = path.join(projectRoot, 'vercel.json');
  if (fs.existsSync(vercelJson)) {
    try {
      const content = fs.readFileSync(vercelJson, 'utf8');
      if (content.includes('browser') || content.includes('@vercel/browser')) {
        return true;
      }
    } catch (e) {
      // ignore parse errors
    }
  }
  // 2. package.json depends on a Vercel browser package
  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (allDeps['@vercel/browser-api'] || allDeps['@vercel/edge-browser']) {
        return true;
      }
    } catch (e) {
      // ignore
    }
  }
  // 3. Env var present
  if (process.env.VERCEL_BROWSER_TOKEN || process.env.VERCEL_BROWSER_ENDPOINT) {
    return true;
  }
  return false;
}

/**
 * Determine which backend is active.
 * Order: Playwright (local) takes precedence over Vercel (cloud) when both
 * are present. The user can override via --backend flag at the skill layer.
 */
function getActiveBackend(projectRoot) {
  if (isPlaywrightInstalled()) return 'playwright';
  if (hasVercelBrowserConfig(projectRoot || process.cwd())) return 'vercel-browser';
  return null;
}

/**
 * Launch a headless browser. Returns { browser, backend, error }.
 *
 * In real use, this calls Playwright's `chromium.launch({ headless: true })`
 * or the Vercel Browser API. In tests, opts.mock can stub the launch.
 */
async function launch(opts = {}) {
  const projectRoot = opts.projectRoot || process.cwd();
  const requested = opts.backend || getActiveBackend(projectRoot);

  if (!requested) {
    return {
      browser: null,
      backend: null,
      error: 'no-backend-available',
      installInstructions: 'npm install playwright + npx playwright install chromium'
    };
  }

  if (requested === 'playwright') {
    if (!isPlaywrightInstalled()) {
      return {
        browser: null,
        backend: 'playwright',
        error: 'playwright-not-installed',
        installInstructions: 'npm install playwright + npx playwright install chromium'
      };
    }
    try {
      // Lazy require so the module loads only when needed
      const playwright = require('playwright');
      const browser = await playwright.chromium.launch({
        headless: true,  // NEVER false. Non-negotiable.
        args: opts.args || [],
        timeout: opts.timeout || 30000
      });
      return { browser, backend: 'playwright', error: null };
    } catch (e) {
      return { browser: null, backend: 'playwright', error: 'launch-failed', message: e.message };
    }
  }

  if (requested === 'vercel-browser') {
    if (!hasVercelBrowserConfig(projectRoot)) {
      return {
        browser: null,
        backend: 'vercel-browser',
        error: 'vercel-browser-not-configured',
        configInstructions: 'Add @vercel/browser-api or set VERCEL_BROWSER_TOKEN'
      };
    }
    // Vercel Browser API client - opaque interface; specific impl loaded if available
    try {
      const vbApi = require('@vercel/browser-api');
      const browser = await vbApi.launch({
        headless: true  // NEVER false. Non-negotiable.
      });
      return { browser, backend: 'vercel-browser', error: null };
    } catch (e) {
      return { browser: null, backend: 'vercel-browser', error: 'vercel-launch-failed', message: e.message };
    }
  }

  return { browser: null, backend: requested, error: 'unknown-backend' };
}

/**
 * Open a new page in the launched browser.
 */
async function newPage(browser) {
  if (!browser) throw new Error('browser is null');
  if (typeof browser.newPage !== 'function') {
    throw new Error('browser does not implement newPage');
  }
  return browser.newPage();
}

/**
 * Close a launched browser.
 */
async function close(browser) {
  if (!browser) return;
  if (typeof browser.close === 'function') {
    await browser.close();
  }
}

/**
 * Output dir for runtime artifacts.
 */
function runtimeDir(projectRoot, runId) {
  return path.join(projectRoot, '.godpowers', 'runtime', runId);
}

/**
 * Generate a run id (timestamp-based).
 */
function newRunId() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

module.exports = {
  isPlaywrightInstalled,
  hasVercelBrowserConfig,
  getActiveBackend,
  launch,
  newPage,
  close,
  runtimeDir,
  newRunId
};
