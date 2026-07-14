import type { MixBlendMode } from './config';

/**
 * A faithful port of GlassSurface's private `generateDisplacementMap()`.
 *
 * The component never exports it — it's a closure that runs on every prop change and
 * writes its result straight into an feImage href, where you can't see it. It is also the
 * whole trick: every visible property of the glass is encoded in the pixels of this one
 * generated SVG. So §2 calls this directly and puts the raw output on screen.
 *
 * Kept structurally identical to the source (same gradients, same ids, same blend, same
 * edgeSize maths) so that what §2 renders is what the component actually feeds its filter.
 */
export interface MapOptions {
  width: number;
  height: number;
  borderRadius: number;
  borderWidth: number;
  brightness: number;
  opacity: number;
  blur: number;
  mixBlendMode: MixBlendMode;
}

export function generateDisplacementMap(o: MapOptions, idSuffix = 'probe'): string {
  const redGradId = `red-grad-${idSuffix}`;
  const blueGradId = `blue-grad-${idSuffix}`;
  const edgeSize = Math.min(o.width, o.height) * (o.borderWidth * 0.5);

  const svgContent = `
      <svg viewBox="0 0 ${o.width} ${o.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${o.width}" height="${o.height}" fill="black"></rect>
        <rect x="0" y="0" width="${o.width}" height="${o.height}" rx="${o.borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${o.width}" height="${o.height}" rx="${o.borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${o.mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${o.width - edgeSize * 2}" height="${o.height - edgeSize * 2}" rx="${o.borderRadius}" fill="hsl(0 0% ${o.brightness}% / ${o.opacity})" style="filter:blur(${o.blur}px)" />
      </svg>
    `;

  return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
}

/** The SVG the component hides inside a data: URI. */
export function decodeMap(uri: string): string {
  return decodeURIComponent(uri.replace(/^data:image\/svg\+xml,/, '')).trim();
}

/** edgeSize = min(w, h) × borderWidth × 0.5 — the rim width, in px. */
export function edgeSize(width: number, height: number, borderWidth: number): number {
  return Math.min(width, height) * (borderWidth * 0.5);
}

/**
 * The three feDisplacementMap passes, each with `scale = distortionScale + offset`.
 * The spread between them is the chromatic aberration; equalise the offsets and it's gone.
 */
export function channelScales(distortionScale: number, r: number, g: number, b: number) {
  return [
    { channel: 'R' as const, offset: r, scale: distortionScale + r, colour: '#e5484d' },
    { channel: 'G' as const, offset: g, scale: distortionScale + g, colour: '#30a46c' },
    { channel: 'B' as const, offset: b, scale: distortionScale + b, colour: '#0091ff' }
  ];
}

/**
 * Rasterise the generated map and split it into its R/G/B planes.
 *
 * This is the payoff: the map paints a red gradient left→right and a blue gradient
 * top→bottom, so R carries horizontal offsets and B carries vertical ones — yet the
 * component's default `yChannel` is 'G'. Looking at the planes shows why that still
 * works, and what it costs.
 */
export async function splitChannels(
  uri: string,
  width: number,
  height: number
): Promise<{ r: string; g: string; b: string; composite: string }> {
  const img = new Image();
  img.src = uri;
  await img.decode();

  const draw = (keep: 0 | 1 | 2 | null) => {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const g2 = c.getContext('2d')!;
    g2.drawImage(img, 0, 0, width, height);
    if (keep === null) return c.toDataURL();

    const data = g2.getImageData(0, 0, width, height);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      const v = px[i + keep];
      px[i] = px[i + 1] = px[i + 2] = v;
      px[i + 3] = 255;
    }
    g2.putImageData(data, 0, 0);
    return c.toDataURL();
  };

  return { composite: draw(null), r: draw(0), g: draw(1), b: draw(2) };
}

/**
 * GlassSurface's private `supportsSVGFilters()`. It user-agent sniffs — Safari and Firefox
 * are refused before any feature test runs — then probes `backdrop-filter: url(#id)`.
 * A `false` here means you get `.glass-surface--fallback`, which is a plain blur with none
 * of the displacement. Ported verbatim so §7 can report what *this* browser will get.
 */
export function supportsSVGFilters(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  if (isWebkit || isFirefox) return false;

  const div = document.createElement('div');
  div.style.backdropFilter = `url(#probe)`;
  return div.style.backdropFilter !== '';
}
