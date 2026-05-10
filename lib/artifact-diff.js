/**
 * Artifact Diff
 *
 * Regression detection between two versions of an artifact. Finds:
 *   - Removed sections (regression)
 *   - DECISION downgraded to HYPOTHESIS (regression)
 *   - Reduced acceptance criteria (regression)
 *   - New open questions without resolution (info)
 *   - Added sections (info)
 *
 * Public API:
 *   diffArtifacts(oldContent, newContent) -> { changes, regression }
 */

/**
 * Extract markdown sections (## headings) into a map: { heading: body }.
 */
function extractSections(content) {
  const sections = {};
  const lines = content.split('\n');
  let currentHeading = null;
  let buffer = [];
  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      if (currentHeading) {
        sections[currentHeading] = buffer.join('\n').trim();
      }
      currentHeading = m[1].trim();
      buffer = [];
    } else if (currentHeading) {
      buffer.push(line);
    }
  }
  if (currentHeading) {
    sections[currentHeading] = buffer.join('\n').trim();
  }
  return sections;
}

/**
 * Count occurrences of label tags ([DECISION], [HYPOTHESIS], etc.) in content.
 */
function countLabels(content) {
  const counts = {
    DECISION: (content.match(/\[DECISION\]/g) || []).length,
    HYPOTHESIS: (content.match(/\[HYPOTHESIS\]/g) || []).length,
    'OPEN QUESTION': (content.match(/\[OPEN QUESTION\]/g) || []).length
  };
  return counts;
}

/**
 * Count list items (bullets) in content.
 */
function countListItems(content) {
  return (content.match(/^[\s]*[-*]\s+/gm) || []).length;
}

/**
 * Diff two artifact versions and detect regressions.
 *
 * Returns:
 *   {
 *     regression: bool,
 *     changes: [{ kind, severity, section, message }]
 *   }
 */
function diffArtifacts(oldContent, newContent) {
  const changes = [];
  const oldSections = extractSections(oldContent);
  const newSections = extractSections(newContent);

  // Check for removed sections
  for (const heading of Object.keys(oldSections)) {
    if (!(heading in newSections)) {
      changes.push({
        kind: 'section-removed',
        severity: 'error',
        section: heading,
        message: `Section "${heading}" was removed.`
      });
    }
  }

  // Check for added sections (informational)
  for (const heading of Object.keys(newSections)) {
    if (!(heading in oldSections)) {
      changes.push({
        kind: 'section-added',
        severity: 'info',
        section: heading,
        message: `Section "${heading}" was added.`
      });
    }
  }

  // Check for label downgrades (DECISION -> HYPOTHESIS) per section
  for (const heading of Object.keys(newSections)) {
    if (!(heading in oldSections)) continue;
    const oldCounts = countLabels(oldSections[heading]);
    const newCounts = countLabels(newSections[heading]);

    if (newCounts.DECISION < oldCounts.DECISION) {
      const dropped = oldCounts.DECISION - newCounts.DECISION;
      changes.push({
        kind: 'decision-downgraded',
        severity: 'warning',
        section: heading,
        message: `${dropped} [DECISION] tag(s) lost in section "${heading}" (was ${oldCounts.DECISION}, now ${newCounts.DECISION}).`
      });
    }

    // Reduced acceptance criteria: if list item count drops in MUST/SHOULD requirements
    if (heading.match(/Functional Requirements|Requirements/i)) {
      const oldItems = countListItems(oldSections[heading]);
      const newItems = countListItems(newSections[heading]);
      if (newItems < oldItems) {
        changes.push({
          kind: 'acceptance-reduced',
          severity: 'warning',
          section: heading,
          message: `Acceptance criteria reduced in "${heading}" (${oldItems} -> ${newItems} items).`
        });
      }
    }

    // New open questions without resolution
    if (heading.match(/Open Questions/i)) {
      const oldOQ = oldCounts['OPEN QUESTION'];
      const newOQ = newCounts['OPEN QUESTION'];
      if (newOQ > oldOQ) {
        changes.push({
          kind: 'open-question-added',
          severity: 'info',
          section: heading,
          message: `${newOQ - oldOQ} new open question(s) added.`
        });
      }
    }
  }

  // Determine regression: any error or warning is a regression
  const regression = changes.some(c => c.severity === 'error' || c.severity === 'warning');

  return { regression, changes };
}

/**
 * Format diff as human-readable report.
 */
function formatDiff(diff) {
  const lines = [];
  lines.push(`Regression: ${diff.regression ? 'YES' : 'no'}`);
  lines.push(`Changes: ${diff.changes.length}`);
  for (const c of diff.changes) {
    lines.push(`  [${c.kind}] ${c.severity.toUpperCase()} (${c.section}): ${c.message}`);
  }
  return lines.join('\n');
}

module.exports = {
  diffArtifacts,
  extractSections,
  countLabels,
  countListItems,
  formatDiff
};
