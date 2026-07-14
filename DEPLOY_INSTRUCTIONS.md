# Deploy Instructions

This repo is a mixed catalog of static demos, Vite/Vue apps, Next.js apps, and a few projects that are not deployable on Vercel.

Use this file as the replay guide when moving the catalog to a new Vercel account.

## General flow

1. Sign in to the new Vercel account with `vercel login`.
2. `cd` into the exact project folder you want to deploy.
3. Run `vercel deploy --prod --yes`.
4. If Vercel asks for a preset, accept the one it auto-detects unless noted below.
5. After a successful deploy, update `index.html` in the root catalog with the new demo URL.
6. Push the repo changes so the catalog and the deployment notes stay in sync.

## Repo-wide rules

- Static projects should keep their demo links relative when the catalog site serves them from the repo root.
- For folders that contain a real framework app, deploy the framework subfolder, not the collection root.
- Keep `glassmorphism-wpf-master` marked as undeployable. It is not a Vercel target.

## Current deployment map

| Project | Type / preset | Deploy folder | Notes |
| --- | --- | --- | --- |
| `.` root catalog | Static / no framework | `/Users/lekan/Dev/glass-projects-lab` | Serves the catalog page in `index.html`. Deploy from the repo root. |
| `Frontend-Projects-main/liquid-glass-vue` | Vite | `/Users/lekan/Dev/glass-projects-lab/Frontend-Projects-main/liquid-glass-vue` | Vercel auto-detected Vite and built successfully. Live alias: `https://glass-projects-lab-frontend-vue.vercel.app/` |
| `liquid-glass-react-master/liquid-glass-example` | Next.js | `/Users/lekan/Dev/glass-projects-lab/liquid-glass-react-master/liquid-glass-example` | Vercel blocked `next@15.3.3` as vulnerable. Bumped to `next@16.2.10`, then deploy worked. Live alias: `https://glass-projects-lab-liquid-glass-exa.vercel.app/` |
| `glass-refraction-master/examples/vanilla` | Static HTML/CSS/JS | `/Users/lekan/Dev/glass-projects-lab/glass-refraction-master/examples/vanilla` | This is a static page. The stylesheet link must point to `../../src/css/glass.css`. No generated CSS file was needed. |
| `glass-refraction-master/examples/nextjs` | Next.js | Temporary demo folder used during deploy | The catalog points at `https://glass-projects-lab-glass-refraction.vercel.app/`. To reproduce from a fresh account, recreate a small Next app shell with the example `page.tsx` and shared glass components, then deploy that folder. |
| `liquid-glass-web-react` | Vite | `/Users/lekan/Dev/glass-projects-lab/liquid-glass-web-react` | Added `vercel.json` to build the `demo/` folder (`vite build demo`). Live alias: `https://glass-projects-lab-liquid-glass-web-react.vercel.app/` |
| `liquid-glass-showcase` (custom demo) | Vite | `/Users/lekan/Dev/glass-projects-lab/liquid-glass-showcase` | Custom full-API showcase for `liquid-glass-web-react`. Vercel project `glass-projects-lab-custom-demo`. Two gotchas: (1) locally Vite aliases the import to the sibling library's `src/`, but on Vercel only this folder is uploaded, so the alias falls away and the build resolves the published `liquid-glass-web-react@0.1.1` from `node_modules` — keep that dependency or the deploy breaks; (2) Vercel truncates a project's public `*.vercel.app` domain at 35 chars and puts longer aliases behind SSO, so the project name has to stay short. Live alias: `https://glass-projects-lab-custom-demo.vercel.app/` |
| `liquid-glass-apple` | Static HTML/CSS/JS | `/Users/lekan/Dev/glass-projects-lab/liquid-glass-apple` | CodePen demo (`wprod/raVpwJL`) copied in from `~/Downloads`. `vercel.json` sets `outputDirectory: dist`. Vercel project `glass-projects-lab-liquid-apple`. Live alias: `https://glass-projects-lab-liquid-apple.vercel.app/` |
| `liquid-glass-demo` | Vite | `/Users/lekan/Dev/glass-projects-lab/liquid-glass-demo` | Copied in from `~/Downloads`. **Deployed but deliberately not in the catalog**: it is still an unmodified Vite + React starter scaffold with no glass content, and its `liquid-glass-web-react` dependency is never imported. Its `file:` dep originally pointed at a Downloads-relative path (`file:../../Dev/...`), which breaks `npm ci` anywhere else — repointed to the published `^0.1.1`, same fix as `liquid-glass-showcase`. Add a catalog row once it has real content. Vercel project `glass-projects-lab-liquid-demo`. Live alias: `https://glass-projects-lab-liquid-demo.vercel.app/` |
| `glassmorphism-wpf-master` | Undeployable | N/A | Windows WPF project. Keep the catalog row greyed out with the `undeployable net` badge. |
| `web-glass-effectshowcase` (custom demo) | Vite | `/Users/lekan/Dev/glass-projects-lab/web-glass-effectshowcase` | Custom exhaustive showcase for `@creatorem/web-glass-effect`. Vercel project `glass-projects-lab-web-glass`. Same alias pattern as `liquid-glass-showcase`: locally Vite aliases the import to the sibling `web-glass-effect/packages/web-glass-effect/src`, but on Vercel only this folder uploads so it resolves the published `@creatorem/web-glass-effect@0.1.0` from `node_modules` — keep that dependency. Two extra notes: (1) `vite.config.ts` sets `resolve.dedupe: ['motion','react','react-dom']` — without it the aliased library and the demo load two copies of `motion`, the library's `value instanceof MotionValue` check fails across the boundary, dimensions become `NaN`, and the raster crashes (Vercel's npm dedupes so it's a dev-only safety net); (2) Tailwind is pulled in because the library ships class names but only `@tailwind` directives, so the consumer must scan the library — `tailwind.config.ts` globs both the sibling `src` (local) and `node_modules/@creatorem/web-glass-effect/dist` (Vercel). Live alias: `https://glass-projects-lab-web-glass.vercel.app/` |
| `DemoLiquidGlassReact` | Vite | `/Users/lekan/Dev/glass-projects-lab/DemoLiquidGlassReact` | iOS-style glassmorphism UI demo (React + Tailwind CDN). No local `index.css` — styling comes from the Tailwind CDN script, so the referenced `/index.css` 404s harmlessly. Vercel auto-detects Vite. Live alias: `https://glass-projects-lab-ios-ui-demo.vercel.app/` |
| `webgpu-jelly-slider` | Vite | `/Users/lekan/Dev/glass-projects-lab/webgpu-jelly-slider` | TypeGPU/WebGPU jelly slider (Software Mansion example). Needs a WebGPU-capable browser to render the canvas; the page ships its own fallback attribution text. Vercel auto-detects Vite. Live alias: `https://glass-projects-lab-webgpu-jelly.vercel.app/` |
| `react-bits-main/apps/fluid-glass` | Vite | **Deploy from `/Users/lekan/Dev/glass-projects-lab/react-bits-main`, not from the app folder.** | react-bits' own `FluidGlass`, full-bleed with a lens/bar/cube switcher. react-bits is a copy-paste registry, not an npm package, so the app imports the component straight out of the checkout (`@react-bits` → `../../src/ts-default`). That import lives *outside* the app root, so Node resolves its bare imports (`three`, `@react-three/*`, `maath`) against react-bits' own absent `node_modules` — `vite.config.ts` pins all six to `apps/fluid-glass/node_modules` or the build fails with "Rollup failed to resolve import three". Because the component is outside the app folder, the deploy root has to be the react-bits root: `react-bits-main/vercel.json` sets `installCommand`/`buildCommand` with `--prefix apps/fluid-glass` and `outputDirectory: apps/fluid-glass/dist`, so Vercel never tries to build the react-bits docs site. Vercel project `glass-projects-lab-fluid-glass`. Live alias: `https://glass-projects-lab-fluid-glass.vercel.app/` |
| `react-bits-fluid-glass-showcase` (custom demo) | Vite | `/Users/lekan/Dev/glass-projects-lab/react-bits-fluid-glass-showcase` | Custom exhaustive showcase for react-bits' `FluidGlass`, built from the brief in its own `CUSTOM_DEMO_PROMPT.md`. Vercel project `glass-projects-lab-fluid-showcase` (33 chars — under the 35-char public-domain limit). Same alias pattern as the other showcases, with one twist: **react-bits publishes no npm package**, so there is no published dependency to fall back on. Instead `@lib/FluidGlass` aliases to the sibling `react-bits-main/src/ts-default/.../FluidGlass.tsx` when it exists and to `src/vendor/FluidGlass.tsx` when it doesn't — which is the case on Vercel, since only this folder uploads. `npm run check:vendor` runs as part of `npm run build` and fails if the two have drifted, so the deployed page can't silently be a different component. Three other gotchas: (1) the six bare imports (`three`, `@react-three/fiber`, `@react-three/drei`, `maath`, `react`, `react-dom`) are pinned to this folder's `node_modules` in `vite.config.ts` — when the alias points at the sibling, that file is outside the resolution scope and a second copy of three/fiber breaks r3f's `instanceof` checks; (2) the FluidGlass GLBs are **Draco-compressed** and drei's `useGLTF` fetches its decoder from `gstatic.com` at runtime — the plain-three.js section vendors the decoder into `public/draco/` instead, so don't delete it; (3) `vercel.json` sets `buildCommand: "vite build"` deliberately, skipping the local `tsc --noEmit` so a `@types/three` drift can't block a deploy. `npm run test:e2e` drives 13 Playwright specs; `playwright.prod.config.ts` points the same suite at the live URL, which is how the vendored fallback gets verified. Live alias: `https://glass-projects-lab-fluid-showcase.vercel.app/` |
| `web-glass-effect/apps/next-demo` | Next.js (static export) | `/Users/lekan/Dev/glass-projects-lab/web-glass-effect/apps/next-demo/out` | The library's own reference demo. It's a Next app inside a pnpm workspace depending on `@creatorem/web-glass-effect` (`workspace:*`). Rather than wire a monorepo build on Vercel, all routes are static, so `next.config.ts` was given `output: 'export'`. Build locally with `pnpm --filter @creatorem/web-glass-effect build && pnpm --filter @creatorem/next-demo build`, then deploy the emitted `apps/next-demo/out/` folder as a plain static site. Vercel project `glass-projects-lab-wge-next`. Live alias: `https://glass-projects-lab-wge-next.vercel.app/` |

## Other static catalog entries

All of the other `static html/css/js` rows in `index.html` follow the same pattern:

1. If the demo is served from a real folder, point the catalog at that folder path.
2. If the demo is a deployed Vercel site, point the catalog at the live alias.
3. If a project has a `dist/` output, use that as the publish target only when a deployment actually needs a build output.

The repo already contains a lot of those static demos, so the root catalog is the source of truth for their current links.

## Notable fixes that were required

- `Frontend-Projects-main` is a collection repo, not a single app root. Deploy the actual app folder instead.
- `liquid-glass-react-master` needed a Next.js bump from `15.3.3` to `16.2.10` before Vercel would accept it.
- `glass-refraction-master/examples/vanilla` originally referenced a missing `dist` stylesheet. Point it to `../../src/css/glass.css`.
- `glass-refraction-master/examples/nextjs` is a Next demo, not a library root deploy.
- `glassmorphism-wpf-master` is not a Vercel app.

## Practical redeploy commands

```bash
# Root catalog
cd /Users/lekan/Dev/glass-projects-lab
vercel deploy --prod --yes

# Frontend Projects Vue demo
cd /Users/lekan/Dev/glass-projects-lab/Frontend-Projects-main/liquid-glass-vue
vercel deploy --prod --yes

# Liquid Glass React example
cd /Users/lekan/Dev/glass-projects-lab/liquid-glass-react-master/liquid-glass-example
vercel deploy --prod --yes

# Liquid Glass Web React demo
cd /Users/lekan/Dev/glass-projects-lab/liquid-glass-web-react
vercel deploy --prod --yes

# react-bits FluidGlass reference demo — note the react-bits ROOT, not the app folder
cd /Users/lekan/Dev/glass-projects-lab/react-bits-main
vercel deploy --prod --yes --name glass-projects-lab-fluid-glass

# react-bits FluidGlass showcase
cd /Users/lekan/Dev/glass-projects-lab/react-bits-fluid-glass-showcase
npm run check:vendor    # must pass before deploying, or the live page ships a stale component
vercel deploy --prod --yes --name glass-projects-lab-fluid-showcase
```

## Notes on the React/Next glass-refraction demo

The Next demo that was deployed for `glass-refraction-master next` was assembled outside the repo during the deploy pass. Its shape was:

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `components/Glass.tsx`
- `components/GlassCard.tsx`
- `components/GlassPill.tsx`
- `components/GlassFilters.tsx`
- `next.config.ts`
- `package.json` pinned to `next@16.2.10`

If you want to recreate it on a fresh account, copy that same structure into a temporary folder and deploy from there.
