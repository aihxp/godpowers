/**
 * Browser Bridge
 *
 * Headless-only browser automation for runtime verification.
 *
 * Two backends:
 *   1. agent-browser (vercel-labs CLI) - preferred. Native Rust binary,
 *      accessibility-tree-first, semantic locators, best AI-agent fit.
 *   2. Playwright (local) - JS API fallback when agent-browser absent.
 *
 * Headless is non-negotiable. No interactive windows. Never. Period.
 *
 * Public API:
 *   isAgentBrowserInstalled() -> bool
 *   isPlaywrightInstalled() -> bool
 *   getActiveBackend(projectRoot) -> 'agent-browser' | 'playwright' | null
 *   launch(opts) -> Promise<{ browser, backend, error? }>
 *   newPage(browser) -> Promise<page>
 *   close(browser) -> Promise<void>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Quick presence check for vercel-labs/agent-browser CLI.
 * Native Rust binary; no Node.js dep. Preferred backend when present.
 *
 * Detects via:
 *   - `agent-browser --version` on PATH
 *   - npm global install
 *   - homebrew install
 */
function isAgentBrowserInstalled() {
  try {
    execSync('agent-browser --version', {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000
    });
    return true;
  } catch (e1) {
    try {
      execSync('npx --no-install agent-browser --version', {
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
 * Determine which backend is active.
 * Cascade:
 *   1. agent-browser (vercel-labs CLI) - preferred when installed.
 *      Native Rust binary, accessibility-tree-first, semantic locators,
 *      best AI-agent fit per design.
 *   2. Playwright (local) - JS API fallback when agent-browser absent.
 * The user can override via --backend flag at the skill layer.
 */
function getActiveBackend(projectRoot) {
  if (isAgentBrowserInstalled()) return 'agent-browser';
  if (isPlaywrightInstalled()) return 'playwright';
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
      installInstructions: 'Recommended: npm install -g agent-browser && agent-browser install'
    };
  }

  if (requested === 'agent-browser') {
    if (!isAgentBrowserInstalled()) {
      return {
        browser: null,
        backend: 'agent-browser',
        error: 'agent-browser-not-installed',
        installInstructions: 'npm install -g agent-browser && agent-browser install'
      };
    }
    // agent-browser is CLI-driven; "browser" handle is the driver itself
    const driver = require('./agent-browser-driver');
    try {
      await driver.openSession({ projectRoot });
      return {
        browser: driver,  // Driver acts as the browser handle
        backend: 'agent-browser',
        error: null
      };
    } catch (e) {
      return { browser: null, backend: 'agent-browser', error: 'launch-failed', message: e.message };
    }
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
  isAgentBrowserInstalled,
  isPlaywrightInstalled,
  getActiveBackend,
  launch,
  newPage,
  close,
  runtimeDir,
  newRunId
};
