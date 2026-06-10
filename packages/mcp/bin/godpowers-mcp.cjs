#!/usr/bin/env node

const path = require('path');
const pkg = require('../package.json');
const { startStdio } = require('../lib/server.cjs');

function parseArgs(argv) {
  const opts = {
    project: process.cwd(),
    help: false,
    version: false
  };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--version' || arg === '-v') {
      opts.version = true;
    } else if (arg === '--project' && args[i + 1]) {
      opts.project = path.resolve(args[i + 1]);
      i++;
    } else if (arg.startsWith('--project=')) {
      opts.project = path.resolve(arg.slice('--project='.length));
    }
  }
  return opts;
}

function showHelp() {
  console.log([
    'Godpowers MCP Companion',
    '',
    'Usage: godpowers-mcp --project <path>',
    '',
    'Options:',
    '  --project=<path>  Default project root for read-only Godpowers tools',
    '  --version         Print package version',
    '  --help            Show this help message'
  ].join('\n'));
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    showHelp();
    return;
  }
  if (opts.version) {
    console.log(pkg.version);
    return;
  }
  await startStdio({ project: opts.project });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  showHelp
};
