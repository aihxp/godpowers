/**
 * File helpers shared by the installer and installer tests.
 */

const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function replaceExisting(dest) {
  try {
    const stat = fs.lstatSync(dest);
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      fs.rmSync(dest, { recursive: true, force: true });
    } else {
      fs.unlinkSync(dest);
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

function copyRecursive(src, dest) {
  const stat = fs.lstatSync(src);

  if (stat.isSymbolicLink()) {
    ensureDir(path.dirname(dest));
    replaceExisting(dest);
    fs.symlinkSync(fs.readlinkSync(src), dest);
    return;
  }

  if (stat.isDirectory()) {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      copyRecursive(path.join(src, entry.name), path.join(dest, entry.name));
    }
    return;
  }

  if (stat.isFile()) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    fs.chmodSync(dest, stat.mode);
  }
}

function copyRuntimeBundle(srcDir, destDir) {
  ensureDir(destDir);
  for (const dir of ['lib', 'routing', 'workflows', 'schema', 'templates', 'references']) {
    const src = path.join(srcDir, dir);
    if (fs.existsSync(src)) {
      copyRecursive(src, path.join(destDir, dir));
    }
  }
  const packageJson = path.join(srcDir, 'package.json');
  if (fs.existsSync(packageJson)) {
    fs.copyFileSync(packageJson, path.join(destDir, 'package.json'));
  }
}

module.exports = { ensureDir, copyRecursive, copyRuntimeBundle };
