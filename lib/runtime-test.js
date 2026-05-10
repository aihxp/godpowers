/**
 * Runtime Test
 *
 * Run PRD acceptance criteria against the rendered app via headless
 * browser. Each P-MUST/SHOULD/COULD requirement may include an
 * acceptance criterion phrased as a user-flow that the runtime tester
 * will execute.
 *
 * Public API:
 *   extractAcceptanceCriteria(prdContent) -> [{ id, text, parsedFlow }]
 *   parseFlow(text) -> { steps, expectedOutcome } | null
 *   runFlow(page, flow) -> { passed, steps, error?, screenshots }
 *   verifyRequirement(page, requirement, opts) -> structured result
 *   runAllForUrl(url, prdContent, opts) -> { results, summary, runId }
 */

const fs = require('fs');
const path = require('path');

const browserBridge = require('./browser-bridge');

/**
 * Extract acceptance criteria from PRD content. Looks for bullet items
 * that mention a P-MUST/SHOULD/COULD ID and "Acceptance:" pattern.
 */
function extractAcceptanceCriteria(prdContent) {
  const results = [];
  if (!prdContent) return results;

  // Walk lines collecting multi-line bullets
  const lines = prdContent.split('\n');
  let current = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      if (current) results.push(current);
      current = { rawText: trimmed.replace(/^[-*]\s*/, '') };
    } else if (current && trimmed && /^\s/.test(line)) {
      current.rawText += ' ' + trimmed;
    } else if (!trimmed) {
      if (current) {
        results.push(current);
        current = null;
      }
    }
  }
  if (current) results.push(current);

  // Filter to those mentioning a stable ID + acceptance
  return results
    .filter(r => /\bP-(MUST|SHOULD|COULD)-\d+\b/.test(r.rawText) || /Acceptance\s*:/i.test(r.rawText))
    .map(r => {
      const idMatch = r.rawText.match(/\bP-(MUST|SHOULD|COULD)-\d+\b/);
      const acceptMatch = r.rawText.match(/Acceptance\s*:\s*(.+)$/i);
      return {
        id: idMatch ? idMatch[0] : null,
        text: r.rawText,
        acceptanceText: acceptMatch ? acceptMatch[1].trim() : null,
        parsedFlow: parseFlow(acceptMatch ? acceptMatch[1] : r.rawText)
      };
    })
    .filter(r => r.id);
}

/**
 * Parse acceptance text into a runnable flow.
 *
 * Phase 15 expansion: 8+ verb forms, sequential expectations, negative
 * expectations, multi-action sentences. Falls back to null if no
 * recognizable steps found.
 *
 * Verb classes:
 *   navigate: navigate to | visits | opens | goes to | arrives at
 *   click:    clicks | taps | presses | hits (+ on)
 *   type:     types | enters | fills | inputs (+ in/into)
 *   expect:   sees | expects | displays | shows | observes |
 *             can see | should see
 *   not-expect: does not see | should not see | cannot see
 */
function parseFlow(text) {
  if (!text) return null;
  const steps = [];

  // Split on commas/semicolons/then to find distinct steps
  const segments = text.split(/[,;]\s+|\s+then\s+/i);

  for (const segment of segments) {
    const seg = segment.trim();

    // Negative expect: "does not see", "should not see", "cannot see"
    const notExpectMatch = seg.match(/(?:does\s+not|should\s+not|cannot)\s+(?:see|find|view)\s+["']?([^."']+)["']?/i);
    if (notExpectMatch) {
      steps.push({ kind: 'not-expect', target: notExpectMatch[1].trim() });
      continue;
    }

    // Navigation: navigate(s) to | visits | opens | goes to | arrives at
    const navMatch = seg.match(/(?:navigates?\s+to|visits?|opens?|goes?\s+to|arrives?\s+at|loads?)\s+([\w\/\.\-:?=&]+)/i);
    if (navMatch) {
      steps.push({ kind: 'navigate', target: navMatch[1] });
      continue;
    }

    // Click: clicks | taps | presses | hits + on
    const clickMatch = seg.match(/(?:clicks?(?:\s+on)?|taps?(?:\s+on)?|presses?(?:\s+the)?|hits?(?:\s+the)?)\s+["']?([^."']+?)["']?(?:\s|$)/i);
    if (clickMatch) {
      steps.push({ kind: 'click', target: clickMatch[1].trim() });
      continue;
    }

    // Type with quoted text: types "hello world"
    const typeQuotedMatch = seg.match(/(?:types?|enters?|fills?(?:\s+in)?|inputs?)\s+["']([^"']+)["']/i);
    if (typeQuotedMatch) {
      steps.push({ kind: 'type', text: typeQuotedMatch[1] });
      continue;
    }

    // Type into field: enters X in field
    const typeFieldMatch = seg.match(/(?:types?|enters?|fills?|inputs?)\s+([\w@.-]+)\s+(?:in|into)\s+(?:the\s+)?["']?([\w\s-]+)["']?\s+(?:field|input|box)/i);
    if (typeFieldMatch) {
      steps.push({ kind: 'type', text: typeFieldMatch[1], field: typeFieldMatch[2].trim() });
      continue;
    }

    // Positive expect: sees | expects | displays | shows | observes |
    // can see | should see | should display | lands on | arrives on | completes
    const seeMatch = seg.match(/(?:can\s+see|should\s+see|should\s+display|sees?|expects?|displays?|shows?|observes?|lands?\s+on|arrives?\s+on|completes?)\s+["']?([^."']+?)["']?(?:\s|$)/i);
    if (seeMatch) {
      steps.push({ kind: 'expect', target: seeMatch[1].trim() });
      continue;
    }
  }

  if (steps.length === 0) return null;
  return { steps, raw: text };
}

/**
 * Run a parsed flow. Backend-aware:
 * - agent-browser: uses driver methods (goto, click, type, isVisible)
 *   that map cleanly to its CLI semantics.
 * - Playwright/Vercel: uses traditional page.click("text=..."), page.keyboard.type, etc.
 *
 * Returns { passed, steps, error?, screenshots }.
 */
async function runFlow(page, flow, opts = {}) {
  if (opts.mockResult) return opts.mockResult;
  if (!flow || !flow.steps) {
    return { passed: false, steps: [], error: 'no-flow-parsed' };
  }

  // Detect agent-browser driver via interface shape
  const isAgentBrowser = page && typeof page.goto === 'function' &&
                         typeof page.snapshot === 'function' &&
                         typeof page.$ !== 'function';

  const stepResults = [];
  for (const step of flow.steps) {
    try {
      if (isAgentBrowser) {
        // agent-browser path: semantic locators (find text "...")
        if (step.kind === 'navigate') {
          await page.goto(step.target);
          stepResults.push({ ...step, passed: true });
        } else if (step.kind === 'click') {
          // agent-browser supports `find text "Submit" click` natively
          // Use that via the driver's click; falls back to selector
          await page.click(step.target);
          stepResults.push({ ...step, passed: true });
        } else if (step.kind === 'type') {
          // agent-browser: type without selector hits current focus
          await page.type('', step.text).catch(() =>
            page._run(['keyboard', 'type', step.text])
          );
          stepResults.push({ ...step, passed: true });
        } else if (step.kind === 'expect') {
          const visible = await page.isVisible(step.target);
          stepResults.push({ ...step, passed: visible });
          if (!visible) {
            return { passed: false, steps: stepResults, error: `expected "${step.target}" not visible` };
          }
        } else {
          stepResults.push({ ...step, passed: false, error: 'unknown-step-kind' });
        }
        continue;
      }

      if (step.kind === 'navigate') {
        await page.goto(step.target);
        stepResults.push({ ...step, passed: true });
      } else if (step.kind === 'click') {
        // Try to click by visible text or selector
        await page.click(`text="${step.target}"`).catch(() => page.click(step.target));
        stepResults.push({ ...step, passed: true });
      } else if (step.kind === 'type') {
        await page.keyboard.type(step.text);
        stepResults.push({ ...step, passed: true });
      } else if (step.kind === 'expect') {
        const visible = await page.isVisible(`text="${step.target}"`).catch(() => false);
        stepResults.push({ ...step, passed: visible });
        if (!visible) {
          return { passed: false, steps: stepResults, error: `expected "${step.target}" not visible` };
        }
      } else {
        stepResults.push({ ...step, passed: false, error: 'unknown-step-kind' });
      }
    } catch (e) {
      stepResults.push({ ...step, passed: false, error: e.message });
      return { passed: false, steps: stepResults, error: e.message };
    }
  }
  return { passed: stepResults.every(s => s.passed), steps: stepResults };
}

/**
 * Verify a single requirement.
 */
async function verifyRequirement(page, requirement, opts = {}) {
  if (!requirement.parsedFlow) {
    return {
      id: requirement.id,
      passed: false,
      reason: 'no-runnable-flow-parsed-from-acceptance',
      acceptanceText: requirement.acceptanceText
    };
  }
  const flowResult = await runFlow(page, requirement.parsedFlow, opts);
  return {
    id: requirement.id,
    passed: flowResult.passed,
    steps: flowResult.steps,
    error: flowResult.error
  };
}

/**
 * Top-level: run all PRD-derived flows against a URL.
 */
async function runAllForUrl(url, prdContent, opts = {}) {
  const projectRoot = opts.projectRoot || process.cwd();
  const runId = opts.runId || browserBridge.newRunId();
  const outDir = browserBridge.runtimeDir(projectRoot, runId);
  const requirements = extractAcceptanceCriteria(prdContent);

  if (opts.mockResult) {
    return {
      runId,
      url,
      results: opts.mockResult.results || [],
      summary: opts.mockResult.summary || { passed: 0, failed: 0, total: 0 },
      backend: 'mock'
    };
  }

  if (requirements.length === 0) {
    return {
      runId,
      url,
      results: [],
      summary: { passed: 0, failed: 0, total: 0 },
      reason: 'no-requirements-with-runnable-acceptance'
    };
  }

  const launched = await browserBridge.launch({ projectRoot, backend: opts.backend });
  if (launched.error) {
    return {
      runId,
      url,
      error: launched.error,
      results: [],
      summary: { passed: 0, failed: 0, total: requirements.length }
    };
  }

  const results = [];
  try {
    const page = await browserBridge.newPage(launched.browser);
    await page.goto(url);
    for (const req of requirements) {
      const r = await verifyRequirement(page, req, opts);
      results.push(r);
    }
  } finally {
    await browserBridge.close(launched.browser);
  }

  const summary = {
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    total: results.length
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'test-report.json'),
    JSON.stringify({ runId, url, results, summary, backend: launched.backend }, null, 2)
  );

  return { runId, url, results, summary, backend: launched.backend };
}

module.exports = {
  extractAcceptanceCriteria,
  parseFlow,
  runFlow,
  verifyRequirement,
  runAllForUrl
};
