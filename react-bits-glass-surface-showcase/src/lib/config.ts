/**
 * The one source of truth for this demo.
 *
 * Every GlassSurface configuration rendered anywhere on the page is defined here and
 * imported by the sections. A preset that claims to reproduce another section's output
 * *is* that section's object, never a copy of it.
 */

export type Channel = 'R' | 'G' | 'B';

export type MixBlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'
  | 'plus-darker'
  | 'plus-lighter';

export interface SurfaceProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: Channel;
  yChannel?: Channel;
  mixBlendMode?: MixBlendMode;
}

/**
 * What a prop costs when it changes. Read off the source, and the answer is not the one
 * the API implies.
 *
 * - `map`    — genuinely feeds `generateDisplacementMap()`. Rebuilds an SVG string,
 *              percent-encodes it into a data: URI and swaps the `feImage` href, forcing
 *              the browser to decode a fresh image and re-run the filter graph.
 * - `filter` — *ought* to be a `setAttribute` on a live primitive and nothing more. It
 *              isn't: the effect calls `updateDisplacementMap()` unconditionally on its
 *              first line, and lists all fifteen of these props as dependencies. So
 *              changing `distortionScale` — which the map does not read — regenerates and
 *              re-decodes the whole map anyway. Same price as `map`. See §4; §5 fixes it.
 * - `css`    — a CSS custom property on the container. These two are *not* in the effect's
 *              dependency array, so they are the only props that are actually cheap.
 *
 * `borderRadius`, `width` and `height` are on two paths at once.
 */
export type Cost = 'map' | 'filter' | 'css';

export interface ControlSpec {
  key: keyof SurfaceProps;
  label: string;
  cost: Cost[];
  kind: 'range' | 'select';
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  hint: string;
}

/**
 * The component's own defaults, from the destructuring in its signature.
 * `src/lib/source.ts` re-reads these out of the real source file at runtime and the
 * reference table renders *that*, so this object cannot silently drift.
 */
export const GLASS_SURFACE_DEFAULTS: Required<SurfaceProps> = {
  width: 200,
  height: 80,
  borderRadius: 20,
  borderWidth: 0.07,
  brightness: 50,
  opacity: 0.93,
  blur: 11,
  displace: 0,
  backgroundOpacity: 0,
  saturation: 1,
  distortionScale: -180,
  redOffset: 0,
  greenOffset: 10,
  blueOffset: 20,
  xChannel: 'R',
  yChannel: 'G',
  mixBlendMode: 'difference'
};

/** Values GlassSurface hardcodes and offers no prop for. Each is a fork-to-change. */
export const INTERNALS = {
  /** getBoundingClientRect fallback when the container hasn't laid out yet. */
  mapFallbackSize: { width: 400, height: 200 },
  /** edgeSize = min(w, h) * (borderWidth * 0.5) */
  edgeSizeFactor: 0.5,
  /** The two channel-isolating matrices and the two screen blends are fixed. */
  blendMode: 'screen',
  /** feGaussianBlur ships with this in markup; the effect overwrites it from `displace`. */
  markupStdDeviation: 0.7,
  /** supportsSVGFilters() returns false for these, no feature test performed. */
  uaDenylist: ['Safari (non-Chrome)', 'Firefox']
} as const;

export const CONTROLS: ControlSpec[] = [
  {
    key: 'width',
    label: 'width',
    cost: ['css', 'map'],
    kind: 'range',
    min: 80,
    max: 560,
    step: 4,
    hint: 'Also the viewBox of the generated map, so changing it regenerates the SVG.'
  },
  {
    key: 'height',
    label: 'height',
    cost: ['css', 'map'],
    kind: 'range',
    min: 40,
    max: 320,
    step: 4,
    hint: 'Same: the map is drawn at the measured pixel size of the container.'
  },
  {
    key: 'borderRadius',
    label: 'borderRadius',
    cost: ['css', 'map'],
    kind: 'range',
    min: 0,
    max: 100,
    step: 1,
    hint: 'Rounds the container *and* the rects inside the map, so the bevel follows the corner.'
  },
  {
    key: 'borderWidth',
    label: 'borderWidth',
    cost: ['map'],
    kind: 'range',
    min: 0,
    max: 0.4,
    step: 0.005,
    hint: 'Not a CSS border. A factor: edgeSize = min(w,h) × borderWidth × 0.5 — the width of the refracting rim.'
  },
  {
    key: 'brightness',
    label: 'brightness',
    cost: ['map'],
    kind: 'range',
    min: 0,
    max: 100,
    step: 1,
    hint: 'Lightness of the inner rect in the map. Mid-grey means "no displacement" — that is why 50 is the default.'
  },
  {
    key: 'opacity',
    label: 'opacity',
    cost: ['map'],
    kind: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    hint: "Alpha of that inner rect. Not the surface's opacity — this one only exists inside the map."
  },
  {
    key: 'blur',
    label: 'blur',
    cost: ['map'],
    kind: 'range',
    min: 0,
    max: 40,
    step: 1,
    hint: 'A CSS blur applied to the inner rect *while drawing the map*. Softens the gradient the rim reads from.'
  },
  {
    key: 'displace',
    label: 'displace',
    cost: ['filter'],
    kind: 'range',
    min: 0,
    max: 5,
    step: 0.1,
    hint: 'The output feGaussianBlur stdDeviation. This is the only prop that blurs what you actually see.'
  },
  {
    key: 'distortionScale',
    label: 'distortionScale',
    cost: ['filter'],
    kind: 'range',
    min: -300,
    max: 300,
    step: 5,
    hint: 'Base displacement, in pixels. Negative pulls inward (convex lens); positive pushes out.'
  },
  {
    key: 'redOffset',
    label: 'redOffset',
    cost: ['filter'],
    kind: 'range',
    min: -50,
    max: 50,
    step: 1,
    hint: 'Added to distortionScale for the red pass only. The three offsets *are* the chromatic aberration.'
  },
  {
    key: 'greenOffset',
    label: 'greenOffset',
    cost: ['filter'],
    kind: 'range',
    min: -50,
    max: 50,
    step: 1,
    hint: 'Same for green. Setting all three equal removes the colour fringing entirely.'
  },
  {
    key: 'blueOffset',
    label: 'blueOffset',
    cost: ['filter'],
    kind: 'range',
    min: -50,
    max: 50,
    step: 1,
    hint: 'Same for blue. The default 0/10/20 spread is what makes the rim look like real glass.'
  },
  {
    key: 'backgroundOpacity',
    label: 'backgroundOpacity',
    cost: ['css'],
    kind: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    hint: 'Frost. Sets --glass-frost, which the CSS feeds to light-dark() — so it whitens in light mode and blackens in dark.'
  },
  {
    key: 'saturation',
    label: 'saturation',
    cost: ['css'],
    kind: 'range',
    min: 0,
    max: 3,
    step: 0.05,
    hint: 'Sets --glass-saturation, appended to backdrop-filter after the SVG filter. Never touches the graph.'
  },
  {
    key: 'xChannel',
    label: 'xChannel',
    cost: ['filter'],
    kind: 'select',
    options: ['R', 'G', 'B'],
    hint: 'Which channel of the map drives horizontal displacement. The map paints a red gradient left→right, so R is the meaningful choice.'
  },
  {
    key: 'yChannel',
    label: 'yChannel',
    cost: ['filter'],
    kind: 'select',
    options: ['R', 'G', 'B'],
    hint: 'Which channel drives vertical displacement. The map paints a blue gradient top→bottom — yet the default is G. See §2.'
  },
  {
    key: 'mixBlendMode',
    label: 'mixBlendMode',
    cost: ['map'],
    kind: 'select',
    options: [
      'normal',
      'multiply',
      'screen',
      'overlay',
      'darken',
      'lighten',
      'color-dodge',
      'color-burn',
      'hard-light',
      'soft-light',
      'difference',
      'exclusion',
      'hue',
      'saturation',
      'color',
      'luminosity',
      'plus-lighter'
    ],
    hint: "Misleading name: this is not the surface's CSS blend mode. It blends the blue gradient over the red one *inside the generated map*."
  }
];

export const DEMO_CONFIGS: Record<string, { label: string; note: string; props: SurfaceProps }> = {
  /** The component's own defaults, straight from the destructuring. */
  componentDefault: {
    label: 'Component default',
    note: "GlassSurface's own defaults. displace: 0, so the output is razor sharp.",
    props: { ...GLASS_SURFACE_DEFAULTS, width: 320, height: 120 }
  },
  /** The settings react-bits' own docs page boots with — deliberately not the same thing. */
  upstreamDemo: {
    label: 'Upstream demo',
    note: "What react-bits' docs page actually shows. Note it overrides four of the component's own defaults.",
    props: {
      width: 320,
      height: 120,
      borderRadius: 50,
      borderWidth: 0.07,
      brightness: 50,
      opacity: 0.93,
      blur: 11,
      displace: 0.5,
      backgroundOpacity: 0.1,
      saturation: 1,
      distortionScale: -180,
      redOffset: 0,
      greenOffset: 10,
      blueOffset: 20
    }
  },
  pill: {
    label: 'iOS pill',
    note: 'Fully-rounded, thin rim, gentle pull. The control-centre look.',
    props: {
      width: 320,
      height: 120,
      borderRadius: 60,
      borderWidth: 0.05,
      brightness: 50,
      opacity: 0.9,
      blur: 8,
      displace: 0.4,
      backgroundOpacity: 0.12,
      saturation: 1.4,
      distortionScale: -120,
      redOffset: 0,
      greenOffset: 6,
      blueOffset: 12
    }
  },
  prism: {
    label: 'Prism',
    note: 'The three channel offsets pushed far apart. All of the fringing, none of the subtlety.',
    props: {
      width: 320,
      height: 120,
      borderRadius: 24,
      borderWidth: 0.14,
      brightness: 50,
      opacity: 1,
      blur: 6,
      displace: 0.6,
      backgroundOpacity: 0,
      saturation: 1.6,
      distortionScale: -220,
      redOffset: -40,
      greenOffset: 0,
      blueOffset: 45
    }
  },
  achromatic: {
    label: 'Achromatic',
    note: 'All three offsets equal: the R/G/B passes land on the same pixels and the fringing vanishes. The control.',
    props: {
      width: 320,
      height: 120,
      borderRadius: 24,
      borderWidth: 0.1,
      brightness: 50,
      opacity: 0.93,
      blur: 11,
      displace: 0.4,
      backgroundOpacity: 0,
      saturation: 1,
      distortionScale: -180,
      redOffset: 0,
      greenOffset: 0,
      blueOffset: 0
    }
  },
  convex: {
    label: 'Convex',
    note: 'distortionScale flipped positive. The lens pushes outward instead of pulling in — it reads as a bubble.',
    props: {
      width: 320,
      height: 120,
      borderRadius: 30,
      borderWidth: 0.12,
      brightness: 50,
      opacity: 0.93,
      blur: 11,
      displace: 0.5,
      backgroundOpacity: 0,
      saturation: 1,
      distortionScale: 200,
      redOffset: 0,
      greenOffset: 10,
      blueOffset: 20
    }
  },
  frost: {
    label: 'Frost only',
    note: 'distortionScale 0 disables displacement entirely. What is left is backgroundOpacity + saturation — plain glassmorphism.',
    props: {
      width: 320,
      height: 120,
      borderRadius: 24,
      borderWidth: 0.07,
      brightness: 50,
      opacity: 0.93,
      blur: 11,
      displace: 2,
      backgroundOpacity: 0.35,
      saturation: 1.8,
      distortionScale: 0,
      redOffset: 0,
      greenOffset: 0,
      blueOffset: 0
    }
  },
  /** Drives the "In real UI" section. */
  appChrome: {
    label: 'App chrome',
    note: 'The settings the section-6 toolbar and dock actually use.',
    props: {
      borderRadius: 26,
      borderWidth: 0.06,
      brightness: 55,
      opacity: 0.9,
      blur: 10,
      displace: 0.5,
      backgroundOpacity: 0.14,
      saturation: 1.5,
      distortionScale: -140,
      redOffset: 0,
      greenOffset: 8,
      blueOffset: 16
    }
  }
};

export const GALLERY_KEYS = [
  'componentDefault',
  'upstreamDemo',
  'pill',
  'prism',
  'achromatic',
  'convex',
  'frost'
];

export const PLAYGROUND_INITIAL = DEMO_CONFIGS.upstreamDemo;

export interface Backdrop {
  key: string;
  label: string;
  note: string;
}

/**
 * Unlike FluidGlass, GlassSurface refracts whatever is genuinely behind it in the DOM —
 * so the backdrop picker reaches every surface on this page. Achromatic and high-frequency
 * by default: colour in the backdrop is indistinguishable from colour the aberration invented.
 */
export const BACKDROPS: Backdrop[] = [
  { key: 'checker', label: 'Checker', note: 'Hard edges. The reference for reading displacement — straight lines bend visibly.' },
  { key: 'grid', label: 'Grid', note: 'Thin lines. Shows the rim gradient better than anything else.' },
  { key: 'noise', label: 'Noise', note: 'High frequency, no structure. Exposes the output blur from displace.' },
  { key: 'photo', label: 'Photograph', note: 'The same photograph used by the web-glass showcase.' },
  { key: 'video', label: 'Video', note: 'The same autoplaying video used by the web-glass showcase.' },
  { key: 'text', label: 'Text', note: 'Fine detail at legibility scale. The honest test of whether the effect is usable over content.' },
  { key: 'flat', label: 'Flat', note: 'A control. Nothing to displace, so only the frost and the rim survive.' }
];
