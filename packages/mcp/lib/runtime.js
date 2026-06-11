const fs = require('fs');
const path = require('path');

function exists(filePath) {
  return fs.existsSync(filePath);
}

function isRuntimeRoot(root) {
  if (!root) return false;
  const pkgPath = path.join(root, 'package.json');
  if (!exists(pkgPath)) return false;
  if (!exists(path.join(root, 'lib', 'dashboard.js'))) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.name === 'godpowers';
  } catch (error) {
    return false;
  }
}

function addCandidate(candidates, value) {
  if (!value) return;
  const resolved = path.resolve(value);
  if (!candidates.includes(resolved)) candidates.push(resolved);
}

function candidateRoots(opts = {}) {
  const candidates = [];
  addCandidate(candidates, opts.runtimeRoot);
  addCandidate(candidates, process.env.GODPOWERS_RUNTIME_ROOT);
  addCandidate(candidates, path.resolve(__dirname, '..', '..', '..'));
  addCandidate(candidates, process.cwd());

  try {
    const pkgPath = require.resolve('godpowers/package.json', {
      paths: [process.cwd(), __dirname]
    });
    addCandidate(candidates, path.dirname(pkgPath));
  } catch (error) {
    // Optional peer dependency. Local checkouts resolve through the candidates above.
  }

  return candidates;
}

function resolveRuntimeRoot(opts = {}) {
  for (const root of candidateRoots(opts)) {
    if (isRuntimeRoot(root)) return root;
  }
  throw new Error('Could not find a Godpowers runtime root. Pass --runtime-root or install godpowers beside @godpowers/mcp.');
}

function requireRuntime(moduleName, opts = {}) {
  const root = resolveRuntimeRoot(opts);
  return require(path.join(root, 'lib', `${moduleName}.js`));
}

function resolveProject(projectRoot) {
  return path.resolve(projectRoot || process.cwd());
}

function resolveProjectFile(projectRoot, filePath) {
  const root = resolveProject(projectRoot);
  if (!filePath) throw new Error('file path is required');
  const abs = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(root, filePath);
  const relative = path.relative(root, abs);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('artifact path must stay inside the project root');
  }
  return abs;
}

module.exports = {
  isRuntimeRoot,
  candidateRoots,
  resolveRuntimeRoot,
  requireRuntime,
  resolveProject,
  resolveProjectFile
};
