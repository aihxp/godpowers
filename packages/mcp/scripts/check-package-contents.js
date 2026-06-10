#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const REQUIRED = [
  'package.json',
  'README.md',
  'LICENSE',
  'bin/godpowers-mcp.js',
  'lib/runtime.js',
  'lib/tools.js',
  'lib/server.js',
  'lib/setup.js'
];

const FORBIDDEN_PREFIXES = [
  'scripts/',
  'node_modules/'
];

function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'godpowers-mcp-pack-'));
  let pack;
  try {
    const raw = execFileSync('npm', ['pack', '--json', '--pack-destination', tmp], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    pack = JSON.parse(raw)[0];
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  if (!pack || pack.name !== '@godpowers/mcp') {
    throw new Error(`expected @godpowers/mcp package, got ${pack && pack.name}`);
  }
  const files = new Set(pack.files.map((file) => file.path));
  const missing = REQUIRED.filter((file) => !files.has(file));
  const forbidden = [...files].filter((file) => FORBIDDEN_PREFIXES.some((prefix) => file.startsWith(prefix)));
  if (missing.length > 0) {
    throw new Error(`missing package files: ${missing.join(', ')}`);
  }
  if (forbidden.length > 0) {
    throw new Error(`package includes local-only files: ${forbidden.join(', ')}`);
  }
  console.log(`  + @godpowers/mcp package contents verified: ${pack.entryCount} files`);
}

try {
  main();
} catch (error) {
  console.error(`  x @godpowers/mcp package contents check failed: ${error.message}`);
  process.exit(1);
}
