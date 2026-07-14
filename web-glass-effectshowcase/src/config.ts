import {
  BUBBLE,
  CONCAVE,
  CONVEX,
  CONVEX_CIRCLE,
  ELASTIC,
  LIP,
  STEPPED,
  WAVE,
  type SurfaceFnDef,
} from "@creatorem/web-glass-effect";

/* ------------------------------------------------------------------ *
 * Surfaces
 * ------------------------------------------------------------------ */

export type SurfaceKey =
  | "CONVEX_CIRCLE"
  | "CONVEX"
  | "CONCAVE"
  | "LIP"
  | "WAVE"
  | "STEPPED"
  | "ELASTIC"
  | "BUBBLE";

/** Keyed by the library's export identifier, because that is what the codegen prints. */
export const SURFACES: Record<SurfaceKey, SurfaceFnDef> = {
  CONVEX_CIRCLE,
  CONVEX,
  CONCAVE,
  LIP,
  WAVE,
  STEPPED,
  ELASTIC,
  BUBBLE,
};

export const SURFACE_KEYS = Object.keys(SURFACES) as SurfaceKey[];

/* ------------------------------------------------------------------ *
 * The one config shape every section reads
 * ------------------------------------------------------------------ */

export interface GlassConfig {
  glassThickness: number;
  bezelWidth: number;
  refractiveIndex: number;
  blur: number;
  specularOpacity: number;
  specularSaturation: number;
  surface: SurfaceKey;
  width: number;
  height: number;
  radius: number;
  dpr: number;
  /** Multiplies `maximumDisplacement` into `feDisplacementMap/@scale`. LiquidFilter only. */
  scaleRatio: number;
  /** canvasWidth = width + 2·canvasPad. Lets displacement bleed past the object box. */
  canvasPad: number;
}

/**
 * The library's own defaults, transcribed from the destructuring defaults in
 * `LiquidFilter`. The Reference section does not trust this object: it probes the
 * rendered <filter> and flags any drift.
 */
export const LIBRARY_DEFAULTS: GlassConfig = {
  glassThickness: 40,
  bezelWidth: 20,
  refractiveIndex: 1.5,
  blur: 0.2,
  specularOpacity: 1,
  specularSaturation: 4,
  surface: "CONVEX",
  width: 320,
  height: 200,
  radius: 32,
  dpr: 1,
  scaleRatio: 1,
  canvasPad: 0,
};

/* ------------------------------------------------------------------ *
 * Cost model — derived from filter.tsx, not guessed
 *
 * `displacementData` is a useTransform over canvasWidth/canvasHeight/width/height/
 * dpr/bezelWidth/radius/glassThickness/refractiveIndex/bezelHeightFn.
 * `specularLayer` is a useTransform over width/height/radius/dpr only.
 * Both are then rasterised to a data: URL via canvas.toDataURL().
 *
 * Everything else lands on a single SVG attribute and costs nothing to redraw.
 * ------------------------------------------------------------------ */

export type Cost = "attribute" | "displacement" | "both";

export const COST_LABEL: Record<Cost, string> = {
  attribute: "attribute only",
  displacement: "redraws displacement map",
  both: "redraws both maps",
};

export const COST_BLURB: Record<Cost, string> = {
  attribute: "Writes one SVG attribute. No pixels are regenerated — free to animate every frame.",
  displacement:
    "Re-runs getDisplacementData over every pixel of the object box, then canvas.toDataURL().",
  both: "Re-runs getDisplacementData *and* calculateRefractionSpecular, then two toDataURL() calls.",
};

/* ------------------------------------------------------------------ *
 * Option registry — drives the Playground controls, the codegen, and the
 * Reference table. Adding a prop here adds it in all three places.
 * ------------------------------------------------------------------ */

export type Owner = "LiquidFilter" | "LiquidGlass" | "LiquidSlider" | "LiquidSwitch";

export interface OptionSpec {
  key: keyof GlassConfig;
  /** As written in the library's own type. */
  type: string;
  cost: Cost;
  /** Accepts `MotionValue<number>`, i.e. can be driven without a React re-render. */
  motion: boolean;
  owners: Owner[];
  min?: number;
  max?: number;
  step?: number;
  note?: string;
}

export const OPTIONS: OptionSpec[] = [
  {
    key: "glassThickness",
    type: "number | MotionValue<number>",
    cost: "displacement",
    motion: true,
    owners: ["LiquidFilter", "LiquidGlass", "LiquidSlider", "LiquidSwitch"],
    min: 1,
    max: 300,
    step: 1,
    note: "Longer ray travel inside the glass ⇒ larger displacement.",
  },
  {
    key: "bezelWidth",
    type: "number | MotionValue<number>",
    cost: "displacement",
    motion: true,
    owners: ["LiquidFilter", "LiquidGlass", "LiquidSlider", "LiquidSwitch"],
    min: 0,
    max: 120,
    step: 1,
    note: "Clamped to 2·radius − 1. Does NOT affect the specular layer, which hardcodes 50.",
  },
  {
    key: "refractiveIndex",
    type: "number | MotionValue<number>",
    cost: "displacement",
    motion: true,
    owners: ["LiquidFilter", "LiquidGlass", "LiquidSlider", "LiquidSwitch"],
    min: 1,
    max: 3,
    step: 0.01,
    note: "Snell's law. Water 1.33, glass 1.5. Below ~1 the profile flattens to zero.",
  },
  {
    key: "surface",
    type: "(x: number) => number",
    cost: "displacement",
    motion: false,
    owners: ["LiquidFilter", "LiquidGlass"],
    note: "Prop name is bezelHeightFn. A plain function — cannot be a MotionValue, so it costs a React render.",
  },
  {
    key: "blur",
    type: "number | MotionValue<number>",
    cost: "attribute",
    motion: true,
    owners: ["LiquidFilter", "LiquidGlass", "LiquidSwitch"],
    min: 0,
    max: 20,
    step: 0.1,
    note: "feGaussianBlur/@stdDeviation on the backdrop before displacement.",
  },
  {
    key: "specularOpacity",
    type: "number | MotionValue<number>",
    cost: "attribute",
    motion: true,
    owners: ["LiquidFilter", "LiquidGlass", "LiquidSwitch"],
    min: 0,
    max: 1,
    step: 0.01,
    note: "feFuncA/@slope on the highlight. JSDoc claims a default of 0.4; the code default is 1.",
  },
  {
    key: "specularSaturation",
    type: "number | MotionValue<number>",
    cost: "attribute",
    motion: true,
    owners: ["LiquidFilter", "LiquidGlass", "LiquidSwitch"],
    min: 0,
    max: 20,
    step: 0.1,
    note: "feColorMatrix saturate() applied to the displaced backdrop under the highlight.",
  },
  {
    key: "scaleRatio",
    type: "MotionValue<number>",
    cost: "attribute",
    motion: true,
    owners: ["LiquidFilter"],
    min: 0,
    max: 2,
    step: 0.01,
    note: "LiquidFilter only — LiquidGlass does not forward it. Multiplies maximumDisplacement.",
  },
  {
    key: "width",
    type: "number | MotionValue<number>",
    cost: "both",
    motion: true,
    owners: ["LiquidFilter", "LiquidGlass"],
    min: 80,
    max: 620,
    step: 1,
  },
  {
    key: "height",
    type: "number | MotionValue<number>",
    cost: "both",
    motion: true,
    owners: ["LiquidFilter", "LiquidGlass"],
    min: 60,
    max: 420,
    step: 1,
  },
  {
    key: "radius",
    type: "number | MotionValue<number>",
    cost: "both",
    motion: true,
    owners: ["LiquidFilter", "LiquidGlass"],
    min: 0,
    max: 160,
    step: 1,
    note: "On LiquidGlass this is read off computed border-radius, not passed directly.",
  },
  {
    key: "dpr",
    type: "number | MotionValue<number>",
    cost: "both",
    motion: true,
    owners: ["LiquidFilter", "LiquidGlass"],
    min: 1,
    max: 3,
    step: 1,
    note: "LiquidFilter defaults to 1; LiquidGlass defaults to window.devicePixelRatio. Buffer area scales dpr².",
  },
  {
    key: "canvasPad",
    type: "number | MotionValue<number>",
    cost: "displacement",
    motion: true,
    owners: ["LiquidFilter"],
    min: 0,
    max: 120,
    step: 1,
    note: "Props are canvasWidth/canvasHeight. LiquidFilter only. Object is centred in the larger canvas.",
  },
];

/* ------------------------------------------------------------------ *
 * Variants gallery. Presets that claim to reproduce an upstream demo are
 * *composed from* that demo's constants below, never retyped.
 * ------------------------------------------------------------------ */

/**
 * Ported verbatim from the library's own `apps/next-demo/app/components/liquid-glass-demo.tsx`.
 * The In Real UI section drives these; the gallery renders their resting state.
 */
export const GLASS_EFFECTS = {
  NAV_BLUR_DEFAULT: 0,
  NAV_BLUR_HOVER: 1.5,
  NAV_REFRACTIVE_INDEX_DEFAULT: 1.4,
  NAV_REFRACTIVE_INDEX_HOVER: 3,
  BOTTOM_BAR_BLUR_DEFAULT: 0,
  BOTTOM_BAR_BLUR_HOVER: 0.8,
  BOTTOM_BAR_BLUR_SEARCH_FOCUSED: 3.5,
  BOTTOM_BAR_REFRACTIVE_INDEX_DEFAULT: 1.4,
  BOTTOM_BAR_REFRACTIVE_INDEX_HOVER: 2,
  BOTTOM_BAR_REFRACTIVE_INDEX_SEARCH_FOCUSED: 3,
  SPRING_CONFIG: { stiffness: 300, damping: 30 },
} as const;

/** Ported verbatim from the upstream `liquid-surface-playground.tsx`. */
export const UPSTREAM_PLAYGROUND_SPRING = { stiffness: 300, damping: 30 } as const;

const preset = (label: string, blurb: string, over: Partial<GlassConfig>) => ({
  label,
  blurb,
  config: { ...LIBRARY_DEFAULTS, ...over } satisfies GlassConfig,
});

export const PRESETS = {
  defaults: preset("Library defaults", "Every optional prop omitted. This is what you get for free.", {}),

  navButton: preset("Upstream: nav button", "The 52px circular scroll button, at rest.", {
    glassThickness: 110,
    bezelWidth: 20,
    refractiveIndex: GLASS_EFFECTS.NAV_REFRACTIVE_INDEX_DEFAULT,
    blur: GLASS_EFFECTS.NAV_BLUR_DEFAULT,
    specularOpacity: 0.9,
    width: 52,
    height: 52,
    radius: 26,
  }),

  navButtonHover: preset("Upstream: nav button, hovered", "Same element, hover targets. Only two props move.", {
    glassThickness: 110,
    bezelWidth: 20,
    refractiveIndex: GLASS_EFFECTS.NAV_REFRACTIVE_INDEX_HOVER,
    blur: GLASS_EFFECTS.NAV_BLUR_HOVER,
    specularOpacity: 0.9,
    width: 52,
    height: 52,
    radius: 26,
  }),

  bottomBar: preset("Upstream: bottom bar", "The wide search bar, search field focused.", {
    glassThickness: 110,
    bezelWidth: 20,
    refractiveIndex: GLASS_EFFECTS.BOTTOM_BAR_REFRACTIVE_INDEX_SEARCH_FOCUSED,
    blur: GLASS_EFFECTS.BOTTOM_BAR_BLUR_SEARCH_FOCUSED,
    specularOpacity: 0.9,
    radius: 28,
  }),

  formField: preset("Upstream: form field", "Input overlay from the form demo. High index, thin blur.", {
    glassThickness: 110,
    bezelWidth: 20,
    refractiveIndex: 1.8,
    blur: 0.4,
    radius: 20,
    height: 120,
  }),

  stressPanel: preset("Upstream: stress panel", "The library's own /stress-panel starting values.", {
    glassThickness: 92,
    bezelWidth: 18,
    blur: 0.45,
    refractiveIndex: 1.72,
    specularOpacity: 0.85,
    specularSaturation: 6,
    radius: 28,
  }),

  storybook: preset("Upstream: Storybook surface", "Args from liquid-surfaces.stories.tsx.", {
    glassThickness: 100,
    bezelWidth: 22,
    blur: 0.6,
    refractiveIndex: 1.75,
    specularOpacity: 0.95,
    specularSaturation: 8,
    radius: 30,
  }),

  thickLens: preset("Thick lens", "Deep glass, wide bezel. Maximum bend.", {
    glassThickness: 260,
    bezelWidth: 70,
    refractiveIndex: 1.9,
    specularOpacity: 0.7,
    radius: 60,
  }),

  razorEdge: preset("Razor edge", "Almost no bezel: refraction collapses into a hard rim.", {
    glassThickness: 200,
    bezelWidth: 4,
    refractiveIndex: 2.4,
    specularOpacity: 1,
    radius: 24,
  }),

  concaveDish: preset("Concave dish", "CONCAVE inverts the bend — the backdrop pushes outward.", {
    surface: "CONCAVE",
    glassThickness: 140,
    bezelWidth: 55,
    radius: 48,
  }),

  lipRim: preset("Lip rim", "LIP — the profile LiquidSwitch hardcodes for its thumb.", {
    surface: "LIP",
    glassThickness: 120,
    bezelWidth: 40,
    specularOpacity: 0.8,
    radius: 40,
  }),

  steppedFresnel: preset("Stepped fresnel", "STEPPED quantises the profile into 4 bands.", {
    surface: "STEPPED",
    glassThickness: 160,
    bezelWidth: 60,
    radius: 40,
  }),

  elasticRipple: preset("Elastic ripple", "ELASTIC overshoots past 1 — concentric ringing at the rim.", {
    surface: "ELASTIC",
    glassThickness: 120,
    bezelWidth: 60,
    radius: 44,
  }),

  waveEdge: preset("Wave edge", "WAVE — a sine riding a sqrt ramp.", {
    surface: "WAVE",
    glassThickness: 150,
    bezelWidth: 50,
    radius: 40,
  }),

  bubbleDome: preset("Bubble dome", "BUBBLE peaks mid-bezel and returns to zero at the edge.", {
    surface: "BUBBLE",
    glassThickness: 170,
    bezelWidth: 60,
    specularSaturation: 8,
    radius: 44,
  }),

  bleedCanvas: preset("Canvas bleed", "canvasWidth/Height larger than the object: displacement is free to sample outside the box.", {
    glassThickness: 200,
    bezelWidth: 50,
    canvasPad: 80,
    radius: 40,
  }),

  flatGlass: preset("Flat glass", "bezelWidth 0 — no bend at all. The control case.", {
    bezelWidth: 0,
    blur: 2,
    specularOpacity: 0.2,
  }),
} as const;

export type PresetKey = keyof typeof PRESETS;
export const PRESET_KEYS = Object.keys(PRESETS) as PresetKey[];

/* ------------------------------------------------------------------ *
 * Backdrops — chosen to make the *effect* legible, not to look nice.
 * High frequency so displacement is obvious; neutral so it never competes
 * with the specular highlight. Colour is reserved for the controls.
 * ------------------------------------------------------------------ */

export type BackdropKey = "grid" | "checker" | "rings" | "type" | "photo" | "video" | "flat";

export const BACKDROPS: Record<BackdropKey, { label: string; blurb: string }> = {
  grid: {
    label: "Hairline grid",
    blurb: "1px rules. Straight lines make any bend read instantly.",
  },
  checker: {
    label: "Fine checker",
    blurb: "Highest spatial frequency. Worst case for the blur.",
  },
  rings: {
    label: "Concentric rings",
    blurb: "Curvature against curvature — shows asymmetry in the profile.",
  },
  type: {
    label: "Dense type",
    blurb: "Legibility test. If text survives the bezel, the profile is gentle.",
  },
  photo: {
    label: "Photograph",
    blurb: "A colour photo, as the upstream demos use. Realistic, but forgiving.",
  },
  video: {
    label: "Video",
    blurb: "An autoplaying <video> refracted live. Chrome/Firefox only — Safari can't route video through an SVG filter.",
  },
  flat: {
    label: "Flat neutral",
    blurb: "No texture. Isolates the specular layer with nothing to refract.",
  },
};

/* ------------------------------------------------------------------ *
 * Preset grouping — pill layout (ported from liquid-glass-showcase).
 * "upstream" presets reproduce a real demo; "look" presets explore a profile.
 * ------------------------------------------------------------------ */

export type PresetGroup = "upstream" | "look";

export const PRESET_GROUP_LABEL: Record<PresetGroup, string> = {
  look: "Looks",
  upstream: "Reproduces an upstream demo",
};

export const PRESET_GROUP: Record<PresetKey, PresetGroup> = {
  defaults: "look",
  thickLens: "look",
  razorEdge: "look",
  concaveDish: "look",
  lipRim: "look",
  steppedFresnel: "look",
  elasticRipple: "look",
  waveEdge: "look",
  bubbleDome: "look",
  bleedCanvas: "look",
  flatGlass: "look",
  navButton: "upstream",
  navButtonHover: "upstream",
  bottomBar: "upstream",
  formField: "upstream",
  stressPanel: "upstream",
  storybook: "upstream",
};
