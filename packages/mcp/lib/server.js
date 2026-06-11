const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const pkg = require('../package.json');
const tools = require('./tools');

function createServer(opts = {}) {
  const server = new McpServer({
    name: 'godpowers-mcp',
    version: pkg.version
  });
  tools.registerTools(server, opts);
  return server;
}

async function serveStdio(opts = {}) {
  const server = createServer(opts);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
}

module.exports = {
  createServer,
  serveStdio
};
