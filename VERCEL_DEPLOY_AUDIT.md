# Vercel Deploy Audit

This note is the replay guide for the current `glass-projects-lab` repository after the root folder rename from `projects-glass-attempt-two`.

The key rule is that the repo folder name changed, but the actual deploy shape did not. The same project folders are still the same deploy targets. What changed is the root catalog path, the repo URL, and in some cases the Vercel project slug.

## What changed with the rename

- Old local repo root: `/Users/lekan/Dev/projects-glass-attempt-two`
- Current local repo root: `/Users/lekan/Dev/glass-projects-lab`
- Old gallery URL used in notes and historical deploys: `https://projects-glass-attempt-two-chi.vercel.app`
- Current gallery URL for the renamed repo: `https://glass-projects-lab.vercel.app`

Do not confuse the local folder rename with the Vercel project name. Several projects kept their old Vercel slugs, while some were recreated or re-linked under new `glass-projects-lab-*` project names during later work.

## Global deploy rules

- Deploy the repo root when the target is the catalog site itself.
- For framework apps inside collection repos, deploy the actual app folder, not the collection root.
- For static examples that are meant to stay inside the catalog, leave relative demo links alone. If a link points to a relative path like `folder/` or `folder/dist/`, do not rewrite it to a Vercel URL unless the notes explicitly say the project was redeployed externally.
- Do not deploy `glassmorphism-wpf-master` to Vercel. It is not a Vercel target.

## Current live registry seen after login

This is the set returned by `vercel project list --json` in the current account context at the time of the audit:

| Vercel project | Latest production URL | Notes |
| --- | --- | --- |
| `projects-glass-attempt-two` | `https://projects-glass-attempt-two-chi.vercel.app` | Legacy root gallery from the previous repo name. |
| `liquid-glass-vue` | `https://liquid-glass-vue-eta.vercel.app` | The real Vite app behind `Frontend-Projects-main`. |
| `frontend-projects-main` | `https://frontend-projects-main.vercel.app` | Collection root, not the deploy target you want for the demo. |
| `glass-projects-lab-glass-refraction-nextjs` | `https://glass-projects-lab-glass-refraction.vercel.app` | Temporary Next shell used for the `glass-refraction-master next` demo. |
| `glass-projects-lab-liquid-glass-example` | `https://glass-projects-lab-liquid-glass-exa.vercel.app` | React/Next example under `liquid-glass-react-master/liquid-glass-example`. |
| `glass-button-css-only` | `https://glass-button-css-only-one.vercel.app` | Static button demo. |
| `ios-liquid-glass` | `https://ios-liquid-glass-alpha.vercel.app` | Static iOS glass demo. |
| `apple-liquid-glass-ui-2025` | `https://apple-liquid-glass-ui-2025.vercel.app` | Static Apple glass demo. |
| `apple-liquid-glass-from-lucasromerodb-liquid-glass-effect-macos` | `https://apple-liquid-glass-from-lucasromero.vercel.app` | Static Apple glass demo. |
| `apple-liquid-glass-experiments` | `https://apple-liquid-glass-experiments.vercel.app` | Static Apple glass demo. |
| `glass-like-css` | `https://glass-like-css.vercel.app` | Static glass button demo. |
| `cross-browser-liquid-toggle-drag-tap` | `https://cross-browser-liquid-toggle-drag-ta.vercel.app` | Static cross-browser toggle demo. |
| `apple-liquid-glass` | `https://apple-liquid-glass-flax.vercel.app` | Static Apple glass demo. |

## Folder-to-project mapping from the repo

The repo contains local `.vercel/project.json` files in multiple folders. Those are the most important files for replaying deploys because they tell us exactly which folder was linked to which project.

### Root catalog

- Folder: `/Users/lekan/Dev/glass-projects-lab`
- Role: catalog site
- Local Vercel link history: `projects-glass-attempt-two` in earlier work, later renamed for the new repo root
- Current live gallery URL in the renamed repo: `https://glass-projects-lab.vercel.app`
- Deployment rule: deploy from the repo root, not from a subfolder.

### `Frontend-Projects-main`

- Collection root folder: `/Users/lekan/Dev/glass-projects-lab/Frontend-Projects-main`
- This folder is a collection, not the deployable app itself.
- The deployable app folder is: `/Users/lekan/Dev/glass-projects-lab/Frontend-Projects-main/liquid-glass-vue`
- Framework: Vite
- Important note: the root collection should not be deployed for the demo. The actual app folder is the target.
- `package.json` in `liquid-glass-vue` uses Vite with `vite build`.
- The folder currently has no `vercel.json`; Vercel auto-detects Vite.

### `liquid-glass-react-master`

- Collection root folder: `/Users/lekan/Dev/glass-projects-lab/liquid-glass-react-master`
- Deployable app folder: `/Users/lekan/Dev/glass-projects-lab/liquid-glass-react-master/liquid-glass-example`
- Framework: Next.js
- Important note: the collection root is not the live demo target.
- The example folder has its own `.vercel/project.json`.
- The README says the live demo is the `liquid-glass` React example, and the local deploy note says the Next build needed a version bump from `next@15.3.3` to `next@16.2.10` before Vercel accepted it.

### `glass-refraction-master`

- Deployable static example: `/Users/lekan/Dev/glass-projects-lab/glass-refraction-master/examples/vanilla`
- Special CSS note: the stylesheet must point at `../../src/css/glass.css`.
- Do not expect a generated CSS file here. The deployed static page uses the source CSS file directly.
- Next demo note: `glass-refraction-master/examples/nextjs` was deployed by assembling a temporary Next app shell outside the repo, then copying in the example `page.tsx`, the shared glass components, and the same vanilla `glass.css` / layout recipe used by the static example.
- That temporary shape was:
  - `app/layout.tsx`
  - `app/page.tsx`
  - `app/globals.css`
  - `components/Glass.tsx`
  - `components/GlassCard.tsx`
  - `components/GlassPill.tsx`
  - `components/GlassFilters.tsx`
  - `next.config.ts`
  - `package.json` pinned to `next@16.2.10`

### `liquid-dom-master`

- Root folder: `/Users/lekan/Dev/glass-projects-lab/liquid-dom-master`
- This is a monorepo, so deploying the root is not the same thing as deploying the showcase demo.
- `vercel.json` at the root uses:
  - `installCommand: pnpm install --frozen-lockfile`
  - `buildCommand: pnpm --filter showcase... build`
  - `outputDirectory: demo/showcase/dist`
- There is also a `demo/showcase` Vercel config in the repo, which is the important deploy target for the showcase path.
- Deployment rule: use the actual showcase app flow, not the root package graph, when you want the live demo.

### `7.css-main`

- Root folder: `/Users/lekan/Dev/glass-projects-lab/7.css-main`
- Framework/preset: node build
- `package.json` build script: `node build.js`
- `vercel.json` uses `buildCommand: npm run build` and `outputDirectory: dist`
- This project is a build-to-dist package, so the deployment is the built output, not a raw source HTML folder.

### `css.glass-main`

- Root folder: `/Users/lekan/Dev/glass-projects-lab/css.glass-main`
- Framework/preset: Nuxt
- `package.json` build script: `npm run generate`
- `vercel.json` uses `buildCommand: npm run generate` and `outputDirectory: dist`
- Important note: deploy this as the Nuxt app, not as a static copy of `dist/`.

## Local Vercel links found in the repo

These `.vercel/project.json` files were present locally and are useful when replaying the same deploys after an account switch:

| Folder | Local project name |
| --- | --- |
| `7.css-main/.vercel/project.json` | `glass-projects-lab-7css-main` |
| `Frontend-Projects-main/.vercel/project.json` | `frontend-projects-main` |
| `Frontend-Projects-main/liquid-glass-vue/.vercel/project.json` | `glass-projects-lab-frontend-vue` |
| `Frontend-Projects-main/movie-instantsearch/.vercel/project.json` | `movie-instantsearch` |
| `apple-liquid-glass/.vercel/project.json` | `glass-projects-lab-apple-liquid-glass` |
| `apple-liquid-glass-experiments/.vercel/project.json` | `glass-projects-lab-apple-glass-experiments` |
| `apple-liquid-glass-from-lucasromerodb-liquid-glass-effect-macos/.vercel/project.json` | `glass-projects-lab-lucas-romero-glass` |
| `apple-liquid-glass-ui-2025/.vercel/project.json` | `glass-projects-lab-apple-liquid-ui-2025` |
| `cross-browser-liquid-toggle-drag-tap/.vercel/project.json` | `glass-projects-lab-cross-browser-toggle` |
| `css.glass-main/.vercel/project.json` | `glass-projects-lab-css-glass` |
| `glass-button-css-only/.vercel/project.json` | `glass-button-css-only` |
| `glass-like-css/.vercel/project.json` | `glass-projects-lab-glass-like-css` |
| `glass-model/.vercel/project.json` | `glass-model` |
| `glass-refraction-master/.vercel/project.json` | `glass-refraction-master` |
| `glass-refraction-master 2/.vercel/project.json` | `glass-refraction-master-2` |
| `glassmorphism-main/.vercel/project.json` | `glass-projects-lab-glassmorphism-main` |
| `glassmorphism-wpf-master/.vercel/project.json` | `glassmorphism-wpf-master` |
| `ios-liquid-glass/.vercel/project.json` | `glass-projects-lab-ios-liquid-glass` |
| `lab-main/.vercel/project.json` | `glass-projects-lab-lab-main` |
| `liquid-dom-master/.vercel/project.json` | `liquid-dom-master` |
| `liquid-dom-master/demo/showcase/.vercel/project.json` | `showcase` |
| `liquid-glass-react-master/.vercel/project.json` | `liquid-glass-react-master` |
| `liquid-glass-react-master/liquid-glass-example/.vercel/project.json` | `liquid-glass-example` |
| `liquidGL-main/.vercel/project.json` | `liquidgl-main` |
| `liquidGL-main 2/.vercel/project.json` | `liquidgl-main-2` |

## Catalog link rules

The root `index.html` is the source of truth for what should be linked as:

- external deployed Vercel URL
- internal relative folder path
- undeployable folder

Do not rewrite the following kinds of links unless you intentionally want to move them off the catalog site:

- `folder/`
- `folder/dist/`
- `folder/examples/vanilla/`
- any other relative path that is meant to work when the catalog is hosted from the repo root

## High-signal reminders

- `Frontend-Projects-main` should always be treated as a collection repo.
- `liquid-glass-react-master` should always deploy the example subfolder, not the root.
- `glass-refraction-master/examples/nextjs` is not a stable checked-in app shell; it was assembled for deployment.
- `glassmorphism-wpf-master` is intentionally excluded from Vercel.
- The rename from `projects-glass-attempt-two` to `glass-projects-lab` does not change the actual project content. It only changes local repo paths and the catalog branding.

## Practical replay order after an account switch

1. Log in to the new Vercel account.
2. Re-link the root catalog from `/Users/lekan/Dev/glass-projects-lab`.
3. Re-link the real app subfolder for `Frontend-Projects-main/liquid-glass-vue`.
4. Re-link the real app subfolder for `liquid-glass-react-master/liquid-glass-example`.
5. Rebuild the special Next demo for `glass-refraction-master next` only if that alias still needs to exist in the new account.
6. Leave the relative `/dist/` catalog links alone unless a specific project is being intentionally moved to an external deploy.

## Console history and error recovery

This section records the exact deploy-console behavior observed during the last pass so the same failure modes can be recognized quickly after the account switch.

### Successful command patterns

- `vercel logout`
  - Worked immediately.
  - Ended with `> Success! Logged out!`
- `vercel login`
  - Dropped into device-code auth.
  - Printed a browser URL of the form `https://vercel.com/oauth/device?user_code=...`
  - Stayed in `Waiting for authentication...` until the browser step would be completed.
- `vercel project add <name>`
  - Worked without `--yes`.
  - The `--yes` flag was rejected by the CLI for `project add`.
- `vercel link --project <name> --yes`
  - Worked for linking a local folder to an existing Vercel project.
  - When run in a folder that had no `.vercel` metadata yet, it created `.vercel/` and added it to `.gitignore`.
- `vercel deploy --prod --yes`
  - Worked for the root catalog when the remote build path succeeded.
  - Also worked for `7.css-main` after a retry and for `Frontend-Projects-main/liquid-glass-vue`.

### Build / deploy mismatch errors and fixes

- Error: `The "--prebuilt" option was used with the target environment "production", but the prebuilt output found in ".vercel/output" was built with target environment "preview".`
  - Cause: `vercel build` had been run without `--prod`, so the local output was preview-mode.
  - Fix: run `vercel build --prod --yes`, then deploy with `vercel deploy --prebuilt --prod --yes`.
- Error: `The "--prebuilt" option was used with the target environment "preview", but the prebuilt output found in ".vercel/output" was built with target environment "production".`
  - Cause: trying to deploy a production-built output as preview.
  - Fix: use `--prod` on the deploy command as well, or rebuild the output for preview if that is the target.
- Error: `No Project Settings found locally. Run "vercel pull" for retrieving them?`
  - Cause: `.vercel/project.json` had not been pulled into the current folder yet.
  - Fix: answer `yes` to let Vercel pull the project settings and create the local `.vercel` metadata.
- Error: `Unexpected error. Please try again later. ()`
  - Cause: repeated across several deploys and appears to be a Vercel backend failure, not a repo build failure.
  - Fix attempts that did not fully clear it:
    - retrying the deploy
    - using `--logs`
    - using `--prebuilt`
    - copying the built `dist` output into a temporary folder and deploying from there
    - using `--skip-domain`
  - Conclusion: the issue looked external to the repo content.

### Folders that repeatedly hit the Vercel backend error

These folders were the ones that consistently failed with `Unexpected error. Please try again later. ()` during this session:

- `apple-liquid-glass-experiments`
- `apple-liquid-glass-ui-2025`
- `cross-browser-liquid-toggle-drag-tap`
- `css.glass-main`
- `glass-like-css`
- `glassmorphism-main`
- `ios-liquid-glass`
- `lab-main`

The important takeaway is that the folder contents were not the obvious failure point. The same folder structures had previously deployed, but the current account/build path was unstable.

### Folders that did deploy cleanly in this pass

- `7.css-main`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Successful production alias after deployment: `https://glass-projects-lab-7css-main.vercel.app`
- `Frontend-Projects-main/liquid-glass-vue`
  - Framework: Vite
  - Build command: `vite build`
  - Successful production alias after deployment: `https://glass-projects-lab-frontend-vue.vercel.app`
- `apple-liquid-glass`
  - Deploys cleanly as a static example when Vercel accepts the build.
  - One deploy run completed and aliased before later account-side experiments changed the visible registry.

### Deploy console shape

The console output generally followed this structure:

1. `Retrieving project...`
2. `Deploying <scope>/<project>`
3. `Inspect: <Vercel inspect URL>`
4. `Production: <production deployment URL>` or `Preview: <preview deployment URL>`
5. `Building...`
6. Either:
   - `Building Completed in /vercel/output`
   - `Aliased: <production URL>`
   - or `Error: Unexpected error. Please try again later. ()`

That shape matters because the failure often happened after the upload started and after the deployment URL had already been allocated, which suggests the problem was in the remote build/promotion phase rather than the local file set.

## Application presets and deploy shapes

These are the main presets used across the repo:

- `Static / no framework`
  - Used for the root catalog.
  - Best deployed from the repo root.
- `Vite`
  - Used for `Frontend-Projects-main/liquid-glass-vue`.
  - Vercel auto-detected the preset when the folder was linked.
- `Next.js`
  - Used for `liquid-glass-react-master/liquid-glass-example`.
  - The example required a Next version bump before Vercel would accept it.
- `Node build`
  - Used for `7.css-main`.
  - Build output goes to `dist`.
- `Nuxt`
  - Used for `css.glass-main`.
  - Build output goes to `dist`.
- `Monorepo / workspace build`
  - Used for `liquid-dom-master`.
  - The root `vercel.json` points Vercel at the showcase build output, not the repo root.

## Repo layout cues that matter for deploys

- A root `index.html` at the repo root means the repository itself is the gallery site.
- A `src/index.html` plus `dist/index.html` pair usually means a static source folder plus a built output folder.
- A `vercel.json` with `outputDirectory: dist` means the deploy is expected to use the built output.
- A `package.json` with a Vite or Next script means Vercel can often auto-detect the framework.
- A nested `.vercel/project.json` means that folder is already linked to a specific Vercel project and should be replayed from that exact location.

## What to do first on the next account

1. Verify `vercel whoami`.
2. Check the root catalog alias.
3. Re-link `Frontend-Projects-main/liquid-glass-vue` before touching the collection root.
4. Re-link `liquid-glass-react-master/liquid-glass-example` before touching the outer folder.
5. Treat the `glass-refraction-master/examples/nextjs` deployment as a special temporary app shell, not a checked-in deploy target.
6. If the Vercel backend error reappears, record the inspect URL and stop trying to brute-force it locally. The problem has been on the platform side more than once.
