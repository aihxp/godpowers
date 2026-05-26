const { isCompatible } = require('./extensions');

const AGENT_CONTRACT_VERSION = '1.0.0';

/**
 * @typedef {Object} AgentRef
 * @property {string|null} agent Agent name without the range suffix.
 * @property {string|null} range SemVer range declared after the final at sign.
 * @property {string} raw Original workflow `uses` value.
 */

/**
 * @typedef {AgentRef & { contractVersion: string, valid: boolean, errors: string[] }} AgentRefValidation
 */

/**
 * @param {string} ref
 * @returns {AgentRef}
 */
function parseAgentRef(ref) {
  if (!ref) return { agent: null, range: null, raw: ref };
  const raw = String(ref).trim();
  const at = raw.lastIndexOf('@');
  if (at <= 0) {
    return { agent: raw, range: null, raw };
  }
  return {
    agent: raw.slice(0, at),
    range: raw.slice(at + 1),
    raw
  };
}

/**
 * @param {string} ref
 * @param {string} [contractVersion]
 * @returns {AgentRefValidation}
 */
function validateAgentRef(ref, contractVersion = AGENT_CONTRACT_VERSION) {
  const parsed = parseAgentRef(ref);
  const errors = [];

  if (!parsed.agent || !/^[a-z][a-z0-9-]*$/.test(parsed.agent)) {
    errors.push(`invalid agent name in uses: ${ref}`);
  }
  if (!parsed.range) {
    errors.push(`agent ref must include a semver range: ${ref}`);
  } else if (!isCompatible(parsed.range, contractVersion)) {
    errors.push(`agent ref ${ref} does not satisfy agent contract ${contractVersion}`);
  }

  return { ...parsed, contractVersion, valid: errors.length === 0, errors };
}

/**
 * @param {string} ref
 * @param {string} [contractVersion]
 * @returns {AgentRefValidation}
 */
function assertAgentRef(ref, contractVersion = AGENT_CONTRACT_VERSION) {
  const result = validateAgentRef(ref, contractVersion);
  if (!result.valid) {
    throw new Error(result.errors.join('; '));
  }
  return result;
}

module.exports = {
  AGENT_CONTRACT_VERSION,
  parseAgentRef,
  validateAgentRef,
  assertAgentRef
};
