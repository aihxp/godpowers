const fs = require('fs');
const path = require('path');

function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return {};
  const end = text.indexOf('\n---', 4);
  if (end === -1) return {};
  const out = {};
  for (const line of text.slice(4, end).split('\n')) {
    const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

function listSkills(rootDir = path.join(__dirname, '..', 'skills')) {
  return fs.readdirSync(rootDir)
    .filter((file) => /^god.*\.md$/.test(file))
    .sort()
    .map((file) => {
      const full = path.join(rootDir, file);
      const text = fs.readFileSync(full, 'utf8');
      const frontmatter = parseFrontmatter(text);
      return {
        file,
        command: `/${path.basename(file, '.md')}`,
        name: frontmatter.name || path.basename(file, '.md'),
        description: frontmatter.description || '',
        path: full
      };
    });
}

function commandNames(rootDir) {
  return listSkills(rootDir).map((skill) => skill.command);
}

module.exports = {
  parseFrontmatter,
  listSkills,
  commandNames
};
