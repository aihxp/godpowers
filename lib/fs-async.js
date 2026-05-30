const fs = require('fs/promises');
const path = require('path');
const atomic = require('./atomic-write');

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (_) {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await atomic.writeJsonAtomicAsync(filePath, value);
  return value;
}

module.exports = {
  exists,
  readJson,
  writeJson,
  fs
};
