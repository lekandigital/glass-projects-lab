// Vercel build step: the lab is served as-is, so tag every HTML page with
// /posthog-static.js here instead of editing a thousand vendored demos.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SKIP = new Set(['.git', 'node_modules', '.vercel', 'original-zips']);
const TAG = '<script src="/posthog-static.js"></script>';
let tagged = 0;

function inject(html) {
  if (html.includes('posthog-static.js')) return null;
  const close = html.search(/<\/head\s*>/i);
  if (close >= 0) return html.slice(0, close) + TAG + html.slice(close);
  const open = html.match(/<(head|html)[^>]*>/i);
  if (open) return html.slice(0, open.index + open[0].length) + TAG + html.slice(open.index + open[0].length);
  return TAG + html;
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.html?$/i.test(entry.name)) {
      const out = inject(readFileSync(path, 'utf8'));
      if (out !== null) { writeFileSync(path, out); tagged++; }
    }
  }
}

walk('.');
console.log(`posthog: tagged ${tagged} pages`);
