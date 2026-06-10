#!/usr/bin/env node

const path = require('path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { test, asyncTest, assert, report } = require('../../../scripts/test-harness');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SERVER_BIN = path.join(ROOT, 'packages', 'mcp', 'bin', 'godpowers-mcp.cjs');
const FIXTURE_PROJECT = path.join(ROOT, 'fixtures', 'quick-proof', 'project');

test('MCP package server entrypoint parses project args', () => {
  const cli = require('../bin/godpowers-mcp.cjs');
  const parsed = cli.parseArgs(['node', 'godpowers-mcp', '--project', FIXTURE_PROJECT]);
  assert(parsed.project === FIXTURE_PROJECT, `project: ${parsed.project}`);
});

asyncTest('MCP protocol exposes read-side Godpowers tools over stdio', async () => {
  const client = new Client({
    name: 'godpowers-mcp-protocol-test',
    version: '0.0.0'
  });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_BIN, '--project', FIXTURE_PROJECT],
    cwd: ROOT,
    stderr: 'pipe'
  });

  try {
    await client.connect(transport);
    const listed = await client.listTools();
    const names = listed.tools.map(tool => tool.name).sort();
    for (const expected of ['gate_check', 'lint_artifact', 'next', 'status', 'trace_requirement']) {
      assert(names.includes(expected), `missing MCP tool: ${expected}`);
    }

    const calls = [
      ['status', {}],
      ['next', {}],
      ['gate_check', { tier: 'prd' }],
      ['lint_artifact', { artifact: '.godpowers/prep/INITIAL-FINDINGS.md' }],
      ['trace_requirement', { requirement: 'P-MUST-01' }]
    ];

    for (const [name, args] of calls) {
      const result = await client.callTool({ name, arguments: args });
      assert(!result.isError, `${name} returned MCP error`);
      assert(result.content && result.content[0] && result.content[0].type === 'text',
        `${name} missing text content`);
      const parsed = JSON.parse(result.content[0].text);
      assert(parsed && typeof parsed === 'object', `${name} did not return JSON object text`);
    }
  } finally {
    await client.close();
  }
});

report('MCP protocol tests');
