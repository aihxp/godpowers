const path = require('path');
const { RUNTIMES } = require('./installer-runtimes');

const COMMANDS = new Set([
  'status',
  'next',
  'quick-proof',
  'automation-status',
  'automation-setup',
  'dogfood',
  'extension-scaffold'
]);

function parseArgs(argv, cwd = process.cwd()) {
  const args = argv.slice(2);
  const opts = {
    command: null,
    project: cwd,
    json: false,
    brief: false,
    extensionName: null,
    extensionOutput: cwd,
    extensionSkill: null,
    extensionAgent: null,
    extensionWorkflow: null,
    runtimes: [],
    global: false,
    local: false,
    all: false,
    help: false,
    uninstall: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (COMMANDS.has(arg)) {
      opts.command = arg;
      continue;
    }

    switch (arg) {
      case '--json':
        opts.json = true;
        break;
      case '--brief':
        opts.brief = true;
        break;
      case '--project':
        if (args[i + 1]) {
          opts.project = path.resolve(args[i + 1]);
          i++;
        }
        break;
      case '-g':
      case '--global':
        opts.global = true;
        break;
      case '-l':
      case '--local':
        opts.local = true;
        break;
      case '--all':
        opts.all = true;
        break;
      case '-h':
      case '--help':
        opts.help = true;
        break;
      case '-u':
      case '--uninstall':
        opts.uninstall = true;
        break;
      default:
        if (arg.startsWith('--project=')) {
          opts.project = path.resolve(arg.slice('--project='.length));
        } else if (arg.startsWith('--name=')) {
          opts.extensionName = arg.slice('--name='.length);
        } else if (arg.startsWith('--output=')) {
          opts.extensionOutput = path.resolve(arg.slice('--output='.length));
        } else if (arg.startsWith('--skill=')) {
          opts.extensionSkill = arg.slice('--skill='.length);
        } else if (arg.startsWith('--agent=')) {
          opts.extensionAgent = arg.slice('--agent='.length);
        } else if (arg.startsWith('--workflow=')) {
          opts.extensionWorkflow = arg.slice('--workflow='.length);
        } else if (arg.startsWith('--') && RUNTIMES[arg.slice(2)]) {
          opts.runtimes.push(arg.slice(2));
        }
        break;
    }
  }

  return opts;
}

module.exports = {
  COMMANDS,
  parseArgs
};
