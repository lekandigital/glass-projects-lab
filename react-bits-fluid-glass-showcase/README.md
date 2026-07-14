# react-bits FluidGlass — exhaustive showcase

A single page that proves what [react-bits'](https://github.com/DavidHDev/react-bits) `FluidGlass`
component actually does, against its source rather than its README.

Live: https://glass-projects-lab-fluid-showcase.vercel.app/
Built from: [`CUSTOM_DEMO_PROMPT.md`](./CUSTOM_DEMO_PROMPT.md)

## What it found

The README documents four props. The component forwards eighteen, and hides a runtime dependency:

- **Everything that isn't `navItems` is spread into drei's `MeshTransmissionMaterial.`** `distortion`,
  `temporalDistortion`, `roughness`, `samples`, `backside`, `attenuationColor` and the rest all work,
  and none of them are documented. The `Fluid` and `Amber` presets exist only because of this.
- **The GLBs are Draco-compressed**, and drei's `useGLTF` silently wires a `DRACOLoader` pointed at
  `gstatic.com`. FluidGlass reaches out to a Google CDN at runtime to decode its own geometry. Not in
  the README, not in the dependency list. Section 5 vendors the decoder to `/draco/` instead.
- **The auto-fit branch is effectively dead.** Omit `scale` and it recomputes
  `min(0.15, viewport.width * 0.9 / geoWidth)` every frame — but the measured `geoWidth` is 2.0
  (lens/cube) and 8.62 (bar), and the viewport at `z=15` is only ~1.3–3.3 world units wide, so it
  resolves to the constant `0.15` on every real screen.
- **The background is unthemeable.** `gl.setClearColor(0x5227ff, 1)` runs every frame.
- **There is no `children` prop.** The scene it refracts is a hardcoded "React Bits" wordmark over
  five hardcoded images. You cannot put your own UI behind it without forking the component.
- **There is no ref, no `forwardRef`, no `useImperativeHandle`.** No imperative surface at all.

## Sections

| # | Section | Proves |
| --- | --- | --- |
| 1 | Playground | All 18 forwarded props, badged by cost (remount / recompile / uniform / per-frame), with generated code. |
| 2 | Internals | The FBO fed to the material, the real GLB bounding boxes, and `maath`'s `easing.damp3` called directly and plotted. |
| 3 | Variants gallery | Seven live configs side by side. |
| 4 | Imperative & performance | `useFrame` mutation (1 React commit) vs the same easing through `useState` (~120 commits/sec), both at 122fps. |
| 5 | Framework-free core | The whole pipeline in plain three.js on a plain `<div>`, with real teardown. |
| 6 | In real UI | Bar mode as a working nav, and the limitation that stops it being more. |
| 7 | Reference | Every prop and default, parsed out of the component's source at runtime. |

## Development

```bash
npm install
npm run dev            # aliases @lib/FluidGlass → ../react-bits-main/src/... if present
npm run check:vendor   # fails if src/vendor/FluidGlass.tsx has drifted from react-bits
npm run build
npm run test:e2e       # 13 Playwright specs; screenshots land in test-results/shots/
```

`@lib/FluidGlass` resolves to the sibling react-bits checkout when it exists, so upstream edits
hot-reload. Vercel only uploads this folder, so there it falls back to `src/vendor/FluidGlass.tsx` —
kept honest by `check:vendor`, which runs as part of `npm run build`.
