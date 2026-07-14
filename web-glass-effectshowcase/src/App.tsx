import { useTheme } from "./ui";
import { Playground } from "./sections/Playground";
import { Internals } from "./sections/Internals";
import { Variants } from "./sections/Variants";
import { Imperative } from "./sections/Imperative";
import { FrameworkFree } from "./sections/FrameworkFree";
import { RealUI } from "./sections/RealUI";
import { Reference } from "./sections/Reference";

const TOC = [
  ["playground", "1 · Playground"],
  ["internals", "2 · Internals"],
  ["variants", "3 · Variants"],
  ["imperative", "4 · Imperative"],
  ["framework-free", "5 · Framework-free"],
  ["real-ui", "6 · In real UI"],
  ["reference", "7 · Reference"],
] as const;

export function App() {
  const [theme, setTheme] = useTheme();

  return (
    <>
      <header className="masthead">
        <h1>@creatorem/web-glass-effect</h1>
        <span className="ver">exhaustive showcase</span>
        <span className="spacer" />
        <button
          className="btn"
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle colour theme"
          data-testid="theme-toggle"
        >
          {theme === "dark" ? "☾ Dark" : "☀ Light"}
        </button>
      </header>

      <div className="shell">
        <div className="hero">
          <h2>
            Everything the liquid-glass
            <br />
            library can do.
          </h2>
          <p>
            An SVG-backdrop-filter refraction effect for React: a real-time displacement map plus a
            specular highlight, both rasterised on the fly from pure functions. This page drives
            every export, every prop, and the pure core directly — including the parts the README
            and the packaged component quietly leave out.
          </p>
          <nav className="toc">
            {TOC.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
        </div>

        <Playground />
        <Internals />
        <Variants />
        <Imperative />
        <FrameworkFree />
        <RealUI />
        <Reference />

        <footer style={{ padding: "3rem 0 1rem", color: "var(--ink-3)", fontSize: "var(--step--1)" }}>
          Effect requires a Chromium-based browser. The library's advertised Safari/Firefox fallback
          is a no-op in 0.1.x — <code>isLiquidSupported</code> is a truthy MotionValue object, so the
          fallback branch never runs.
        </footer>
      </div>
    </>
  );
}
