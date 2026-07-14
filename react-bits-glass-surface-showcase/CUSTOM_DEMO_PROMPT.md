# The prompt this demo was built from

Kept here so the demo can be regenerated, audited against its own brief, or re-pointed at
another library. The placeholders are filled in for **react-bits' `GlassSurface`**; the repo-level
template lives at [`../CUSTOM_DEMO_PROMPT.md`](../CUSTOM_DEMO_PROMPT.md).

---

Build a single-page custom demo for the library at `react-bits-main` (the `GlassSurface` component,
`src/ts-default/Components/GlassSurface/GlassSurface.tsx`), in an additional folder
`react-bits-glass-surface-showcase`. The goal is to demonstrate everything the library can possibly
do — not a pretty landing page, an exhaustive one.

1. **Read the source, not just the README.** Before designing anything, enumerate the real surface
   area: every export in the entry point, every prop/option with its type and default, every method
   on any imperative/class API, every callback, and every documented limitation. The README will
   undersell it. Tell me the inventory you found before you build, so I can confirm nothing's
   missing.

2. **Cover every item in that inventory.** Numbered sections, each proving something the others
   can't:
   - **Playground** — every option as a live control. Group controls by what they cost if the
     library has such a distinction, and badge them. Print the generated code for the current
     settings, with a copy button.
   - **Internals** — if the library exposes low-level/pure functions, call them directly and
     visualize their raw output. Usually the most interesting section and the one a normal demo
     skips.
   - **Variants gallery** — a preset per distinct look, all rendered side by side, because comparing
     them against each other is the real question.
   - **Imperative / performance** — if there's a ref handle or escape hatch, drive it every frame
     and put a counter beside it showing the cost of the naive alternative.
   - **Framework-free core** — if there's a non-React core, use it on plain DOM, including teardown.
   - **In real UI** — the library as an actual component, interactive, not decorative.
   - **Reference** — every prop and export in a table, defaults read at runtime from the library's
     own defaults object so it can't go stale.

3. **One source of truth.** Every config used anywhere lives in one exported object; sections import
   from it. A preset that claims to reproduce a demo must be that demo's config, never a copy that
   can drift.

4. **Design for judging the effect, not for looking pretty.** Pick backdrops that make the output
   legible — high-frequency, high-contrast, neutral where color would compete with the effect.
   Reserve color for the controls. Then give me a backdrop picker rather than assuming.

5. **Light and dark mode**, in the header, persisted, applied before first paint.

6. **Interactions must behave like the real thing.** If the library's own demo has a specific feel
   (a spring, a snap, a constrained axis), port it exactly — same markup, same class names, same
   constants. Don't "improve" it. If I ask for a component from the upstream demo, I mean that
   component, not a lookalike.

7. **Build against the library source** (Vite alias to `../react-bits-main/src`) so library edits
   hot-reload. Also keep the published package as a dependency, and make the alias conditional on
   the sibling existing — deploys only upload the demo folder.

8. **Verify with Playwright before saying it works.** Launch the real page, drive the actual
   interactions, assert behavior (measure positions, check for clipping), screenshot each section,
   and show me the screenshots. A passing build says nothing about whether the demo is visible or
   correct.

9. **Deploy and catalog.** Vercel project `glass-projects-lab-<short-name>`, add a row to the root
   `index.html` (title / demo link / origin-source link / repo link) matching the existing format,
   and note it in `DEPLOY_INSTRUCTIONS.md`.

Stack: Vite + React + TS, hand-written CSS with tokens. Comment only what the code can't say itself.

---

## Where the brief met reality

Two clauses could not be honoured literally, and the substitutions are load-bearing:

- **§7 "keep the published package as a dependency."** react-bits publishes no npm package — it is a
  copy-into-your-tree registry. So the deploy fallback is a vendored copy at
  `src/vendor/FluidGlass.tsx`, the Vite alias prefers the sibling checkout when it exists, and
  `npm run check:vendor` fails the build if the two have drifted. That check is what makes the
  fallback trustworthy; without it the deployed page could silently be a different component.

- **§2 "defaults read at runtime from the library's own defaults object."** `FluidGlass` has no
  defaults object — every default is an inline `?? literal`. So `src/lib/source.ts` imports the
  component's source with `?raw` and parses the literals back out at runtime. Same guarantee,
  different mechanism: change a default upstream and the reference table changes with it.
