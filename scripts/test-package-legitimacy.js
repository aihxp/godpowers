#!/usr/bin/env node

const legitimacy = require('../lib/package-legitimacy');
const { test, assert, report } = require('./test-harness');

function metadata(overrides = {}) {
  return {
    name: 'react',
    'dist-tags': { latest: '19.0.0' },
    time: {
      modified: '2026-01-01T00:00:00.000Z',
      '19.0.0': '2026-01-01T00:00:00.000Z'
    },
    repository: { url: 'git+https://github.com/facebook/react.git' },
    ...overrides
  };
}

test('assessNpmMetadata passes healthy metadata', () => {
  const result = legitimacy.assessNpmMetadata('react', metadata(), {
    now: new Date('2026-05-30T00:00:00.000Z'),
    knownNames: ['react']
  });
  assert(result.status === 'pass', `status: ${result.status}`);
  assert(result.signals.repository.includes('github.com'), 'repository missing');
});

test('assessNpmMetadata fails missing package', () => {
  const result = legitimacy.assessNpmMetadata('missing-package', { missing: true });
  assert(result.status === 'fail', `status: ${result.status}`);
  assert(result.findings.some(f => f.code === 'package-missing'), 'missing finding absent');
});

test('assessNpmMetadata fails typo risk', () => {
  const result = legitimacy.assessNpmMetadata('reaact', metadata({ name: 'reaact' }), {
    knownNames: ['react'],
    now: new Date('2026-05-30T00:00:00.000Z')
  });
  assert(result.status === 'fail', `status: ${result.status}`);
  assert(result.findings.some(f => f.code === 'typo-risk'), 'typo finding absent');
});

test('assessNpmMetadata warns on stale package and missing repository', () => {
  const result = legitimacy.assessNpmMetadata('oldpkg', metadata({
    repository: null,
    time: {
      modified: '2023-01-01T00:00:00.000Z',
      '1.0.0': '2023-01-01T00:00:00.000Z'
    },
    'dist-tags': { latest: '1.0.0' }
  }), {
    now: new Date('2026-05-30T00:00:00.000Z')
  });
  assert(result.status === 'warn', `status: ${result.status}`);
  assert(result.findings.some(f => f.code === 'stale-package'), 'stale finding absent');
  assert(result.findings.some(f => f.code === 'missing-repository'), 'repo finding absent');
});

test('levenshtein normalizes package punctuation', () => {
  assert(legitimacy.levenshtein('@scope/react', 'scope-react') === 0, 'normalization drift');
});

report('Package legitimacy behavioral tests');
