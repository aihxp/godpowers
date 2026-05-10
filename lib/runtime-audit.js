/**
 * Runtime Audit
 *
 * Verify that the running app matches DESIGN.md. Uses lib/browser-bridge
 * to drive a headless browser; compares computed styles to declared
 * tokens; runs accessibility checks on real DOM.
 *
 * Public API:
 *   extractComputedStyles(page, selectors) -> map
 *   compareToDesign(rendered, designContent) -> { findings, summary }
 *   checkContrastRealDOM(page) -> findings
 *   auditPage(url, designContent, opts) -> structured result
 */

const fs = require('fs');
const path = require('path');

const designSpec = require('./design-spec');
const browserBridge = require('./browser-bridge');

/**
 * Default selectors to probe. Maps a logical name to a CSS selector.
 * Override per-project via opts.selectors.
 */
const DEFAULT_SELECTORS = {
  body: 'body',
  primaryButton: 'button[type="submit"], .btn-primary, [data-design-component="button-primary"]',
  card: '.card, [data-design-component="card"]',
  heading1: 'h1',
  bodyText: 'p',
  link: 'a'
};

/**
 * Extract computed styles for a set of selectors via Playwright/Vercel.
 * Returns: { selector: { color, backgroundColor, fontFamily, fontSize, ... } }
 *
 * Optional in tests: opts.mockStyles can stub the result without launching
 * a browser.
 */
async function extractComputedStyles(page, selectors, opts = {}) {
  if (opts.mockStyles) return opts.mockStyles;

  const probe = selectors || DEFAULT_SELECTORS;
  const results = {};
  for (const [name, selector] of Object.entries(probe)) {
    try {
      const handle = await page.$(selector);
      if (!handle) {
        results[name] = { found: false };
        continue;
      }
      const computed = await page.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          borderRadius: cs.borderRadius,
          padding: cs.padding,
          margin: cs.margin,
          lineHeight: cs.lineHeight
        };
      }, handle);
      results[name] = { found: true, ...computed };
    } catch (e) {
      results[name] = { found: false, error: e.message };
    }
  }
  return results;
}

/**
 * Convert any color string to its sRGB hex form (best effort).
 * Handles "rgb(r, g, b)" "rgba(r, g, b, a)" and hex.
 */
function normalizeColor(color) {
  if (!color) return null;
  const s = String(color).trim().toLowerCase();
  if (s.startsWith('#')) return s.slice(0, 7); // #RRGGBB or #RRGGBBAA -> #RRGGBB
  const m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    const [r, g, b] = [+m[1], +m[2], +m[3]];
    const hex = '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
    return hex;
  }
  return null; // OKLCH, named colors, etc. are returned by the browser only as rgb()
}

/**
 * Compare extracted styles against DESIGN.md tokens.
 * Returns findings with severity.
 */
function compareToDesign(rendered, designContent) {
  const findings = [];
  if (!designContent) return { findings, summary: { errors: 0, warnings: 0, infos: 0 } };
  const parsed = designSpec.parse(designContent);
  if (!parsed.frontmatter) return { findings, summary: { errors: 0, warnings: 0, infos: 0 } };
  const fm = parsed.frontmatter;

  // Check primary button background matches a known color token
  if (rendered.primaryButton && rendered.primaryButton.found) {
    const renderedBg = normalizeColor(rendered.primaryButton.backgroundColor);
    if (renderedBg) {
      const tokens = collectColorTokens(fm);
      const match = tokens.find(t => normalizeColor(t.value) === renderedBg);
      if (!match) {
        findings.push({
          severity: 'warning',
          kind: 'color-no-match',
          selector: 'primaryButton',
          message: `Primary button background "${rendered.primaryButton.backgroundColor}" does not match any DESIGN.md color token.`,
          rendered: renderedBg
        });
      }
    }
  }

  // Check body font-family contains a declared family
  if (rendered.bodyText && rendered.bodyText.found && fm.typography) {
    const renderedFamily = String(rendered.bodyText.fontFamily || '').toLowerCase();
    const declaredFamilies = collectFontFamilies(fm.typography);
    const matchesAny = declaredFamilies.some(d =>
      d && renderedFamily.includes(String(d).toLowerCase().split(',')[0].replace(/['"]/g, '').trim())
    );
    if (declaredFamilies.length > 0 && !matchesAny) {
      findings.push({
        severity: 'warning',
        kind: 'typography-no-match',
        selector: 'bodyText',
        message: `Body font "${rendered.bodyText.fontFamily}" does not match any DESIGN.md typography family.`,
        rendered: rendered.bodyText.fontFamily,
        declared: declaredFamilies
      });
    }
  }

  // Check border-radius on cards matches `rounded` tokens
  if (rendered.card && rendered.card.found && fm.rounded) {
    const renderedRadius = String(rendered.card.borderRadius || '').trim();
    const declared = Object.values(fm.rounded || {}).map(String);
    if (declared.length > 0 && !declared.includes(renderedRadius)) {
      findings.push({
        severity: 'info',
        kind: 'rounded-no-match',
        selector: 'card',
        message: `Card border-radius "${renderedRadius}" does not match any DESIGN.md rounded token.`,
        rendered: renderedRadius,
        declared
      });
    }
  }

  const summary = {
    errors: findings.filter(f => f.severity === 'error').length,
    warnings: findings.filter(f => f.severity === 'warning').length,
    infos: findings.filter(f => f.severity === 'info').length
  };
  return { findings, summary };
}

/**
 * Run an axe-core accessibility audit on the rendered page.
 * In tests, opts.mockAxeResults can stub.
 */
async function checkContrastRealDOM(page, opts = {}) {
  if (opts.mockAxeResults) return opts.mockAxeResults;
  // Run an axe-like contrast check via direct DOM evaluation. Not a full
  // axe-core integration; that would require pulling axe into the page.
  // V1: extract foreground and background of text elements, compute contrast,
  // flag those below 4.5:1.
  try {
    const violations = await page.evaluate(() => {
      const findings = [];
      const els = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
      function lum(rgb) {
        const m = rgb.match(/\d+/g);
        if (!m) return null;
        const norm = m.slice(0, 3).map(n => {
          const c = +n / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
      }
      for (const el of els) {
        if (!el.textContent || !el.textContent.trim()) continue;
        const cs = window.getComputedStyle(el);
        const lFg = lum(cs.color);
        let bgEl = el;
        let bgRgb = cs.backgroundColor;
        while (bgEl && (bgRgb === 'rgba(0, 0, 0, 0)' || bgRgb === 'transparent')) {
          bgEl = bgEl.parentElement;
          if (!bgEl) break;
          bgRgb = window.getComputedStyle(bgEl).backgroundColor;
        }
        const lBg = lum(bgRgb);
        if (lFg === null || lBg === null) continue;
        const lighter = Math.max(lFg, lBg);
        const darker = Math.min(lFg, lBg);
        const ratio = (lighter + 0.05) / (darker + 0.05);
        if (ratio < 4.5) {
          findings.push({
            tag: el.tagName.toLowerCase(),
            text: el.textContent.slice(0, 40),
            ratio: ratio.toFixed(2),
            fg: cs.color,
            bg: bgRgb
          });
        }
      }
      return findings;
    });
    return violations.map(v => ({
      severity: 'error',
      kind: 'wcag-contrast',
      message: `WCAG AA contrast fail: ${v.tag} "${v.text}" has ratio ${v.ratio}:1 (need 4.5:1).`,
      ...v
    }));
  } catch (e) {
    return [{ severity: 'info', kind: 'audit-error', message: e.message }];
  }
}

/**
 * Save a screenshot of the page to the runtime dir.
 */
async function screenshot(page, dir, name) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

/**
 * High-level: audit a URL against DESIGN.md.
 *
 * 1. Launch headless browser
 * 2. Navigate to URL
 * 3. Extract computed styles for selectors
 * 4. Compare to DESIGN.md
 * 5. Run contrast check on real DOM
 * 6. Take screenshot
 * 7. Close browser
 * 8. Return findings + report
 */
async function auditPage(url, designContent, opts = {}) {
  const projectRoot = opts.projectRoot || process.cwd();
  const runId = opts.runId || browserBridge.newRunId();
  const outDir = browserBridge.runtimeDir(projectRoot, runId);

  // Allow injection for tests
  if (opts.mockBrowserResult) {
    return {
      runId,
      url,
      findings: opts.mockBrowserResult.findings || [],
      summary: opts.mockBrowserResult.summary || { errors: 0, warnings: 0, infos: 0 },
      screenshots: [],
      backend: 'mock'
    };
  }

  const launched = await browserBridge.launch({ projectRoot, backend: opts.backend });
  if (launched.error) {
    return {
      runId,
      url,
      error: launched.error,
      findings: [],
      summary: { errors: 0, warnings: 0, infos: 0 }
    };
  }

  const findings = [];
  const screenshots = [];
  try {
    const page = await browserBridge.newPage(launched.browser);
    await page.goto(url);

    const styles = await extractComputedStyles(page, opts.selectors);
    const compareResult = compareToDesign(styles, designContent);
    findings.push(...compareResult.findings);

    const contrastFindings = await checkContrastRealDOM(page);
    findings.push(...contrastFindings);

    const shotPath = await screenshot(page, path.join(outDir, 'screenshots'), 'main');
    screenshots.push(shotPath);
  } catch (e) {
    findings.push({ severity: 'error', kind: 'audit-error', message: e.message });
  } finally {
    await browserBridge.close(launched.browser);
  }

  const summary = {
    errors: findings.filter(f => f.severity === 'error').length,
    warnings: findings.filter(f => f.severity === 'warning').length,
    infos: findings.filter(f => f.severity === 'info').length
  };

  // Persist report
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'audit-report.json'),
    JSON.stringify({ runId, url, findings, summary, screenshots, backend: launched.backend }, null, 2)
  );

  return { runId, url, findings, summary, screenshots, backend: launched.backend };
}

// ============================================================================
// Helpers
// ============================================================================

function collectColorTokens(fm) {
  const tokens = [];
  function walk(obj, prefix) {
    for (const [k, v] of Object.entries(obj)) {
      const here = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null) walk(v, here);
      else tokens.push({ path: here, value: String(v) });
    }
  }
  if (fm.colors) walk(fm.colors, 'colors');
  return tokens;
}

function collectFontFamilies(typography) {
  const families = [];
  for (const v of Object.values(typography || {})) {
    if (typeof v === 'object' && v && v.fontFamily) {
      families.push(v.fontFamily);
    }
  }
  return families;
}

module.exports = {
  DEFAULT_SELECTORS,
  extractComputedStyles,
  compareToDesign,
  checkContrastRealDOM,
  screenshot,
  auditPage,
  normalizeColor,
  collectColorTokens
};
