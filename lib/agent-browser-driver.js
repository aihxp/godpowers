/**
 * Agent Browser Driver
 *
 * Wraps the vercel-labs/agent-browser CLI for use as a browser backend
 * in the runtime verification pipeline. Native Rust binary, headless by
 * default, accessibility-tree-first interaction model.
 *
 * Source: https://github.com/vercel-labs/agent-browser (MIT)
 *
 * The driver presents a uniform interface (goto, click, type, expect,
 * styles, screenshot, close) that runtime-audit and runtime-test consume
 * regardless of which backend is active.
 *
 * Headless contract: agent-browser is headless by default. We never pass
 * any flag that would change that.
 *
 * Public API:
 *   openSession(opts) -> Promise<void>
 *   newPage() -> Promise<page-handle>  // Driver acts as both browser and page
 *   goto(url) -> Promise<void>
 *   click(selector) -> Promise<void>
 *   type(selector, text) -> Promise<void>
 *   fill(selector, text) -> Promise<void>
 *   isVisible(selector) -> Promise<boolean>
 *   getStyles(selector) -> Promise<object>
 *   screenshot(filePath, opts) -> Promise<string>
 *   evaluate(fn, ...args) -> Promise<any>  // limited support via `eval`
 *   snapshot() -> Promise<string>           // accessibility tree
 *   close() -> Promise<void>
 *   isInstalled() -> bool
 */

const { execSync } = require('child_process');
const path = require('path');

/**
 * Detect agent-browser presence (mirror of bridge.isAgentBrowserInstalled).
 */
function isInstalled() {
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
 * Run an agent-browser CLI command and return stdout.
 * Throws on non-zero exit. Times out after 30s default.
 */
function run(args, opts = {}) {
  const cmd = Array.isArray(args) ? args : [args];
  // Quote arguments containing spaces (best-effort)
  const argString = cmd.map(a => {
    const s = String(a);
    if (/\s/.test(s) && !s.startsWith('"')) return `"${s.replace(/"/g, '\\"')}"`;
    return s;
  }).join(' ');
  const fullCmd = `agent-browser ${argString}`;
  return execSync(fullCmd, {
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: opts.timeout || 30000,
    cwd: opts.cwd || process.cwd(),
    encoding: 'utf8'
  });
}

let activeSession = null;

/**
 * Open a session. agent-browser maintains the browser process between commands.
 * We mark the driver as having an active session.
 */
async function openSession(opts = {}) {
  if (activeSession) return; // already open
  // `agent-browser open` with no args launches without navigation
  try {
    run(['open'], { cwd: opts.cwd });
    activeSession = { startedAt: Date.now(), opts };
  } catch (e) {
    activeSession = null;
    throw new Error(`agent-browser open failed: ${e.message}`);
  }
}

/**
 * The driver itself acts as the page handle (single session model).
 */
async function newPage() {
  return module.exports;
}

async function goto(url) {
  run(['open', url]);
}

async function click(selector) {
  // If selector starts with @ (snapshot ref), use as-is. Otherwise try as CSS.
  run(['click', selector]);
}

async function type(selector, text) {
  run(['type', selector, text]);
}

async function fill(selector, text) {
  run(['fill', selector, text]);
}

async function isVisible(selector) {
  try {
    const out = run(['is', 'visible', selector]);
    return /true/i.test(out);
  } catch (e) {
    return false;
  }
}

async function getStyles(selector) {
  try {
    const out = run(['get', 'styles', selector]);
    try {
      return JSON.parse(out);
    } catch (parseErr) {
      // CLI returns a key:value lines format on some versions; best-effort parse
      const result = {};
      for (const line of out.split('\n')) {
        const m = line.match(/^([\w-]+):\s*(.+)$/);
        if (m) result[m[1]] = m[2].trim();
      }
      return result;
    }
  } catch (e) {
    return null;
  }
}

async function screenshot(filePath, opts = {}) {
  const args = ['screenshot', filePath];
  if (opts.fullPage) args.push('--full');
  run(args);
  return filePath;
}

async function evaluate(fn, ...args) {
  // CLI mode: serialize JS expression. agent-browser supports `eval <js>`.
  // We can't pass functions directly; only JS expression strings.
  let expr;
  if (typeof fn === 'string') {
    expr = fn;
  } else if (typeof fn === 'function') {
    // Best-effort: stringify the function and immediately invoke
    const fnStr = fn.toString();
    expr = `(${fnStr})(${args.map(a => JSON.stringify(a)).join(', ')})`;
  } else {
    throw new Error('evaluate expects a string or function');
  }
  const out = run(['eval', expr]);
  try {
    return JSON.parse(out);
  } catch (e) {
    return out;
  }
}

async function snapshot() {
  return run(['snapshot']);
}

async function close() {
  try {
    run(['close']);
  } catch (e) {
    // Already closed
  }
  activeSession = null;
}

/**
 * Match the bridge's expected `browser.newPage` and `browser.close`
 * interface so the higher-level audit/test code can treat agent-browser
 * the same as Playwright.
 */
module.exports = {
  isInstalled,
  openSession,
  newPage,
  goto,
  click,
  type,
  fill,
  isVisible,
  getStyles,
  screenshot,
  evaluate,
  snapshot,
  close,
  // Expose run for testing
  _run: run,
  // Expose session state
  _session: () => activeSession,
  _setSession: (s) => { activeSession = s; }
};
