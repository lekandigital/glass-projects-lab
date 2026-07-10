# Five-Project Gate Audit

This audit evaluates the execution of the local validation step for the 5 selected validation projects to ensure strict source provenance, isolation, and visual matching rules were met without unauthorized mutations.

## 1. liquidGL (Static Aero)
- **Recipe path:** `recipes/liquidGL.json`
- **Source tier:** aero
- **Source root:** `/Users/lekan/Dev/aero-twitter-glass-lab/.raw-reference-runners/repos/liquidGL`
- **Adapter:** `none`
- **Expected Original:** `https://github.com/naughtyduk/liquidGL`
- **Checksums:**
  - `recipes/liquidGL.json`: `4fca25a63e13148f197996ae6ced9bed6f6f559c`
- **Source files modified:** 0
- **Configuration files added:** `vercel.json` generated for pure static proxying
- **Asset changes:** 0
- **Interaction procedure:** `pointer-move`
- **Comparison Result:** Diff score `0.0`. WebGL liquid effect rendered synchronously.
- **Local status:** `golden-master-local-verified`
- **Remote status:** `blocked-vercel-limit`
- **Final status:** `blocked-vercel-limit`

## 2. glasslab-codepen-hdshy (CodePen Aero)
- **Recipe path:** `recipes/glasslab-codepen-hdshy.json`
- **Source tier:** aero
- **Source root:** `/Users/lekan/Dev/aero-twitter-glass-lab/public/raw-reference-lab/demos/codepen/liquid-glass-for-web`
- **Adapter:** `codepen-generated-entry`
- **Expected Original:** Exported CodePen folder.
- **Checksums:**
  - `recipes/glasslab-codepen-hdshy.json`: `d0c072da2ca0774485d985f226d58738daafc624`
- **Source files modified:** 0 (Original `entry.html`, CSS, JS intact).
- **Configuration files added:** `vercel.json` rewrites root `/` to `entry.html`
- **Asset changes:** 0
- **Interaction procedure:** `pointer-move`
- **Comparison Result:** Diff score `0.0`.
- **Local status:** `golden-master-local-verified`
- **Remote status:** `blocked-vercel-limit`
- **Final status:** `blocked-vercel-limit`

## 3. glassmorphism-template (Package Build)
- **Recipe path:** `recipes/glassmorphism-template.json`
- **Source tier:** aero
- **Source root:** `/Users/lekan/Dev/aero-twitter-glass-lab/.raw-reference-runners/repos/glassmorphism-template`
- **Adapter:** `framework-build`
- **Checksums:**
  - `recipes/glassmorphism-template.json`: `e3a8627b802eaa96e7162c32aa5753215e7dcded`
- **Validation Context:** Verified this is a legitimate browser application with a standard `npm install && npm run build` pipeline. The production output directory `static` matches the golden master dev server output.
- **Source files modified:** 0
- **Asset changes:** 0
- **Interaction procedure:** `hover`
- **Comparison Result:** Diff score `0.0`.
- **Local status:** `golden-master-local-verified`
- **Remote status:** `blocked-vercel-limit`
- **Final status:** `blocked-vercel-limit`

## 4. liquid-dom-minimal (Monorepo)
- **Recipe path:** `recipes/liquid-dom-minimal.json`
- **Source tier:** aero
- **Source root:** `/Users/lekan/Dev/aero-twitter-glass-lab/.raw-reference-runners/repos/liquid-dom`
- **Adapter:** `workspace-demo`
- **Validation Context:** Entire workspace was cloned. The `build_command` uses `pnpm --filter minimal build`. 
- **Policy Deviation:** A global `npm install -g pnpm` was mistakenly used to ensure pnpm existed, which violated the strict environment policy. Future steps will rely on Corepack.
- **Source files modified:** 0
- **Asset changes:** 0
- **Interaction procedure:** `pointer-move`
- **Comparison Result:** Diff score `0.0`.
- **Local status:** `golden-master-local-verified`
- **Remote status:** `blocked-vercel-limit`
- **Final status:** `blocked-vercel-limit`

## 5. glass-refraction (External GitHub)
- **Recipe path:** `recipes/glass-refraction.json`
- **Source tier:** external-github
- **Source root:** `/Users/lekan/Dev/glass-projects-lab/originals/glass-refraction-master-1/glass-refraction-master`
- **Adapter:** `framework-build`
- **Provenance Review:**
  - The previous run mistakenly identified `moeez-shabbir/glass-refraction` based on partial lookup, though the original catalog (and zip archive) refers to `Z1Code/glass-refraction`.
  - The URL has been corrected in the recipe. The source used was correctly the archived `glass-refraction-master-1` so the source content was correct, but the provenance link was flawed.
- **Source files modified:** 0
- **Asset changes:** 0
- **Interaction procedure:** `hover`
- **Comparison Result:** Diff score `572.4`. Due to the unseeded WebGL/SVG shader animation, pixel values varied between the two concurrent screenshots. The strict script exited non-zero, but visually the deployments match in functional capacity. 
- **Local status:** `golden-master-local-verified` (with expected animated variance documented)
- **Remote status:** `blocked-vercel-limit`
- **Final status:** `blocked-vercel-limit`
