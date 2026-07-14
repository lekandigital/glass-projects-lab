import { DEFAULT_OPTIONS, type LiquidGlassOptions } from "liquid-glass-web-react";

/**
 * Every knob the library exposes, in one object. The playground and the
 * displacement-map inspector both read from this, so the numbers you drag are
 * literally the numbers the map is computed from.
 */
export type GlassParams = LiquidGlassOptions;

export const START: GlassParams = {
  ...DEFAULT_OPTIONS,
  width: 220,
  height: 220,
  radius: "auto",
  strength: 0.07,
  chromaticAberration: 0.45,
  curvature: 0.8,
  depth: 26,
  glow: 0.6,
  edgeHighlight: 0.7,
  specularAngle: 130,
};

export type Group = "shape" | "refraction" | "light" | "perf";

export interface Slider {
  key: Exclude<keyof GlassParams, "radius" | "quality">;
  label: string;
  min: number;
  max: number;
  step: number;
  group: Group;
  /** Whether changing it regenerates the displacement map or is a cheap filter update. */
  cost: "map" | "filter";
  hint: string;
}

export const SLIDERS: Slider[] = [
  // shape — these change the lens geometry, so the map is recomputed
  { key: "width", label: "width", min: 40, max: 420, step: 2, group: "shape", cost: "map", hint: "Lens width in px." },
  { key: "height", label: "height", min: 40, max: 420, step: 2, group: "shape", cost: "map", hint: "Lens height in px." },
  { key: "depth", label: "depth", min: 0, max: 80, step: 1, group: "shape", cost: "map", hint: "Width of the refracting edge band — how thick the glass rim reads." },
  { key: "curvature", label: "curvature", min: 0, max: 1, step: 0.01, group: "shape", cost: "map", hint: "0 = flat linear ramp, 1 = full spherical dome." },
  { key: "splay", label: "splay", min: 0, max: 1, step: 0.01, group: "shape", cost: "map", hint: "1 keeps edge refraction perpendicular to the edge; 0 keeps it radial." },

  // refraction — cheap: pure filter attribute updates, no map regeneration
  { key: "strength", label: "strength", min: 0, max: 0.25, step: 0.001, group: "refraction", cost: "filter", hint: "How far pixels bend, as a fraction of the container size." },
  { key: "chromaticAberration", label: "chromaticAberration", min: 0, max: 1, step: 0.01, group: "refraction", cost: "filter", hint: "Per-channel scale offset — the rainbow fringe at the rim." },
  { key: "blur", label: "blur", min: 0, max: 12, step: 0.25, group: "refraction", cost: "filter", hint: "Gaussian blur of the refracted content only. Frosted glass." },

  // light — baked into the map's blue channel
  { key: "glow", label: "glow", min: 0, max: 1, step: 0.01, group: "light", cost: "map", hint: "Inner specular glow." },
  { key: "glowSpread", label: "glowSpread", min: 0, max: 1, step: 0.01, group: "light", cost: "map", hint: "Fraction of the lens the glow spreads across." },
  { key: "glowExponent", label: "glowExponent", min: 0.2, max: 6, step: 0.1, group: "light", cost: "map", hint: "Falloff exponent of the glow. Higher = tighter." },
  { key: "edgeHighlight", label: "edgeHighlight", min: 0, max: 1, step: 0.01, group: "light", cost: "map", hint: "Bright rim along the lens edge." },
  { key: "edgeWidth", label: "edgeWidth", min: 0, max: 20, step: 0.5, group: "light", cost: "map", hint: "Width of the edge highlight band, px." },
  { key: "edgeExponent", label: "edgeExponent", min: 0.2, max: 6, step: 0.1, group: "light", cost: "map", hint: "Falloff exponent of the edge highlight." },
  { key: "specular", label: "specular", min: 0, max: 2, step: 0.01, group: "light", cost: "filter", hint: "Master intensity of the whole specular pass." },
  { key: "specularAngle", label: "specularAngle", min: 0, max: 360, step: 1, group: "light", cost: "map", hint: "Direction the light comes from, in degrees." },
];

export const GROUP_LABEL: Record<Group, string> = {
  shape: "Shape · regenerates the map",
  refraction: "Refraction · pure filter update",
  light: "Baked light · map blue channel",
  perf: "Resolution",
};

/**
 * The lenses used by the demo sections further down the page. They live here,
 * not in the sections, for one reason: the playground offers them as presets,
 * and a preset that has drifted from the thing it claims to reproduce is worse
 * than no preset at all. Sections import from here; presets read from here.
 */
export const DEMO_LENSES = {
  hero: {
    width: 200, height: 200, radius: "auto", strength: 0.07, chromaticAberration: 0.5,
    curvature: 0.85, depth: 28, glow: 0.7, edgeHighlight: 0.8, specularAngle: 130,
  },
  selection: {
    width: 96, height: 44, radius: "auto", strength: 0.022, chromaticAberration: 0.3,
    curvature: 0.85, depth: 8, glow: 0.18, edgeHighlight: 0.4,
  },
  /** The upstream demo's toggle lens, exactly as it ships. */
  toggle: {
    width: 104, height: 46, radius: "auto", strength: 0.02, chromaticAberration: 0.25,
    curvature: 0.85, depth: 8, glow: 0.15, edgeHighlight: 0.35,
  },
  dock: {
    width: 64, height: 64, radius: 20, strength: 0.05, chromaticAberration: 0.5,
    curvature: 0.9, depth: 14, glow: 0.45, edgeHighlight: 0.7,
  },
  reading: {
    width: 150, height: 150, radius: "auto", strength: 0.05, chromaticAberration: 0.35,
    curvature: 1, depth: 30, glow: 0.3, edgeHighlight: 0.55, specularAngle: 90,
  },
  orbit: {
    width: 170, height: 170, radius: "auto", strength: 0.07, chromaticAberration: 0.45,
    curvature: 0.85, depth: 24, glow: 0.55, edgeHighlight: 0.75, specularAngle: 130,
  },
  engine: {
    width: 160, height: 160, radius: "auto", strength: 0.08, chromaticAberration: 0.5,
    curvature: 0.85, depth: 24, glow: 0.5, edgeHighlight: 0.75, specularAngle: 130,
  },
} satisfies Record<string, Partial<GlassParams>>;

/** A demo lens as a complete parameter set — unset options fall back to the library defaults. */
function whole(options: Partial<GlassParams>): GlassParams {
  return { ...DEFAULT_OPTIONS, ...options };
}

export interface Preset {
  name: string;
  note: string;
  /** "look" = a tuning of the glass itself; "demo" = a lens used elsewhere on this page. */
  kind: "look" | "demo";
  /**
   * What the gallery puts *under* the lens. A demo lens is meaningless on a
   * neutral chart — the selection indicator only makes sense over the tab row
   * it was shaped for — so those get the real surface.
   */
  bed?: "chart" | "tabs" | "dock" | "toggle" | "text";
  params: Partial<GlassParams>;
}

export const PRESET_GROUP_LABEL: Record<Preset["kind"], string> = {
  look: "Looks",
  demo: "Lenses from the demos below",
};

export const PRESETS: Preset[] = [
  {
    name: "Apple",
    kind: "look",
    note: "The house style: soft dome, warm rim.",
    params: { ...START },
  },
  {
    name: "Library default",
    kind: "look",
    note: "Exactly DEFAULT_OPTIONS, untouched.",
    params: { ...DEFAULT_OPTIONS, width: 220, height: 220 },
  },
  {
    name: "Fishbowl",
    kind: "look",
    note: "Full dome, huge strength — a marble on the page.",
    params: {
      width: 220, height: 220, radius: "auto", strength: 0.16, chromaticAberration: 0.7,
      blur: 0, depth: 80, curvature: 1, splay: 1, glow: 0.35, glowSpread: 1, glowExponent: 2.2,
      edgeHighlight: 0.9, edgeWidth: 5, edgeExponent: 1.5, specular: 1.2, specularAngle: 45,
    },
  },
  {
    name: "Frosted",
    kind: "look",
    note: "Blur inside the lens, gentle bend. Reads as a card.",
    params: {
      width: 300, height: 190, radius: 40, strength: 0.03, chromaticAberration: 0.1,
      blur: 6, depth: 18, curvature: 0.4, splay: 1, glow: 0.25, glowSpread: 1, glowExponent: 1.5,
      edgeHighlight: 0.5, edgeWidth: 4, edgeExponent: 1.5, specular: 1, specularAngle: 120,
    },
  },
  {
    name: "Prism",
    kind: "look",
    note: "Chroma cranked to 1 — the rim splits into a rainbow.",
    params: {
      width: 240, height: 240, radius: "auto", strength: 0.12, chromaticAberration: 1,
      blur: 0, depth: 40, curvature: 0.9, splay: 1, glow: 0.15, glowSpread: 0.6, glowExponent: 1.5,
      edgeHighlight: 0.35, edgeWidth: 3, edgeExponent: 1.5, specular: 1, specularAngle: 200,
    },
  },
  {
    name: "Barely there",
    kind: "look",
    note: "The tasteful one. Just enough to notice.",
    params: {
      width: 260, height: 120, radius: 28, strength: 0.02, chromaticAberration: 0.15,
      blur: 0, depth: 10, curvature: 0.6, splay: 1, glow: 0.08, glowSpread: 1, glowExponent: 1.5,
      edgeHighlight: 0.2, edgeWidth: 2, edgeExponent: 1.5, specular: 1, specularAngle: 45,
    },
  },
  {
    name: "Flat pane",
    kind: "look",
    note: "curvature 0: a linear ramp, no dome. Sheet of glass.",
    params: {
      width: 260, height: 260, radius: 20, strength: 0.06, chromaticAberration: 0.3,
      blur: 0, depth: 60, curvature: 0, splay: 0, glow: 0.1, glowSpread: 1, glowExponent: 1.5,
      edgeHighlight: 0.6, edgeWidth: 6, edgeExponent: 1.5, specular: 1, specularAngle: 90,
    },
  },

  // The lenses the rest of the page is built out of. Loading one here lets you
  // take it apart on a test chart, at the exact numbers the demo runs at.
  {
    name: "Hero circle",
    kind: "demo",
    note: "The floating circle at the top of the page.",
    params: whole(DEMO_LENSES.hero),
  },
  {
    name: "Selection indicator",
    kind: "demo",
    bed: "tabs",
    note: "The segmented control's glass pill. Tiny strength — it has to stay readable over text.",
    params: whole(DEMO_LENSES.selection),
  },
  {
    name: "Dock hover",
    kind: "demo",
    bed: "dock",
    note: "The rounded square that glides to the hovered icon.",
    params: whole(DEMO_LENSES.dock),
  },
  {
    name: "Toggle bar",
    kind: "demo",
    bed: "toggle",
    note: "The upstream .toggleWrap bar and the lens that rides it.",
    params: whole(DEMO_LENSES.toggle),
  },
  {
    name: "Reading glass",
    kind: "demo",
    bed: "text",
    note: "The magnifier: full dome, wide depth band. Reads as physical.",
    params: whole(DEMO_LENSES.reading),
  },
  {
    name: "Orbit",
    kind: "demo",
    note: "The lens the Motion section flies around by hand.",
    params: whole(DEMO_LENSES.orbit),
  },
  {
    name: "Engine panel",
    kind: "demo",
    note: "The one built with no React component at all.",
    params: whole(DEMO_LENSES.engine),
  },
];

/** Serialize params into the JSX you would actually write. */
export function toJsx(p: GlassParams, extras: string[] = []): string {
  const lines: string[] = [];
  const base = DEFAULT_OPTIONS as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(p)) {
    if (base[key] === value) continue; // omit anything already at its default
    lines.push(
      typeof value === "string" ? `  ${key}="${value}"` : `  ${key}={${round(value as number)}}`,
    );
  }
  for (const extra of extras) lines.push(`  ${extra}`);
  return `<LiquidGlass\n${lines.join("\n")}\n>\n  <YourContent />\n</LiquidGlass>`;
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
