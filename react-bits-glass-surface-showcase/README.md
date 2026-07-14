# react-bits GlassSurface — exhaustive showcase

A single page that proves what [react-bits'](https://github.com/DavidHDev/react-bits) `GlassSurface`
component actually does, against its source rather than its README.

Live: https://glass-projects-lab-gs-showcase.vercel.app/

## What it covers

1. **Playground** — all seventeen visual props, grouped by the path they take through the
   component (regenerates the SVG map / pokes a filter attribute / sets a CSS variable), with the
   generated JSX and a copy button.
2. **Internals** — calls the component's private `generateDisplacementMap()` directly and renders
   its output, then splits it into R/G/B planes to show why `yChannel` defaults to `G`.
3. **Variants gallery** — seven presets side by side, including one that removes chromatic
   aberration by equalising the channel offsets and one that disables displacement entirely.
4. **Imperative & performance** — a live frame-rate benchmark proving the component regenerates the
   displacement map even for props the map never reads.
5. **Framework-free core** — the same six-primitive filter graph rebuilt on plain DOM, with a real
   `dispose()` and an `update()` that skips the rebuild when it can.
6. **In real UI** — a music player whose chrome is `GlassSurface` holding live, interactive controls.
7. **Reference** — every prop and default parsed from the component source at runtime, plus a live
   report of whether the current browser gets the effect or the fallback.

## Findings

- The component's single `useEffect` lists all fifteen visual props as dependencies while calling
  `updateDisplacementMap()` unconditionally, so animating `distortionScale` — which the map does not
  read — rebuilds and re-decodes an SVG image every frame (§4, fixed in §5).
- `yChannel` defaults to `G`, but the generated map paints its vertical ramp into blue; green
  carries only the rim, which is why distortion concentrates at the edges (§2).
- `supportsSVGFilters()` refuses Safari and Firefox by user-agent string before any feature test, so
  the whole effect silently degrades to a plain blur there (§7).
- `mixBlendMode` is not the surface's blend mode; it blends two gradients inside the generated map.
- `blur` blurs the map, not the output; only `displace` blurs what you see.
- The identical ResizeObserver effect is registered twice.

## Develop

```bash
npm install
npm run dev        # aliases GlassSurface to ../react-bits-main when present, else src/vendor
npm run build      # runs check:vendor + tsc + vite build
npm run test:e2e   # 15 Playwright specs
```

`src/lib/config.ts` is the single source of truth; every section imports its configs from it.
