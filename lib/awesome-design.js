/**
 * Awesome DESIGN.md catalog integration
 *
 * Detect when a user's PRD / PRODUCT.md / free-text intent mentions a
 * known site, then offer the corresponding curated DESIGN.md from
 * VoltAgent's awesome-design-md collection
 * (https://github.com/VoltAgent/awesome-design-md, MIT license).
 *
 * Strategy:
 *   - Fixed catalog of 71 slugs (matches the repo as of 2026-05-10)
 *   - Per-project cache at .godpowers/cache/awesome-design/<slug>.md
 *   - Fetch lazily (no upfront vendoring)
 *   - Identify mentions via case-insensitive name + display-name match
 *
 * Public API:
 *   list() -> [{ slug, displayName, category, url }, ...]
 *   lookupSite(name) -> entry or null
 *   extractSiteReferences(text) -> [...entries]
 *   cachePath(projectRoot, slug) -> string
 *   isCached(projectRoot, slug) -> bool
 *   fetchDesign(projectRoot, slug, opts) -> { content, cached, error }
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const RAW_BASE = 'https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md';
const PREVIEW_BASE = 'https://getdesign.md';

/**
 * Catalog. Each entry has:
 *   slug         - the URL slug used in the repo (e.g., 'linear.app')
 *   displayName  - the human-readable name shown in README
 *   category     - one of: ai-llm, dev-tools, backend-data, productivity,
 *                  design-tools, fintech, ecommerce, media-consumer, automotive
 *   aliases      - array of common forms (lowercased, no spaces)
 */
const CATALOG = [
  // AI & LLM Platforms
  { slug: 'claude', displayName: 'Claude', category: 'ai-llm', aliases: ['claude', 'anthropic'] },
  { slug: 'cohere', displayName: 'Cohere', category: 'ai-llm', aliases: ['cohere'] },
  { slug: 'elevenlabs', displayName: 'ElevenLabs', category: 'ai-llm', aliases: ['elevenlabs', '11labs'] },
  { slug: 'minimax', displayName: 'Minimax', category: 'ai-llm', aliases: ['minimax'] },
  { slug: 'mistral.ai', displayName: 'Mistral AI', category: 'ai-llm', aliases: ['mistral', 'mistralai', 'mistral-ai'] },
  { slug: 'ollama', displayName: 'Ollama', category: 'ai-llm', aliases: ['ollama'] },
  { slug: 'opencode.ai', displayName: 'OpenCode AI', category: 'ai-llm', aliases: ['opencode', 'opencodeai'] },
  { slug: 'replicate', displayName: 'Replicate', category: 'ai-llm', aliases: ['replicate'] },
  { slug: 'runwayml', displayName: 'Runway', category: 'ai-llm', aliases: ['runway', 'runwayml'] },
  { slug: 'together.ai', displayName: 'Together AI', category: 'ai-llm', aliases: ['together', 'togetherai', 'together-ai'] },
  { slug: 'voltagent', displayName: 'VoltAgent', category: 'ai-llm', aliases: ['voltagent'] },
  { slug: 'x.ai', displayName: 'xAI', category: 'ai-llm', aliases: ['xai', 'x-ai', 'x.ai', 'grok'] },

  // Developer Tools & IDEs
  { slug: 'cursor', displayName: 'Cursor', category: 'dev-tools', aliases: ['cursor'] },
  { slug: 'expo', displayName: 'Expo', category: 'dev-tools', aliases: ['expo'] },
  { slug: 'lovable', displayName: 'Lovable', category: 'dev-tools', aliases: ['lovable'] },
  { slug: 'raycast', displayName: 'Raycast', category: 'dev-tools', aliases: ['raycast'] },
  { slug: 'superhuman', displayName: 'Superhuman', category: 'dev-tools', aliases: ['superhuman'] },
  { slug: 'vercel', displayName: 'Vercel', category: 'dev-tools', aliases: ['vercel'] },
  { slug: 'warp', displayName: 'Warp', category: 'dev-tools', aliases: ['warp'] },

  // Backend, Database & DevOps
  { slug: 'clickhouse', displayName: 'ClickHouse', category: 'backend-data', aliases: ['clickhouse'] },
  { slug: 'composio', displayName: 'Composio', category: 'backend-data', aliases: ['composio'] },
  { slug: 'hashicorp', displayName: 'HashiCorp', category: 'backend-data', aliases: ['hashicorp'] },
  { slug: 'mongodb', displayName: 'MongoDB', category: 'backend-data', aliases: ['mongodb', 'mongo'] },
  { slug: 'posthog', displayName: 'PostHog', category: 'backend-data', aliases: ['posthog'] },
  { slug: 'sanity', displayName: 'Sanity', category: 'backend-data', aliases: ['sanity'] },
  { slug: 'sentry', displayName: 'Sentry', category: 'backend-data', aliases: ['sentry'] },
  { slug: 'supabase', displayName: 'Supabase', category: 'backend-data', aliases: ['supabase'] },

  // Productivity & SaaS
  { slug: 'cal', displayName: 'Cal.com', category: 'productivity', aliases: ['cal', 'calcom', 'cal.com'] },
  { slug: 'intercom', displayName: 'Intercom', category: 'productivity', aliases: ['intercom'] },
  { slug: 'linear.app', displayName: 'Linear', category: 'productivity', aliases: ['linear', 'linear.app', 'linearapp'] },
  { slug: 'mintlify', displayName: 'Mintlify', category: 'productivity', aliases: ['mintlify'] },
  { slug: 'notion', displayName: 'Notion', category: 'productivity', aliases: ['notion'] },
  { slug: 'resend', displayName: 'Resend', category: 'productivity', aliases: ['resend'] },
  { slug: 'slack', displayName: 'Slack', category: 'productivity', aliases: ['slack'] },
  { slug: 'zapier', displayName: 'Zapier', category: 'productivity', aliases: ['zapier'] },

  // Design & Creative Tools
  { slug: 'airtable', displayName: 'Airtable', category: 'design-tools', aliases: ['airtable'] },
  { slug: 'clay', displayName: 'Clay', category: 'design-tools', aliases: ['clay'] },
  { slug: 'figma', displayName: 'Figma', category: 'design-tools', aliases: ['figma'] },
  { slug: 'framer', displayName: 'Framer', category: 'design-tools', aliases: ['framer'] },
  { slug: 'miro', displayName: 'Miro', category: 'design-tools', aliases: ['miro'] },
  { slug: 'webflow', displayName: 'Webflow', category: 'design-tools', aliases: ['webflow'] },

  // Fintech & Crypto
  { slug: 'binance', displayName: 'Binance', category: 'fintech', aliases: ['binance'] },
  { slug: 'coinbase', displayName: 'Coinbase', category: 'fintech', aliases: ['coinbase'] },
  { slug: 'kraken', displayName: 'Kraken', category: 'fintech', aliases: ['kraken'] },
  { slug: 'mastercard', displayName: 'Mastercard', category: 'fintech', aliases: ['mastercard'] },
  { slug: 'revolut', displayName: 'Revolut', category: 'fintech', aliases: ['revolut'] },
  { slug: 'stripe', displayName: 'Stripe', category: 'fintech', aliases: ['stripe'] },
  { slug: 'wise', displayName: 'Wise', category: 'fintech', aliases: ['wise'] },

  // E-commerce & Retail
  { slug: 'airbnb', displayName: 'Airbnb', category: 'ecommerce', aliases: ['airbnb'] },
  { slug: 'meta', displayName: 'Meta', category: 'ecommerce', aliases: ['meta'] },
  { slug: 'nike', displayName: 'Nike', category: 'ecommerce', aliases: ['nike'] },
  { slug: 'shopify', displayName: 'Shopify', category: 'ecommerce', aliases: ['shopify'] },
  { slug: 'starbucks', displayName: 'Starbucks', category: 'ecommerce', aliases: ['starbucks'] },

  // Media & Consumer Tech
  { slug: 'apple', displayName: 'Apple', category: 'media-consumer', aliases: ['apple'] },
  { slug: 'ibm', displayName: 'IBM', category: 'media-consumer', aliases: ['ibm'] },
  { slug: 'nvidia', displayName: 'NVIDIA', category: 'media-consumer', aliases: ['nvidia'] },
  { slug: 'pinterest', displayName: 'Pinterest', category: 'media-consumer', aliases: ['pinterest'] },
  { slug: 'playstation', displayName: 'PlayStation', category: 'media-consumer', aliases: ['playstation', 'ps5', 'sony'] },
  { slug: 'spacex', displayName: 'SpaceX', category: 'media-consumer', aliases: ['spacex'] },
  { slug: 'spotify', displayName: 'Spotify', category: 'media-consumer', aliases: ['spotify'] },
  { slug: 'theverge', displayName: 'The Verge', category: 'media-consumer', aliases: ['theverge', 'verge', 'the verge', 'the-verge'] },
  { slug: 'uber', displayName: 'Uber', category: 'media-consumer', aliases: ['uber'] },
  { slug: 'vodafone', displayName: 'Vodafone', category: 'media-consumer', aliases: ['vodafone'] },
  { slug: 'wired', displayName: 'WIRED', category: 'media-consumer', aliases: ['wired'] },

  // Automotive
  { slug: 'bmw', displayName: 'BMW', category: 'automotive', aliases: ['bmw'] },
  { slug: 'bmw-m', displayName: 'BMW M', category: 'automotive', aliases: ['bmw m', 'bmwm', 'bmw-m'] },
  { slug: 'bugatti', displayName: 'Bugatti', category: 'automotive', aliases: ['bugatti'] },
  { slug: 'ferrari', displayName: 'Ferrari', category: 'automotive', aliases: ['ferrari'] },
  { slug: 'lamborghini', displayName: 'Lamborghini', category: 'automotive', aliases: ['lamborghini', 'lambo'] },
  { slug: 'renault', displayName: 'Renault', category: 'automotive', aliases: ['renault'] },
  { slug: 'tesla', displayName: 'Tesla', category: 'automotive', aliases: ['tesla'] }
];

/**
 * Return the full list with URLs.
 */
function list() {
  return CATALOG.map(entry => ({
    ...entry,
    rawUrl: `${RAW_BASE}/${entry.slug}/DESIGN.md`,
    previewUrl: `${PREVIEW_BASE}/${entry.slug}/design-md`
  }));
}

/**
 * Normalize a name for matching: lowercase, strip whitespace and punctuation.
 */
function normalize(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[\s.\-_]+/g, '')
    .trim();
}

/**
 * Look up a site by name. Matches against displayName + aliases (case
 * insensitive, punctuation-insensitive).
 */
function lookupSite(name) {
  const norm = normalize(name);
  if (!norm) return null;
  for (const entry of CATALOG) {
    if (normalize(entry.displayName) === norm) {
      return { ...entry, matchedOn: 'displayName' };
    }
    if (normalize(entry.slug) === norm) {
      return { ...entry, matchedOn: 'slug' };
    }
    for (const alias of entry.aliases) {
      if (normalize(alias) === norm) {
        return { ...entry, matchedOn: 'alias' };
      }
    }
  }
  return null;
}

/**
 * Scan free text for mentions of known sites. Returns deduplicated entries.
 *
 * Looks for:
 *   - Direct mentions of displayName / slug / aliases (word-boundary)
 *   - Phrases like "feel like X", "similar to X", "looks like X"
 */
function extractSiteReferences(text) {
  if (!text) return [];
  const found = new Map();
  const lower = String(text).toLowerCase();

  for (const entry of CATALOG) {
    const candidates = [entry.displayName, entry.slug, ...entry.aliases];
    for (const candidate of candidates) {
      const normCand = candidate.toLowerCase();
      if (normCand.length < 3) continue; // skip too-short tokens
      // Word-boundary regex (escape special chars)
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase();
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lower)) {
        if (!found.has(entry.slug)) {
          found.set(entry.slug, {
            ...entry,
            matchedTerm: candidate,
            rawUrl: `${RAW_BASE}/${entry.slug}/DESIGN.md`,
            previewUrl: `${PREVIEW_BASE}/${entry.slug}/design-md`
          });
        }
        break; // first match per entry is enough
      }
    }
  }
  return [...found.values()];
}

/**
 * Cache file path for a given slug in a project.
 */
function cachePath(projectRoot, slug) {
  return path.join(projectRoot, '.godpowers', 'cache', 'awesome-design', `${slug}.md`);
}

function isCached(projectRoot, slug) {
  return fs.existsSync(cachePath(projectRoot, slug));
}

/**
 * Fetch a DESIGN.md by slug. Synchronous-style API using callbacks
 * because Node's https is callback-based and we don't want to require
 * Promise wrappers for tests. Returns a Promise for runtime use.
 */
function fetchDesign(projectRoot, slug, opts = {}) {
  return new Promise((resolve) => {
    const cached = cachePath(projectRoot, slug);
    if (!opts.refresh && fs.existsSync(cached)) {
      try {
        return resolve({
          content: fs.readFileSync(cached, 'utf8'),
          cached: true,
          error: null
        });
      } catch (e) {
        return resolve({ content: '', cached: false, error: e.message });
      }
    }
    const url = `${RAW_BASE}/${slug}/DESIGN.md`;
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return resolve({ content: '', cached: false, error: `HTTP ${res.statusCode}` });
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          fs.mkdirSync(path.dirname(cached), { recursive: true });
          fs.writeFileSync(cached, data);
        } catch (e) {
          // Cache failure non-fatal; still return content
        }
        resolve({ content: data, cached: false, error: null });
      });
    }).on('error', (err) => {
      resolve({ content: '', cached: false, error: err.message });
    });
  });
}

/**
 * Suggest sites that might fit a brand description (heuristic).
 * E.g., "minimal dark dev tool" -> Linear, Vercel, Cursor.
 */
function suggestByBrandHints(text) {
  if (!text) return [];
  const lower = String(text).toLowerCase();
  const suggestions = [];

  const rules = [
    { keywords: ['minimal', 'minimalist', 'dark dev'], slugs: ['linear.app', 'vercel', 'cursor'] },
    { keywords: ['warm', 'editorial', 'serif'], slugs: ['notion', 'wired', 'theverge'] },
    { keywords: ['fintech', 'payment', 'banking'], slugs: ['stripe', 'wise', 'revolut'] },
    { keywords: ['ai assistant', 'llm', 'chat'], slugs: ['claude', 'cohere', 'mistral.ai'] },
    { keywords: ['e-commerce', 'shop', 'retail'], slugs: ['shopify', 'airbnb'] },
    { keywords: ['developer tools', 'devops'], slugs: ['vercel', 'supabase', 'sentry'] },
    { keywords: ['terminal', 'code editor'], slugs: ['warp', 'cursor', 'raycast'] },
    { keywords: ['premium', 'luxury'], slugs: ['apple', 'tesla', 'ferrari'] }
  ];

  for (const rule of rules) {
    if (rule.keywords.some(k => lower.includes(k))) {
      for (const slug of rule.slugs) {
        const entry = CATALOG.find(e => e.slug === slug);
        if (entry && !suggestions.find(s => s.slug === slug)) {
          suggestions.push({
            ...entry,
            rawUrl: `${RAW_BASE}/${entry.slug}/DESIGN.md`,
            previewUrl: `${PREVIEW_BASE}/${entry.slug}/design-md`,
            reason: `matched keyword "${rule.keywords.find(k => lower.includes(k))}"`
          });
        }
      }
    }
  }
  return suggestions;
}

module.exports = {
  CATALOG,
  RAW_BASE,
  PREVIEW_BASE,
  list,
  lookupSite,
  extractSiteReferences,
  suggestByBrandHints,
  cachePath,
  isCached,
  fetchDesign,
  normalize
};
