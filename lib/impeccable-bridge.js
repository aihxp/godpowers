/**
 * Impeccable Bridge
 *
 * Thin invocation layer between godpowers and the impeccable design skill.
 * Detects impeccable presence; dispatches commands; captures findings.
 *
 * IMPORTANT: Impeccable is never vendored. This module only detects and
 * delegates. If impeccable is not installed, command dispatch returns a
 * graceful "not-installed" result that callers can act on.
 *
 * Public API:
 *   isInstalled(projectRoot) -> bool
 *   getInstallation(projectRoot) -> { installed, locations, primaryTool }
 *   runDetect(targetPath, opts) -> { findings, error }   // shells out to npx impeccable
 *   describeBridge() -> { commands, sourcedFrom }        // metadata
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const designDetector = require('./design-detector');

const IMPECCABLE_COMMANDS = [
  'craft', 'teach', 'document', 'extract', 'shape',
  'critique', 'audit', 'polish',
  'bolder', 'quieter', 'distill', 'harden', 'onboard',
  'animate', 'colorize', 'typeset', 'layout',
  'delight', 'overdrive', 'clarify', 'adapt', 'optimize', 'live'
];

/**
 * Quick presence check. Delegates to design-detector for consistency.
 */
function isInstalled(projectRoot) {
  return designDetector.isImpeccableInstalled(projectRoot).installed;
}

/**
 * Detailed installation info: where impeccable is found.
 * Identifies the primary AI tool from the first matched skill location.
 */
function getInstallation(projectRoot) {
  const result = designDetector.isImpeccableInstalled(projectRoot);
  let primaryTool = null;
  for (const loc of result.locations) {
    if (loc.includes('.claude')) { primaryTool = 'claude-code'; break; }
    if (loc.includes('.cursor')) { primaryTool = 'cursor'; break; }
    if (loc.includes('.gemini')) { primaryTool = 'gemini'; break; }
    if (loc.includes('.opencode')) { primaryTool = 'opencode'; break; }
    if (loc.includes('.kiro')) { primaryTool = 'kiro'; break; }
    if (loc.includes('.qoder')) { primaryTool = 'qoder'; break; }
    if (loc.includes('.rovodev')) { primaryTool = 'rovodev'; break; }
    if (loc.includes('.trae')) { primaryTool = 'trae'; break; }
    if (loc.includes('.agents')) { primaryTool = 'codex'; break; }
    if (loc.includes('.github')) { primaryTool = 'copilot'; break; }
    if (loc.includes('node_modules')) { primaryTool = 'npm'; break; }
  }
  return {
    installed: result.installed,
    locations: result.locations,
    primaryTool
  };
}

/**
 * Run `npx impeccable detect <target>` and parse the JSON output.
 * Returns { findings, error }.
 *
 * If impeccable CLI is not available, returns
 *   { findings: [], error: 'not-installed' }
 *
 * Callers should pass `--fast --json` or rely on this function's defaults.
 */
function runDetect(targetPath, opts = {}) {
  const cwd = opts.cwd || process.cwd();
  if (!isInstalled(cwd) && !opts.forceRun) {
    return { findings: [], error: 'not-installed' };
  }
  const args = ['impeccable', 'detect', '--fast', '--json'];
  if (targetPath) args.push(targetPath);
  try {
    const output = execSync(`npx ${args.join(' ')}`, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30_000
    });
    let parsed;
    try {
      parsed = JSON.parse(output);
    } catch (e) {
      return { findings: [], error: 'parse-error', raw: output };
    }
    return {
      findings: parsed.findings || [],
      summary: parsed.summary || null,
      error: null
    };
  } catch (e) {
    return { findings: [], error: 'execution-error', message: e.message };
  }
}

/**
 * Metadata about the bridge: which commands are bridged, where they delegate.
 */
function describeBridge() {
  return {
    commands: IMPECCABLE_COMMANDS,
    sourcedFrom: 'https://github.com/pbakaus/impeccable',
    integrationModel: 'detect-and-delegate; never vendored',
    bridgeFunctions: ['isInstalled', 'getInstallation', 'runDetect']
  };
}

/**
 * Build a god-design subcommand -> impeccable command mapping.
 */
function commandMap() {
  const map = {};
  for (const cmd of IMPECCABLE_COMMANDS) {
    map[`/god-design ${cmd}`] = `/impeccable ${cmd}`;
  }
  // Aliases for godpowers-natural names
  map['/god-design refresh'] = '/impeccable document';
  return map;
}

module.exports = {
  isInstalled,
  getInstallation,
  runDetect,
  describeBridge,
  commandMap,
  IMPECCABLE_COMMANDS
};
