const fs = require('fs');
const os = require('os');
const path = require('path');

const pkg = require('../package.json');

const BEGIN = '# godpowers:mcp:begin';
const END = '# godpowers:mcp:end';

function resolveProject(projectRoot) {
  return path.resolve(projectRoot || process.cwd());
}

function serverCommand(projectRoot, version = pkg.version) {
  return {
    command: 'npx',
    args: [
      '-y',
      '-p',
      `godpowers@${version}`,
      '-p',
      `@godpowers/mcp@${version}`,
      'godpowers-mcp',
      'serve',
      '--project',
      resolveProject(projectRoot)
    ]
  };
}

function codexConfigPath(homeDir = os.homedir()) {
  return path.join(homeDir, '.codex', 'config.toml');
}

function codexBlock(projectRoot, version = pkg.version) {
  const command = serverCommand(projectRoot, version);
  return [
    BEGIN,
    '[mcp_servers.godpowers]',
    `command = ${JSON.stringify(command.command)}`,
    `args = ${JSON.stringify(command.args)}`,
    END
  ].join('\n');
}

function genericJson(projectRoot, version = pkg.version) {
  const command = serverCommand(projectRoot, version);
  return {
    mcpServers: {
      godpowers: command
    }
  };
}

function setupPlan(opts = {}) {
  const projectRoot = resolveProject(opts.projectRoot);
  const host = opts.host || 'codex';
  const homeDir = opts.homeDir || os.homedir();
  const version = opts.version || pkg.version;
  return {
    host,
    projectRoot,
    version,
    writes: false,
    automaticRegistration: false,
    codexConfigPath: codexConfigPath(homeDir),
    command: serverCommand(projectRoot, version),
    codexToml: codexBlock(projectRoot, version),
    genericJson: genericJson(projectRoot, version)
  };
}

function replaceManagedBlock(current, block) {
  const pattern = new RegExp(`${BEGIN}[\\s\\S]*?${END}`);
  if (pattern.test(current)) {
    return current.replace(pattern, block);
  }
  const prefix = current.trimEnd();
  return `${prefix}${prefix ? '\n\n' : ''}${block}\n`;
}

function writeRegistration(plan) {
  if (plan.host !== 'codex') {
    throw new Error('Only codex registration writes are supported. Use setup without --write for a JSON snippet.');
  }
  const filePath = plan.codexConfigPath;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const next = replaceManagedBlock(current, plan.codexToml);
  fs.writeFileSync(filePath, next);
  return {
    ...plan,
    writes: true,
    written: filePath
  };
}

function render(plan) {
  const lines = [
    'Godpowers MCP setup',
    '',
    `Host: ${plan.host}`,
    `Project: ${plan.projectRoot}`,
    `Package: @godpowers/mcp@${plan.version}`,
    '',
    'Read-only server command:',
    `  ${plan.command.command} ${plan.command.args.join(' ')}`,
    '',
    'Codex config block:',
    plan.codexToml,
    '',
    'Generic JSON registration:',
    JSON.stringify(plan.genericJson, null, 2),
    '',
    plan.writes
      ? `Wrote explicit registration: ${plan.written}`
      : 'No files written. Re-run setup with --write to opt in.'
  ];
  return lines.join('\n');
}

module.exports = {
  BEGIN,
  END,
  serverCommand,
  codexConfigPath,
  codexBlock,
  genericJson,
  setupPlan,
  replaceManagedBlock,
  writeRegistration,
  render
};
