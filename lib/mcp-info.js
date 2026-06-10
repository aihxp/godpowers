const path = require('path');

const identity = require('./package-identity');

const MCP_PACKAGE = '@godpowers/mcp';

function projectPath(projectRoot) {
  return path.resolve(projectRoot || process.cwd());
}

function serverCommand(projectRoot, version = identity.PACKAGE_VERSION) {
  return {
    command: 'npx',
    args: [
      '-y',
      '-p',
      `${identity.PACKAGE_NAME}@${version}`,
      '-p',
      `${MCP_PACKAGE}@${version}`,
      'godpowers-mcp',
      'serve',
      '--project',
      projectPath(projectRoot)
    ]
  };
}

function setupCommand(projectRoot, version = identity.PACKAGE_VERSION) {
  return {
    command: 'npx',
    args: [
      '-y',
      '-p',
      `${identity.PACKAGE_NAME}@${version}`,
      '-p',
      `${MCP_PACKAGE}@${version}`,
      'godpowers-mcp',
      'setup',
      '--host=codex',
      '--project',
      projectPath(projectRoot),
      '--write'
    ]
  };
}

function info(projectRoot, version = identity.PACKAGE_VERSION) {
  const project = projectPath(projectRoot);
  return {
    package: MCP_PACKAGE,
    version,
    project,
    boundary: 'The MCP SDK dependency is isolated in @godpowers/mcp. The main godpowers package has no production dependencies.',
    tools: ['status', 'next', 'gate_check', 'lint_artifact', 'trace_requirement'],
    server: serverCommand(project, version),
    setup: setupCommand(project, version),
    automaticRegistration: false
  };
}

function renderCommand(command) {
  return `${command.command} ${command.args.join(' ')}`;
}

function render(result) {
  return [
    'Godpowers MCP',
    '',
    `Package: ${result.package}@${result.version}`,
    `Project: ${result.project}`,
    `Boundary: ${result.boundary}`,
    '',
    'Tools:',
    `  ${result.tools.join(', ')}`,
    '',
    'Run server:',
    `  ${renderCommand(result.server)}`,
    '',
    'Opt-in Codex setup:',
    `  ${renderCommand(result.setup)}`,
    '',
    'Automatic registration: disabled'
  ].join('\n');
}

module.exports = {
  MCP_PACKAGE,
  serverCommand,
  setupCommand,
  info,
  render,
  renderCommand
};
