# Previous Pipeline Failures Audit Report

An investigation of the previous deployment pipeline scripts (`scripts/inventory-projects.py`, `scripts/prepare-project.py`, `scripts/deploy-all.py`, `scripts/verify-deployment.py`) revealed several major architectural defects that caused nearly all deployed pages to be visually or functionally broken.

## Defect 1: Copying the Wrong Content

### Description
The preparation script (`scripts/prepare-project.py`) copied the full `archive_root` into every target deployment workspace instead of copying the specific runnable `candidate_root` or the specific monorepo workspace.

### Consequence
This left nested candidate directories inside wrapper folders (e.g., `deployments/glasslab-apple-liquid-glass-1-apple-liquid-glass-src/apple-liquid-glass/src`). The application roots were deeply nested and mismatched from the expected deployment roots, preventing standard package install and build processes from finding the correct root file structure.

---

## Defect 2: Deploying the Wrong Directory

### Description
The runner calculated the correct nested `work_dir` and ran the build commands there, but then invoked the Vercel CLI from the higher-level parent `cwd` (which was the copied archive folder):
```bash
vercel deploy --cwd "$CWD"
```

### Consequence
Vercel deployed the parent directory instead of the specific runnable root. To compensate, the verifier appended the relative candidate path to the production URL:
```text
https://glasslab-project.vercel.app/path/to/candidate/src
```
This subpath deployment broke relative references for stylesheet imports, script imports, and image/shader assets that expected to load from the origin root `/`, resulting in 404 errors for assets and styling.

---

## Defect 3: Treating Editor Fragments as Complete Websites

### Description
Many exports from CodePen and JSFiddle contain files structured like `src/index.html`, `src/style.css`, and `src/script.js`. The `index.html` in these cases was only the HTML editor fragment (e.g. `<div id="root"></div>` or a raw SVG element) rather than a complete HTML document with a doctype, HTML tags, a head linking the stylesheet, and a body enclosing the script.

### Consequence
The pipeline deployed these fragments as-is without wrapping them. Without `<link rel="stylesheet">` or `<script>` tags, the browser rendered unstyled, non-interactive markup.

---

## Defect 4: Ignoring Preprocessor Requirements

### Description
The inventory script classified projects as static HTML merely because an `index.html` file existed, ignoring the syntax inside the sibling JavaScript or CSS files. 

### Consequence
Files named `script.js` that actually contained React JSX, TypeScript, TSX, or ESM imports requiring a bundler/transpiler (like Vite/React) were served raw to the browser. The browser failed with syntax errors (e.g., `SyntaxError: Unexpected token '<'`) when encountering JSX tags, leaving pages blank. Sibling stylesheet files built with preprocessors (SCSS, Less) were similarly uncompiled.

---

## Defect 5: Verification Did Not Test Rendering

### Description
The verifier script (`scripts/verify-deployment.py`) performed a basic python `urllib.request` HTTP GET call and checked for:
1. HTTP Status 200.
2. The presence of the string `<html` in the body.

### Consequence
This verified any non-empty page even if it contained only raw unstyled markup, threw fatal console exceptions, returned 404s for all its stylesheet/script assets, or rendered as a blank white screen. Visual layouts, canvas WebGL rendering, SVG filters, and user interaction were never tested.
