/**
 * The one source of truth for this demo.
 *
 * Every FluidGlass configuration rendered anywhere on the page is defined here and
 * imported by the sections. A preset that claims to reproduce another section's
 * output *is* that section's object, never a copy of it.
 */

export type Mode = 'lens' | 'bar' | 'cube';

export interface NavItem {
  label: string;
  link: string;
}

/** Anything not named `navItems` is spread into drei's MeshTransmissionMaterial. */
export type ModeProps = Record<string, unknown> & { navItems?: NavItem[] };

/**
 * What a prop costs when it changes. Derived from the source, not invented:
 *
 * - `remount`  — read once at mount (`useGLTF`, `memo`'d ModeWrapper, the Canvas
 *                itself). Changing it needs a new `key`.
 * - `recompile` — a MeshTransmissionMaterial *define*; changing it rebuilds the
 *                shader program and reallocates its render targets.
 * - `uniform`  — a plain material uniform. Free to animate every frame.
 * - `perframe` — consumed inside FluidGlass's own `useFrame`.
 */
export type Cost = 'remount' | 'recompile' | 'uniform' | 'perframe';

export interface ControlSpec {
  key: string;
  label: string;
  cost: Cost;
  kind: 'range' | 'color' | 'bool' | 'select';
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  /** Modes where the prop has a visible effect; undefined means all three. */
  modes?: Mode[];
  hint: string;
}

/**
 * Defaults FluidGlass applies itself, via `?? literal` in ModeWrapper.
 * `src/lib/source.ts` re-reads these out of the real source file at runtime and
 * the reference table renders *that*, so this object cannot silently drift.
 */
export const FLUID_GLASS_DEFAULTS = {
  scale: 0.15,
  ior: 1.15,
  thickness: 5,
  anisotropy: 0.01,
  chromaticAberration: 0.1
} as const;

/** Bar mode merges these *under* whatever the caller passes in `barProps`. */
export const BAR_MATERIAL_DEFAULTS = {
  transmission: 1,
  roughness: 0,
  thickness: 10,
  ior: 1.15,
  color: '#ffffff',
  attenuationColor: '#ffffff',
  attenuationDistance: 0.25
} as const;

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Home', link: '' },
  { label: 'About', link: '' },
  { label: 'Contact', link: '' }
];

/** Hardcoded inside FluidGlass; surfaced here so the Internals section can reuse them. */
export const INTERNALS = {
  camera: { position: [0, 0, 20] as [number, number, number], fov: 15 },
  scroll: { damping: 0.2, pages: 3, distance: 0.4 },
  /** `gl.setClearColor(0x5227ff, 1)` — the canvas background cannot be changed. */
  clearColor: '#5227ff',
  /** `easing.damp3(ref.current.position, dest, 0.15, delta)` */
  pointerSmoothTime: 0.15,
  /** The plane the mesh is pinned to, and the plane the viewport is measured at. */
  meshZ: 15,
  /** Auto-fit when `scale` is omitted: `min(0.15, viewport.width * 0.9 / geoWidth)`. */
  autoScale: { cap: 0.15, viewportFraction: 0.9 },
  geometryKey: { lens: 'Cylinder', bar: 'Cube', cube: 'Cube' } as Record<Mode, string>,
  glb: { lens: '/assets/3d/lens.glb', bar: '/assets/3d/bar.glb', cube: '/assets/3d/cube.glb' } as Record<Mode, string>
} as const;

/** Every knob FluidGlass will actually forward, including the ones its own demo hides. */
export const CONTROLS: ControlSpec[] = [
  {
    key: 'mode',
    label: 'mode',
    cost: 'remount',
    kind: 'select',
    options: ['lens', 'bar', 'cube'],
    hint: 'Picks the GLB, the geometry key, and whether the mesh follows the pointer.'
  },
  {
    key: 'scale',
    label: 'scale',
    cost: 'perframe',
    kind: 'range',
    min: 0.05,
    max: 0.5,
    step: 0.01,
    hint: 'Omit it entirely and ModeWrapper auto-fits the mesh to the viewport every frame instead.'
  },
  {
    key: 'ior',
    label: 'ior',
    cost: 'uniform',
    kind: 'range',
    min: 1,
    max: 2.33,
    step: 0.01,
    hint: 'Index of refraction. 1 = no bending, 1.5 ≈ glass, 2.42 ≈ diamond.'
  },
  {
    key: 'thickness',
    label: 'thickness',
    cost: 'uniform',
    kind: 'range',
    min: 0,
    max: 20,
    step: 0.1,
    hint: 'How far light travels inside the volume. Drives attenuation as well as refraction.'
  },
  {
    key: 'chromaticAberration',
    label: 'chromaticAberration',
    cost: 'uniform',
    kind: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    hint: 'Splits R/G/B refraction offsets. The rainbow fringing at the rim.'
  },
  {
    key: 'anisotropy',
    label: 'anisotropy',
    cost: 'uniform',
    kind: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    hint: 'Directional blur of the transmitted image. Cheap frosting.'
  },
  {
    key: 'transmission',
    label: 'transmission',
    cost: 'uniform',
    kind: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    hint: 'How much light passes through. 0 turns the glass into an opaque solid.'
  },
  {
    key: 'roughness',
    label: 'roughness',
    cost: 'uniform',
    kind: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    hint: 'Surface scatter. Distinct from anisotropy: this frosts the reflection too.'
  },
  {
    key: 'distortion',
    label: 'distortion',
    cost: 'uniform',
    kind: 'range',
    min: 0,
    max: 2,
    step: 0.01,
    hint: 'Undocumented pass-through. Adds noise-based surface warp — the actual "fluid".'
  },
  {
    key: 'distortionScale',
    label: 'distortionScale',
    cost: 'uniform',
    kind: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    hint: 'Undocumented pass-through. Frequency of the distortion noise.'
  },
  {
    key: 'temporalDistortion',
    label: 'temporalDistortion',
    cost: 'uniform',
    kind: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    hint: 'Undocumented pass-through. Animates the distortion over time.'
  },
  {
    key: 'clearcoat',
    label: 'clearcoat',
    cost: 'uniform',
    kind: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    hint: 'Undocumented pass-through. A lacquer layer over the glass.'
  },
  {
    key: 'attenuationDistance',
    label: 'attenuationDistance',
    cost: 'uniform',
    kind: 'range',
    min: 0.05,
    max: 5,
    step: 0.05,
    hint: 'Distance over which attenuationColor tints the transmitted light. Bar mode sets 0.25.'
  },
  {
    key: 'color',
    label: 'color',
    cost: 'uniform',
    kind: 'color',
    hint: 'Base tint. Bar mode defaults it to #ffffff; lens/cube leave it at the material default.'
  },
  {
    key: 'attenuationColor',
    label: 'attenuationColor',
    cost: 'uniform',
    kind: 'color',
    hint: 'The colour the volume absorbs toward, weighted by thickness / attenuationDistance.'
  },
  {
    key: 'samples',
    label: 'samples',
    cost: 'recompile',
    kind: 'range',
    min: 1,
    max: 32,
    step: 1,
    hint: 'Refraction samples per pixel. A shader define — changing it rebuilds the program.'
  },
  {
    key: 'resolution',
    label: 'resolution',
    cost: 'recompile',
    kind: 'range',
    min: 64,
    max: 1024,
    step: 64,
    hint: 'Transmission render-target size. Reallocates a framebuffer on every change.'
  },
  {
    key: 'backside',
    label: 'backside',
    cost: 'recompile',
    kind: 'bool',
    hint: 'Renders the back faces in a second pass. Doubles the draw cost; sells thick volumes.'
  }
];

/**
 * Named configs. These are the objects actually handed to FluidGlass — the
 * playground's starting state, the gallery cards, and the real-UI section all
 * read from this map.
 */
export const DEMO_CONFIGS: Record<string, { mode: Mode; label: string; note: string; props: ModeProps }> = {
  /** The upstream demo's own defaults, from src/demo/Components/FluidGlassDemo.jsx. */
  lensDefault: {
    mode: 'lens',
    label: 'Lens (upstream default)',
    note: "react-bits' own demo settings for lens mode.",
    props: { scale: 0.25, ior: 1.15, thickness: 5, chromaticAberration: 0.1, anisotropy: 0.01 }
  },
  cubeDefault: {
    mode: 'cube',
    label: 'Cube (upstream default)',
    note: 'Same material, different GLB. The flat faces make refraction read as a prism.',
    props: { scale: 0.25, ior: 1.15, thickness: 5, chromaticAberration: 0.1, anisotropy: 0.01 }
  },
  barDefault: {
    mode: 'bar',
    label: 'Bar (upstream default)',
    note: 'Locked to the bottom edge, ignores the pointer, and is the only mode that draws navItems.',
    props: {
      ...BAR_MATERIAL_DEFAULTS,
      scale: 0.15,
      chromaticAberration: 0.1,
      anisotropy: 0.01,
      navItems: DEFAULT_NAV_ITEMS
    }
  },
  diamond: {
    mode: 'cube',
    label: 'Diamond',
    note: 'ior pushed to 2.33 with heavy aberration. Total internal reflection starts to dominate.',
    props: { scale: 0.25, ior: 2.33, thickness: 5, chromaticAberration: 0.45, anisotropy: 0.02 }
  },
  frosted: {
    mode: 'lens',
    label: 'Frosted',
    note: 'roughness + anisotropy, both undocumented for lens mode, turn it into etched glass.',
    props: { scale: 0.3, ior: 1.2, thickness: 8, chromaticAberration: 0.02, anisotropy: 0.55, roughness: 0.35 }
  },
  fluid: {
    mode: 'lens',
    label: 'Fluid',
    note: 'The name of the component, finally earned: distortion + temporalDistortion animate the surface.',
    props: {
      scale: 0.35,
      ior: 1.35,
      thickness: 12,
      chromaticAberration: 0.2,
      anisotropy: 0.05,
      distortion: 0.6,
      distortionScale: 0.35,
      temporalDistortion: 0.2
    }
  },
  amber: {
    mode: 'cube',
    label: 'Amber',
    note: 'Volumetric absorption: a short attenuationDistance over a thick body stains the transmitted image.',
    props: {
      scale: 0.28,
      ior: 1.5,
      thickness: 18,
      chromaticAberration: 0.08,
      anisotropy: 0.01,
      color: '#ffffff',
      attenuationColor: '#ff9d2e',
      attenuationDistance: 0.6
    }
  },
  /** Bar mode driving the "In real UI" section — the nav links resolve to real hash targets. */
  productNav: {
    mode: 'bar',
    label: 'Product nav',
    note: 'Bar mode as an actual navigation bar, with links that move the page.',
    props: {
      ...BAR_MATERIAL_DEFAULTS,
      scale: 0.15,
      thickness: 10,
      chromaticAberration: 0.12,
      anisotropy: 0.02,
      navItems: [
        { label: 'Overview', link: '#s6' },
        { label: 'Playground', link: '#s1' },
        { label: 'Internals', link: '#s2' },
        { label: 'Reference', link: '#s7' }
      ]
    }
  }
};

/** The gallery renders exactly these, in order. */
export const GALLERY_KEYS = ['lensDefault', 'barDefault', 'cubeDefault', 'diamond', 'frosted', 'fluid', 'amber'];

/** The playground boots from the upstream lens defaults, so it starts where react-bits starts. */
export const PLAYGROUND_INITIAL = DEMO_CONFIGS.lensDefault;

export interface Backdrop {
  key: string;
  label: string;
  note: string;
}

/**
 * FluidGlass paints its own opaque #5227ff background, so these govern the *page*
 * and the sections that render the pipeline by hand. High-frequency and neutral by
 * default: colour would compete with the chromatic aberration you're trying to judge.
 */
export const BACKDROPS: Backdrop[] = [
  { key: 'checker', label: 'Checker', note: 'Hard edges. The reference for judging distortion and aberration.' },
  { key: 'grid', label: 'Grid', note: 'Straight lines. Shows exactly how the lens bends geometry.' },
  { key: 'noise', label: 'Noise', note: 'High frequency, no structure. Exposes blur from roughness/anisotropy.' },
  { key: 'photo', label: 'Photo', note: 'The upstream demo imagery, for a realistic read.' },
  { key: 'flat', label: 'Flat', note: 'A control. Nothing to refract, so only the rim survives.' }
];
