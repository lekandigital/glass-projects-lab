import { useState } from "react";
import { ThemeProvider, useTheme } from "./theme";
import { START, type GlassParams } from "./glass";
import { Hero } from "./sections/Hero";
import { Playground } from "./sections/Playground";
import { MapInspector } from "./sections/MapInspector";
import { Shapes } from "./sections/Shapes";
import { Motion } from "./sections/Motion";
import { Engine } from "./sections/Engine";
import { Primitives } from "./sections/Primitives";
import { ToggleDemo } from "./sections/ToggleDemo";
import { Reference } from "./sections/Reference";

const NAV = [
  ["playground", "Playground"],
  ["map", "The map"],
  ["shapes", "Shapes"],
  ["motion", "Motion"],
  ["engine", "Engine"],
  ["primitives", "In UI"],
  ["toggle", "Toggle"],
  ["reference", "Reference"],
] as const;

function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="themeSwitch"
      role="switch"
      aria-checked={dark}
      aria-label="Toggle dark mode"
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <span className="switchTrack">
        <span className="switchIcon sun">☀</span>
        <span className="switchIcon moon">☾</span>
        <span className="switchKnob" />
      </span>
    </button>
  );
}

function Chrome() {
  // One source of truth for the lens: the playground drags it, the map
  // inspector re-derives the exact same pixels from it.
  const [params, setParams] = useState<GlassParams>(START);

  return (
    <>
      <nav className="topbar">
        <a className="brand" href="#top">
          <span className="brandDot" />
          liquid-glass-web-react
        </a>
        <div className="navLinks">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </div>
        <ThemeSwitch />
      </nav>

      <main>
        <Hero />
        <Playground params={params} setParams={setParams} />
        <MapInspector params={params} />
        <Shapes />
        <Motion />
        <Engine />
        <Primitives />
        <ToggleDemo />
        <Reference />

        <footer className="footer">
          <p>
            A showcase of{" "}
            <a href="https://github.com/PallavAg/liquid-glass-web-react">liquid-glass-web-react</a> by
            Pallav Agarwal · MIT. Technique from Aave's{" "}
            <a href="https://aave.com/design/building-glass-for-the-web">Building Glass for the Web</a>.
          </p>
          <p className="muted">
            Every lens on this page is the same component with different numbers. Nothing here is a
            screenshot, a canvas copy, or a duplicated DOM tree.
          </p>
        </footer>
      </main>
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <Chrome />
    </ThemeProvider>
  );
}
