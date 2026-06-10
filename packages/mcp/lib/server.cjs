const path = require('path');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { registerGodpowersTools } = require('./tools.cjs');

function createServer(opts = {}) {
  const project = path.resolve(opts.project || process.cwd());
  const server = new McpServer({
    name: 'godpowers-mcp',
    version: '0.1.0'
  });
  registerGodpowersTools(server, { project });
  return server;
}

async function startStdio(opts = {}) {
  const server = createServer(opts);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
}

module.exports = {
  createServer,
  startStdio
};
