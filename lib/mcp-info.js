/**
 * Read-only MCP setup information for the main godpowers CLI.
 */

const path = require('path');
const identity = require('./package-identity');

const MCP_PACKAGE = '@godpowers/mcp';
const MCP_BIN = 'godpowers-mcp';

function setupInfo(projectRoot = process.cwd()) {
  const project = path.resolve(projectRoot);
  return {
    package: MCP_PACKAGE,
    command: MCP_BIN,
    project,
    install: `npm install -g ${MCP_PACKAGE}`,
    server: {
      command: MCP_BIN,
      args: ['--project', project]
    },
    npx: `npx ${MCP_PACKAGE} --project ${project}`,
    tools: [
      'status',
      'next',
      'gate_check',
      'lint_artifact',
      'trace_requirement'
    ],
    mainPackage: {
      package: identity.PACKAGE_NAME,
      version: identity.PACKAGE_VERSION,
      runtimeDependencyOnMcpSdk: false
    },
    policy: 'MCP registration is opt-in. The main installer does not write host MCP config automatically.'
  };
}

function render(info) {
  return [
    'Godpowers MCP Companion',
    '',
    `Package: ${info.package}`,
    `Install: ${info.install}`,
    '',
    'Server command:',
    `  ${info.command} --project ${info.project}`,
    '',
    'Host registration shape:',
    JSON.stringify({
      command: info.server.command,
      args: info.server.args
    }, null, 2).split('\n').map(line => `  ${line}`).join('\n'),
    '',
    'Tools:',
    ...info.tools.map(tool => `  - ${tool}`),
    '',
    `Boundary: ${info.mainPackage.package}@${info.mainPackage.version} does not depend on the MCP SDK at runtime.`,
    `Policy: ${info.policy}`
  ].join('\n');
}

module.exports = {
  MCP_PACKAGE,
  MCP_BIN,
  setupInfo,
  render
};
