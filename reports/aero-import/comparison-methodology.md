# Visual Comparison Methodology

The script `scripts/compare-golden-master.py` is responsible for evaluating the equivalence between the local golden master and the deployment copies.

## Methods & Rules
- **Screenshot Comparison Method:** Uses Playwright to load both the golden master URL and test URL in a Chromium browser, waits for network idle, performs a specified interaction, and captures a full viewport screenshot. It then compares the two images pixel-by-pixel using PIL (Python Imaging Library).
- **Difference Metric:** Root Mean Square (RMS) difference computed from the histogram of differences between the RGB pixels of the images.
- **Pass Threshold:** 10.0 RMS diff by default. Zero difference is ideal for static pages, but thresholds accommodate antialiasing or CSS variances.
- **Interaction Procedure:**
  - `pointer-move`: Moves the mouse to the center of the viewport (720, 450) to trigger standard pointer-following effects.
  - `hover`: Scans the DOM for buttons or `.btn` classes and hovers over the first one; if absent, falls back to centering the mouse.
- **Wait Behavior:**
  - Font/Asset: `wait_until="networkidle"` ensures custom fonts and heavy assets are loaded.
  - Animation: Explicit 2000ms wait before interaction, and 500ms after interaction to allow CSS transitions or JS animations to settle.
- **Console-Error Rules:** Uncaught `pageerror` events are fatal and cause the script to fail.
- **Network-Failure Rules:** The primary document request returning a 4xx or 5xx status is fatal.
- **Asset-Failure Rules:** Any `response` event for `stylesheet`, `script`, or `image` returning a 4xx or 5xx status is fatal.
- **Canvas Checks:** Checks all `<canvas>` elements; fails if any canvas has 0 width or 0 height.
- **Viewport Sizes:** Fixed at 1440x900 to ensure deterministic rendering across both instances.

## Expected Refinements
- Tolerances must be adjusted per-project if they use unseeded WebGL noise or fast CSS animations that cannot be synchronized exactly.
- Zero difference after an expected visual interaction may indicate the interaction failed or the page is statically blank; manual review of output images is still required.
