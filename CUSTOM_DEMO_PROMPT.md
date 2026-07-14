# Prompt: build a "custom demo" showcase for a library

Copy the block below into a fresh Claude Code session, filling in the three placeholders.
It encodes what actually worked (and the mistakes that cost time) while building
`liquid-glass-showcase` for `liquid-glass-web-react`.

---

## The prompt

> Build a single-page **custom demo** for the library at `<PATH_TO_LIBRARY_REPO>`, in a new folder
> `<PATH_TO_REPO_ROOT>/<library-name>-showcase`. The goal is to demonstrate **everything the library
> can possibly do** — not a pretty landing page, an exhaustive one.
>
> **1. Read the source, not just the README.** Before designing anything, enumerate the real surface
> area: every export in the entry point, every prop/option with its type and default, every method on
> any imperative/class API, every callback, and every documented limitation. The README will
> undersell it — options, low-level exports and escape hatches are usually only visible in the source.
> Tell me the inventory you found before you build, so I can confirm nothing is missing.
>
> **2. Cover every item in that inventory.** Structure the page as numbered sections, each proving
> something the others can't. As a template (adapt to what the library actually is):
> - **Playground** — every option as a live control, with the effect visible immediately. Group the
>   controls by what they cost (e.g. "regenerates state" vs "cheap update") if the library has such a
>   distinction, and badge them. Show the generated code for the current settings, with a copy button.
> - **Internals** — if the library exposes low-level/pure functions, call them directly and visualize
>   their raw output. This is usually the most interesting section and the one a normal demo skips.
> - **Variants gallery** — a preset per distinct look/behavior, all rendered *side by side* so they can
>   be compared against each other, not just one at a time.
> - **Imperative / performance** — if there's a ref handle or escape hatch, prove it: drive it every
>   frame and put a counter next to it showing the cost of the naive alternative.
> - **Framework-free core** — if the library has a non-React core, use it directly on plain DOM, and
>   include teardown/cleanup.
> - **In real UI** — the library used as an actual component (a selection indicator, a dock, a
>   magnifier…), interactive, not decorative.
> - **Reference** — every prop and export in a table, with defaults **read at runtime from the
>   library's own defaults object** so the table can never go stale.
>
> **3. One source of truth.** Every configuration used anywhere on the page lives in a single exported
> object (e.g. `DEMO_CONFIGS`), and the sections import from it. Presets that claim to reproduce a
> demo must *be* that demo's config — never a copy that can drift.
>
> **4. Design for judging the effect, not for looking pretty.** Pick backdrops that make the library's
> output *legible*: high-frequency, high-contrast, and neutral where color would compete with the
> effect. (For a refraction library that meant achromatic grids, lens charts and checkerboards, since
> a tinted background hides chromatic fringing.) Reserve color for the controls. Then let me switch
> the backdrop — give me a background/theme picker rather than assuming.
>
> **5. Light and dark mode**, toggled in the header, persisted to `localStorage`, applied before first
> paint so there's no flash. Every surface needs a light variant.
>
> **6. Interactions must behave like the real thing.** If the library's own demo has a specific feel
> (a spring, a snap, a constrained axis), port it *exactly* — same markup, same class names, same
> constants — and say so in a comment. Don't "improve" it. If I ask for a component from the upstream
> demo, I mean that component, not a lookalike.
>
> **7. Build it against the library source** (a Vite alias to `../<library>/src`) so my edits to the
> library hot-reload into the demo. Include the published package as a dependency too, and make the
> alias conditional on the sibling folder existing — deploys only upload the demo folder, so the alias
> must fall away cleanly there.
>
> **8. Verify with Playwright before telling me it works.** Launch the real page, drive the actual
> interactions (click the buttons, drag the thing), assert the behavior (measure positions, check for
> clipping/overflow), and screenshot each section. Show me the screenshots. Do not report "done" off a
> successful build — a build passing says nothing about whether the demo is visible or correct.
>
> **9. Deploy and catalog.** Deploy to Vercel as a project named `<PREFIX>-<short-name>`, add a row to
> the root `index.html` catalog with title / demo link / origin-source link / github repo link
> matching the existing format, and note the deploy in `DEPLOY_INSTRUCTIONS.md`.
>
> Stack: Vite + React + TS, no UI framework, hand-written CSS with design tokens. Comment only what
> the code can't say itself — constraints, gotchas, why a constant is that value.

---

## Hard-won gotchas to hand the agent

Paste these in too — each one cost a round-trip here.

**Vercel**
- A project's public `*.vercel.app` domain is **truncated at 35 characters**. Longer names get a
  chopped domain (`…-liquid-glass-sho`). Keep the project name short.
- A longer alias set with `vercel alias set` *does* resolve but sits behind Vercel SSO (302 → login).
  Only the project's own production domain is public. So: short project name, not a long alias.
- The deploy uploads **only the deployed folder** — a Vite alias to a sibling repo will break the
  build. Keep the published package in `dependencies` as the fallback.

**Demo design**
- Don't bury the interesting cards. If a gallery has both abstract and "real" examples, put the real
  ones **first**, under a heading.
- Don't add an independent global control (an "overlay" switch, say) that silently applies on top of
  every other selection. If a thing belongs to a preset, it should *be* part of that preset.
- If a component is shown in a gallery *and* live below, render the **same component with the same
  children** — not a compact stand-in with fewer items. It will get noticed.
- A UI bar that the effect sits on should be **transparent**, with the colored field behind it. Two
  stacked fills read as a bug.

**Verification**
- "It typechecks and builds" is not verification. Drive it in a browser.
- Read the screenshots you take. Half the bugs here were visible in the first screenshot.
