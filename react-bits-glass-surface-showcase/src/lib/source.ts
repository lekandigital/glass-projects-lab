/**
 * GlassSurface has no defaults object to introspect — every default is a destructuring
 * literal (`brightness = 50`). So the reference table reads the component's source text at
 * runtime and parses the literals back out. If upstream changes a default, the table
 * changes with it; it cannot go stale.
 */
import rawSource from '@lib/GlassSurface?raw';
import rawCss from '@lib/GlassSurface.css?raw';

export const GLASS_SURFACE_SOURCE: string = rawSource;
export const GLASS_SURFACE_CSS: string = rawCss;

/** `width = 200`, `xChannel = 'R'`, `style = {}` — the destructuring defaults. */
export function parseSignatureDefaults(src: string): Record<string, string> {
  const sig = src.match(/const GlassSurface: React\.FC<GlassSurfaceProps> = \(\{([\s\S]*?)\}\) =>/);
  const out: Record<string, string> = {};
  if (!sig) return out;
  for (const m of sig[1].matchAll(/(\w+)\s*=\s*('[^']*'|-?[\d.]+|\{\}|\[\])/g)) out[m[1]] = m[2];
  // `children` has no default; it is simply listed.
  if (/^\s*children,/m.test(sig[1])) out.children = 'undefined';
  return out;
}

/** Props declared on the interface but with no default — they arrive as `undefined`. */
export function parsePropTypes(src: string): Record<string, string> {
  const block = src.match(/export interface GlassSurfaceProps \{([\s\S]*?)\n\}/);
  const out: Record<string, string> = {};
  if (!block) return out;
  // mixBlendMode's union spans many lines; collapse before splitting on `;`.
  const flat = block[1].replace(/\s+/g, ' ');
  for (const m of flat.matchAll(/(\w+)\?:\s*([^;]+);/g)) out[m[1]] = m[2].trim().replace(/\s*\|\s*/g, ' | ');
  return out;
}

/** Things the component hardcodes. Each is a thing you'd have to fork it to change. */
export function parseHardcoded(src: string, css: string): Array<{ what: string; value: string; where: string }> {
  const grab = (s: string, re: RegExp, fallback = '—') => s.match(re)?.[1]?.trim() ?? fallback;

  return [
    {
      what: 'Browser gate',
      value: 'Safari & Firefox refused by UA string, before any feature test',
      where: 'supportsSVGFilters()'
    },
    {
      what: 'Map size fallback',
      value: `${grab(src, /const actualWidth = rect\?\.width \|\| (\d+)/)} × ${grab(src, /const actualHeight = rect\?\.height \|\| (\d+)/)}`,
      where: 'generateDisplacementMap()'
    },
    {
      what: 'Rim width formula',
      value: grab(src, /const edgeSize = (Math\.min\(actualWidth, actualHeight\) \* \(borderWidth \* [\d.]+\))/),
      where: 'generateDisplacementMap()'
    },
    {
      what: 'Channel blends',
      value: `feBlend mode="${grab(src, /<feBlend in="red" in2="green" mode="(\w+)"/)}" ×2 — not configurable`,
      where: 'filter markup'
    },
    {
      what: 'ResizeObservers',
      value: `${[...src.matchAll(/new ResizeObserver\(/g)].length} registered — the effect is duplicated verbatim`,
      where: 'useEffect ×2'
    },
    {
      what: 'Colour interpolation',
      value: grab(src, /colorInterpolationFilters="(\w+)"/),
      where: 'filter markup'
    },
    {
      what: 'Fallback appearance',
      value: grab(css, /\.glass-surface--fallback \{[\s\S]*?backdrop-filter: ([^;]+);/),
      where: 'GlassSurface.css'
    }
  ];
}

export const SIGNATURE_DEFAULTS = parseSignatureDefaults(GLASS_SURFACE_SOURCE);
export const PROP_TYPES = parsePropTypes(GLASS_SURFACE_SOURCE);
export const HARDCODED = parseHardcoded(GLASS_SURFACE_SOURCE, GLASS_SURFACE_CSS);
