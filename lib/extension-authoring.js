/**
 * Extension authoring helpers.
 *
 * Creates a publishable Godpowers extension skeleton that follows the same
 * manifest, package, README, skill, agent, and workflow contracts as the
 * first-party packs.
 */

const fs = require('fs');
const path = require('path');

const extensions = require('./extensions');

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function write(filePath, content, overwrite) {
  if (fs.existsSync(filePath) && overwrite !== true) return false;
  ensureDir(filePath);
  fs.writeFileSync(filePath, content);
  return true;
}

function packageFolderName(name) {
  return name.replace(/^@/, '').replace(/\//g, '-');
}

function scaffold(outputRoot, opts = {}) {
  const name = opts.name || '@godpowers/custom-pack';
  const version = opts.version || '0.1.0';
  const skill = opts.skill || 'god-custom-pack';
  const agent = opts.agent || null;
  const workflow = opts.workflow || null;
  const range = opts.godpowersRange || '>=1.6.0';
  const folder = opts.folder || packageFolderName(name);
  const root = path.join(outputRoot, folder);
  const written = [];

  const manifest = [
    'apiVersion: godpowers/v1',
    'kind: Extension',
    'metadata:',
    `  name: ${name}`,
    `  version: ${version}`,
    '  description: Custom Godpowers extension pack.',
    'engines:',
    `  godpowers: ${range}`,
    'provides:',
    '  skills:',
    `    - ${skill}`,
    ...(agent ? ['  agents:', `    - ${agent}`] : []),
    ...(workflow ? ['  workflows:', `    - ${workflow}`] : []),
    ''
  ].join('\n');

  const pkg = {
    name,
    version,
    description: 'Custom Godpowers extension pack.',
    license: 'MIT',
    files: [
      'manifest.yaml',
      'README.md',
      'skills/',
      'agents/',
      'workflows/',
      'references/'
    ],
    peerDependencies: {
      godpowers: range
    },
    publishConfig: {
      access: 'public'
    }
  };

  const readme = [
    `# ${name}`,
    '',
    'Custom Godpowers extension pack.',
    '',
    '## Contents',
    '',
    `- Skill: ${skill}`,
    ...(agent ? [`- Agent: ${agent}`] : []),
    ...(workflow ? [`- Workflow: ${workflow}`] : []),
    ''
  ].join('\n');

  const skillMd = [
    '---',
    `name: ${skill}`,
    'description: |',
    '  Custom Godpowers extension command.',
    '',
    `  Triggers on: "${skill.replace(/^god-/, 'god ')}", "/${skill}"`,
    '---',
    '',
    `# /${skill}`,
    '',
    '- [DECISION] This extension command is scaffolded for project-specific behavior.',
    '- [OPEN QUESTION] Replace this placeholder with the command workflow. Owner: extension author. Due: before publish.',
    ''
  ].join('\n');

  if (write(path.join(root, 'manifest.yaml'), manifest, opts.overwrite)) written.push('manifest.yaml');
  if (write(path.join(root, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`, opts.overwrite)) written.push('package.json');
  if (write(path.join(root, 'README.md'), readme, opts.overwrite)) written.push('README.md');
  if (write(path.join(root, 'skills', `${skill}.md`), skillMd, opts.overwrite)) written.push(`skills/${skill}.md`);

  if (agent) {
    const agentMd = [
      '---',
      `name: ${agent}`,
      'description: Custom Godpowers extension specialist.',
      '---',
      '',
      `# ${agent}`,
      '',
      '- [DECISION] Follow the extension command handoff and return only user-facing progress.',
      ''
    ].join('\n');
    if (write(path.join(root, 'agents', `${agent}.md`), agentMd, opts.overwrite)) written.push(`agents/${agent}.md`);
  }

  if (workflow) {
    const workflowYaml = [
      'apiVersion: godpowers/v1',
      'kind: Workflow',
      `name: ${workflow}`,
      'steps:',
      `  - command: /${skill}`,
      ''
    ].join('\n');
    if (write(path.join(root, 'workflows', `${workflow}.yaml`), workflowYaml, opts.overwrite)) written.push(`workflows/${workflow}.yaml`);
  }

  const parsed = extensions.parseManifest(fs.readFileSync(path.join(root, 'manifest.yaml'), 'utf8')).manifest;
  const validation = extensions.validateManifest(parsed, opts.runtimeVersion || '1.6.0');

  return {
    path: root,
    name,
    version,
    written,
    validation
  };
}

module.exports = {
  scaffold,
  packageFolderName
};
