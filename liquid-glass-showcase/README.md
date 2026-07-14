# liquid-glass-showcase

A single page that exercises everything `liquid-glass-web-react` can do.

```sh
npm install
npm run dev      # http://localhost:5190
```

It runs against the library **source** in `~/Dev/glass-projects-lab/liquid-glass-web-react`
(see the alias in `vite.config.ts`), so edits there hot-reload here. To make this folder
standalone, delete the alias and `npm install liquid-glass-web-react`.

## What's on the page

| Section | Covers |
| --- | --- |
| Hero | A page-region lens with idle wander + drag, driven through the imperative handle. |
| 01 Playground | All 18 engine options as live controls, plus `draggable`, `shadow`, `quality`, `radius="auto"`, `onMove`, `onMapGenerated`. Six substrates (photo, text, live UI, lens chart, video, canvas), presets, and the JSX for whatever you've dialled in. |
| 02 The map | `computeDisplacementMap` called directly and split into R / G / B / A. `renderDisplacementMap` behind the download button. |
| 03 Shapes | Circle, pill, squircle, sharp pane, slit, bevelled slab — each using the built-in `draggable` prop. |
| 04 Motion | `ref.setPosition()` per frame vs. the same orbit through React state, with a render counter and FPS meter. `engine.setOptions()` breathing `strength`/`chroma`. |
| 05 Engine | `new LiquidGlassEngine(...)` on plain DOM, no `<LiquidGlass>` — plus `destroy()`. |
| 06 In UI | Segmented control (glass as selection indicator), dock hover, reading magnifier over selectable text, three nested lenses refracting each other. |
| 07 Reference | Every prop and export; defaults read live from `DEFAULT_OPTIONS`. |

Light/dark toggle in the top bar; the choice persists in `localStorage`.

Every lens on the page is defined once, in `DEMO_LENSES` (`src/glass.ts`), and the sections import
from there — so the playground's dashed "from the demos below" presets (hero circle, selection
indicator, dock hover, reading glass, orbit, engine panel) are guaranteed to be the same numbers
the demos actually run at, not a copy that drifted.

## Why the page is grey

A lens is judged on three things: whether the geometry bends cleanly, whether the rim splits into
a red/blue fringe (`chromaticAberration`), and whether the specular highlight reads as *white*
light. A tinted backdrop hides all three — you cannot see color fringing against a background that
is already colored. So the beds are achromatic test surfaces (`.bed-grid`, `.bed-chart`,
`.bed-check` in `styles.css`), and hue is reserved for the controls. The photo substrate is the
one deliberate exception: the real-world case.

## Notes

- The `video` substrate refracts in Chrome and Firefox. Safari never routes `<video>` through
  SVG filters — it plays, but flat.
- No `<StrictMode>`: the Motion section counts real renders, and StrictMode's double-invoke
  would make those numbers lie.
