const { execFileSync } = require('child_process');

const STALE_MONTHS = 18;

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9]+/g, '');
}

function levenshtein(a, b) {
  a = normalizeName(a);
  b = normalizeName(b);
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

function monthsBetween(a, b) {
  return Math.abs((b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()));
}

function latestPublishedAt(metadata) {
  if (!metadata || !metadata.time) return null;
  const latest = metadata['dist-tags'] && metadata['dist-tags'].latest;
  const raw = latest && metadata.time[latest] ? metadata.time[latest] : metadata.time.modified;
  return raw ? new Date(raw) : null;
}

function repoUrl(metadata) {
  if (!metadata || !metadata.repository) return null;
  if (typeof metadata.repository === 'string') return metadata.repository;
  return metadata.repository.url || null;
}

function typoRisk(name, knownNames = []) {
  const risks = [];
  for (const known of knownNames) {
    if (normalizeName(name) === normalizeName(known)) continue;
    const distance = levenshtein(name, known);
    if (distance > 0 && distance <= 2) {
      risks.push({ known, distance });
    }
  }
  return risks.sort((a, b) => a.distance - b.distance);
}

function assessNpmMetadata(name, metadata, opts = {}) {
  const now = opts.now || new Date();
  const findings = [];
  if (!metadata || metadata.missing) {
    findings.push({
      severity: 'fail',
      code: 'package-missing',
      message: `${name} was not found in the npm registry data.`
    });
    return { status: 'fail', findings, signals: { exists: false } };
  }

  const risks = typoRisk(name, opts.knownNames || []);
  for (const risk of risks) {
    findings.push({
      severity: 'fail',
      code: 'typo-risk',
      message: `${name} is within edit distance ${risk.distance} of ${risk.known}.`
    });
  }

  const published = latestPublishedAt(metadata);
  if (!published) {
    findings.push({
      severity: 'warn',
      code: 'unknown-recency',
      message: `${name} has no publish timestamp in registry metadata.`
    });
  } else if (monthsBetween(published, now) > STALE_MONTHS) {
    findings.push({
      severity: 'warn',
      code: 'stale-package',
      message: `${name} latest release is older than ${STALE_MONTHS} months.`
    });
  }

  if (!repoUrl(metadata)) {
    findings.push({
      severity: 'warn',
      code: 'missing-repository',
      message: `${name} does not expose a repository URL.`
    });
  }

  const status = findings.some(f => f.severity === 'fail')
    ? 'fail'
    : findings.some(f => f.severity === 'warn')
      ? 'warn'
      : 'pass';

  return {
    status,
    findings,
    signals: {
      exists: true,
      latest: metadata['dist-tags'] && metadata['dist-tags'].latest,
      publishedAt: published ? published.toISOString() : null,
      repository: repoUrl(metadata)
    }
  };
}

function npmView(name) {
  try {
    const raw = execFileSync('npm', ['view', name, '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return JSON.parse(raw);
  } catch (error) {
    return { missing: true, error: error.message };
  }
}

function checkNpmPackage(name, opts = {}) {
  const metadata = opts.metadata || npmView(name);
  if (metadata && metadata.error && opts.failOnUnknown === false) {
    return {
      status: 'unknown',
      findings: [{
        severity: 'warn',
        code: 'registry-unavailable',
        message: `${name} could not be verified from npm metadata.`
      }],
      signals: { exists: null }
    };
  }
  return assessNpmMetadata(name, metadata, opts);
}

module.exports = {
  STALE_MONTHS,
  normalizeName,
  levenshtein,
  typoRisk,
  assessNpmMetadata,
  checkNpmPackage,
  latestPublishedAt
};
