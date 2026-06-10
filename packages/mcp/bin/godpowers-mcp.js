#!/usr/bin/env node

const path = require('path');

const server = require('../lib/server');
const setup = require('../lib/setup');

function parseArgs(argv, cwd = process.cwd()) {
  const args = argv.slice(2);
  const opts = {
    command: 'serve',
    project: cwd,
    runtimeRoot: null,
    host: 'codex',
    write: false,
    json: false,
    homeDir: null,
    help: false
  };

  if (args[0] && !args[0].startsWith('-')) {
    opts.command = args[0];
    args.shift();
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--project':
        if (args[i + 1]) {
          opts.project = path.resolve(args[i + 1]);
          i++;
        }
        break;
      case '--runtime-root':
        if (args[i + 1]) {
          opts.runtimeRoot = path.resolve(args[i + 1]);
          i++;
        }
        break;
      case '--host':
        if (args[i + 1]) {
          opts.host = args[i + 1];
          i++;
        }
        break;
      case '--home':
        if (args[i + 1]) {
          opts.homeDir = path.resolve(args[i + 1]);
          i++;
        }
        break;
      case '--write':
        opts.write = true;
        break;
      case '--json':
        opts.json = true;
        break;
      case '-h':
      case '--help':
        opts.help = true;
        break;
      default:
        if (arg.startsWith('--project=')) {
          opts.project = path.resolve(arg.slice('--project='.length));
        } else if (arg.startsWith('--runtime-root=')) {
          opts.runtimeRoot = path.resolve(arg.slice('--runtime-root='.length));
        } else if (arg.startsWith('--host=')) {
          opts.host = arg.slice('--host='.length);
        } else if (arg.startsWith('--home=')) {
          opts.homeDir = path.resolve(arg.slice('--home='.length));
        }
        break;
    }
  }

  return opts;
}

function renderHelp() {
  return [
    'Godpowers MCP',
    '',
    'Usage:',
    '  godpowers-mcp serve --project=.',
    '  godpowers-mcp setup --host=codex --project=. --write',
    '',
    'Commands:',
    '  serve    Run the read-only MCP server over stdio.',
    '  setup    Print or write an explicit host registration.',
    '',
    'Options:',
    '  --project=<path>       Project root read by MCP tools.',
    '  --runtime-root=<path>  Godpowers runtime root for local checkouts.',
    '  --host=<name>         Host registration target. Currently codex.',
    '  --home=<path>         Home directory for setup tests or explicit installs.',
    '  --write               Write setup output. Without this, setup is read-only.',
    '  --json                Emit JSON for setup.',
    '  -h, --help            Show this help.'
  ].join('\n');
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help || opts.command === 'help') {
    console.log(renderHelp());
    return;
  }

  if (opts.command === 'setup') {
    const plan = setup.setupPlan({
      host: opts.host,
      projectRoot: opts.project,
      runtimeRoot: opts.runtimeRoot,
      homeDir: opts.homeDir
    });
    const result = opts.write ? setup.writeRegistration(plan) : plan;
    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(setup.render(result));
    }
    return;
  }

  if (opts.command !== 'serve') {
    console.error(`Unknown command: ${opts.command}`);
    process.exit(1);
  }

  await server.serveStdio({
    projectRoot: opts.project,
    runtimeRoot: opts.runtimeRoot
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Godpowers MCP failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  renderHelp
};
