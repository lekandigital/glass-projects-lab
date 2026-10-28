// Vercel build step: the lab is served as-is, so tag every HTML page here instead of
// editing a thousand vendored demos: PostHog, plus the "Follow on GitHub" tab (gh-follow.js).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SKIP = new Set(['.git', 'node_modules', '.vercel', 'original-zips']);
const TAGS = [
  ['posthog-static.js', '<script src="/posthog-static.js"></script>'],
  ['gh-follow.js', '<script src="/gh-follow.js" defer></script>'],
];
const tagged = Object.fromEntries(TAGS.map(([file]) => [file, 0]));

function inject(html) {
  const missing = TAGS.filter(([file]) => !html.includes(file));
  if (!missing.length) return null;
  for (const [file] of missing) tagged[file]++;
  const tag = missing.map(([, t]) => t).join('');
  const close = html.search(/<\/head\s*>/i);
  if (close >= 0) return html.slice(0, close) + tag + html.slice(close);
  const open = html.match(/<(head|html)[^>]*>/i);
  if (open) return html.slice(0, open.index + open[0].length) + tag + html.slice(open.index + open[0].length);
  return tag + html;
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.html?$/i.test(entry.name)) {
      const out = inject(readFileSync(path, 'utf8'));
      if (out !== null) writeFileSync(path, out);
    }
  }
}

walk('.');
for (const [file, n] of Object.entries(tagged)) console.log(`${file}: tagged ${n} pages`);
