const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

function tempPathFor(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  return path.join(dir, `.${base}.${process.pid}.${Date.now()}.tmp`);
}

function validateContent(content, validate) {
  if (typeof validate === 'function') validate(content);
}

function writeFileAtomic(filePath, content, opts = {}) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = tempPathFor(filePath);
  try {
    fs.writeFileSync(tmp, content);
    validateContent(content, opts.validateContent);
    if (typeof opts.validateFile === 'function') opts.validateFile(tmp);
    fs.renameSync(tmp, filePath);
    return filePath;
  } catch (error) {
    try {
      fs.rmSync(tmp, { force: true });
    } catch (_) {
      // Best-effort cleanup. The original file is still untouched.
    }
    throw error;
  }
}

async function writeFileAtomicAsync(filePath, content, opts = {}) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = tempPathFor(filePath);
  try {
    await fsp.writeFile(tmp, content);
    validateContent(content, opts.validateContent);
    if (typeof opts.validateFile === 'function') await opts.validateFile(tmp);
    await fsp.rename(tmp, filePath);
    return filePath;
  } catch (error) {
    try {
      await fsp.rm(tmp, { force: true });
    } catch (_) {
      // Best-effort cleanup. The original file is still untouched.
    }
    throw error;
  }
}

function jsonContent(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

function writeJsonAtomic(filePath, value, opts = {}) {
  const content = jsonContent(value);
  return writeFileAtomic(filePath, content, {
    ...opts,
    validateContent: text => {
      JSON.parse(text);
      validateContent(text, opts.validateContent);
    }
  });
}

async function writeJsonAtomicAsync(filePath, value, opts = {}) {
  const content = jsonContent(value);
  return writeFileAtomicAsync(filePath, content, {
    ...opts,
    validateContent: text => {
      JSON.parse(text);
      validateContent(text, opts.validateContent);
    }
  });
}

module.exports = {
  tempPathFor,
  writeFileAtomic,
  writeFileAtomicAsync,
  writeJsonAtomic,
  writeJsonAtomicAsync
};
