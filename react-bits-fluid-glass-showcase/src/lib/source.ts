/**
 * FluidGlass has no defaults object to introspect — every default is an inline
 * literal (`ior ?? 1.15`, `mode = 'lens'`, …). So the reference table reads the
 * component's source text at runtime and parses the literals back out. If upstream
 * changes a default, the table changes with it; it cannot go stale.
 */
import rawSource from '@lib/FluidGlass?raw';

export const FLUID_GLASS_SOURCE: string = rawSource;

/** `ior ?? 1.15` — the nullish defaults ModeWrapper applies to MeshTransmissionMaterial. */
export function parseNullishDefaults(src: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of src.matchAll(/(\w+)=\{(\w+)\s*\?\?\s*([^}]+)\}/g)) {
    if (m[1] === m[2]) out[m[1]] = m[3].trim();
  }
  // `scale={scale ?? 0.15}` sits on the mesh rather than the material, same syntax.
  return out;
}

/** `mode = 'lens'`, `lensProps = {}` — destructuring defaults on the component signature. */
export function parseSignatureDefaults(src: string): Record<string, string> {
  const sig = src.match(/export default function FluidGlass\(\{([\s\S]*?)\}:/);
  const out: Record<string, string> = {};
  if (!sig) return out;
  for (const m of sig[1].matchAll(/(\w+)\s*=\s*('[^']*'|\{\})/g)) out[m[1]] = m[2];
  return out;
}

/** The `defaultMat` block Bar merges beneath the caller's barProps. */
export function parseBarDefaults(src: string): Record<string, string> {
  const block = src.match(/const defaultMat = \{([\s\S]*?)\};/);
  const out: Record<string, string> = {};
  if (!block) return out;
  for (const m of block[1].matchAll(/(\w+):\s*([^,\n]+)/g)) out[m[1]] = m[2].trim();
  return out;
}

/** Values FluidGlass hardcodes and offers no prop for. Each is a genuine limitation. */
export function parseHardcoded(src: string): Array<{ what: string; value: string; where: string }> {
  const grab = (re: RegExp, fallback = '—') => src.match(re)?.[1]?.trim() ?? fallback;
  return [
    {
      what: 'Canvas camera',
      value: grab(/<Canvas camera=\{\{ (position: \[[^\]]*\], fov: \d+) \}\}/),
      where: 'FluidGlass'
    },
    {
      what: 'ScrollControls',
      value: grab(/<ScrollControls (damping=\{[\d.]+\} pages=\{\d+\} distance=\{[\d.]+\})>/),
      where: 'FluidGlass'
    },
    { what: 'Clear colour', value: grab(/gl\.setClearColor\((0x[0-9a-f]+), 1\)/i), where: 'ModeWrapper.useFrame' },
    { what: 'Pointer easing', value: grab(/easing\.damp3\(ref\.current\.position, \[destX, destY, \d+\], ([\d.]+), delta\)/), where: 'ModeWrapper.useFrame' },
    { what: 'Auto-scale cap', value: grab(/Math\.min\(([\d.]+), desired\)/), where: 'ModeWrapper.useFrame' },
    { what: 'Scene text', value: grab(/anchorY="middle"\s*>\s*([^\n<]+)/), where: 'Typography' },
    { what: 'Scene images', value: `${[...src.matchAll(/<Image /g)].length} fixed <Image> nodes`, where: 'Images' },
    {
      what: 'Draco decoder',
      value: 'gstatic.com CDN (via drei useGLTF)',
      where: src.includes('useGLTF') ? 'useGLTF' : '—'
    }
  ];
}

export const SIGNATURE_DEFAULTS = parseSignatureDefaults(FLUID_GLASS_SOURCE);
export const NULLISH_DEFAULTS = parseNullishDefaults(FLUID_GLASS_SOURCE);
export const BAR_DEFAULTS = parseBarDefaults(FLUID_GLASS_SOURCE);
export const HARDCODED = parseHardcoded(FLUID_GLASS_SOURCE);
