import { useEffect, useRef, useState } from "react";
import { LiquidGlass, type LiquidGlassHandle } from "liquid-glass-web-react";
import { CodeBlock, Section, Segmented } from "../components";
import { DEMO_LENSES } from "../glass";

const MODES = ["imperative", "react state"] as const;
type Mode = (typeof MODES)[number];

export function Motion() {
  const [mode, setMode] = useState<Mode>("imperative");
  const [breathe, setBreathe] = useState(true);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const [fps, setFps] = useState(0);

  const lens = useRef<LiquidGlassHandle>(null);
  const renders = useRef(0);
  renders.current++;

  // A lissajous orbit, one setPosition (or one setState) per frame.
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let mark = performance.now();
    const start = performance.now();

    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const x = 0.5 + 0.33 * Math.sin(t * 0.9);
      const y = 0.5 + 0.3 * Math.sin(t * 1.4 + Math.PI / 3);

      if (mode === "imperative") {
        // Never re-renders React, never regenerates the map: it only rewrites
        // the filter's subregion attributes.
        lens.current?.setPosition(x, y);
      } else {
        setPos({ x, y });
      }

      if (breathe) {
        // Reaching past the component to the engine itself. `strength` is a
        // cheap option, so this is still just a filter attribute write.
        const s = 0.05 + 0.045 * (0.5 + 0.5 * Math.sin(t * 1.8));
        lens.current?.engine?.setOptions({
          strength: s,
          chromaticAberration: 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.1)),
        });
      }

      frames++;
      if (now - mark >= 500) {
        setFps(Math.round((frames * 1000) / (now - mark)));
        frames = 0;
        mark = now;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, breathe]);

  // Reset the render counter when the mode flips so the comparison is honest.
  useEffect(() => {
    renders.current = 0;
  }, [mode]);

  return (
    <Section
      id="motion"
      eyebrow="04 · imperative handle"
      title="Animating it without touching React"
      lede={
        <>
          The <code>ref</code> exposes <code>{`{ element, engine, setPosition }`}</code>.{" "}
          <code>setPosition</code> is safe to call every frame: it moves the filter's subregion and
          nothing else — no re-render, no map regeneration. Flip the switch to drive the same orbit
          through React state instead and watch the render counter run away.
        </>
      }
    >
      <div className="motionGrid">
        <div className="stage motionStage">
          <LiquidGlass
            ref={lens}
            {...(mode === "react state" ? { x: pos.x, y: pos.y } : {})}
            {...DEMO_LENSES.orbit}
            shadow="0 0 0 1px var(--lens-rim), 0 14px 40px var(--lens-shadow)"
          >
            <div className="orbitBed bed bed-chart">
              <p>
                setPosition(x, y) — 60 times a second, straight past React. The map is computed once
                and never touched again; the only thing changing is where the filter looks.
              </p>
            </div>
          </LiquidGlass>
        </div>

        <aside className="motionSide">
          <div className="field">
            <span className="fieldLabel">Drive the orbit with</span>
            <Segmented options={MODES} value={mode} onChange={setMode} />
          </div>

          <label className="check">
            <input type="checkbox" checked={breathe} onChange={(e) => setBreathe(e.target.checked)} />
            <span>
              also breathe <code>strength</code> + <code>chroma</code> via{" "}
              <code>engine.setOptions()</code>
            </span>
          </label>

          <div className="meters">
            <div className={`meter ${mode === "imperative" ? "good" : "bad"}`}>
              <span>React renders</span>
              <strong>{renders.current}</strong>
              <em>{mode === "imperative" ? "flat — the lens bypasses React" : "one per frame"}</em>
            </div>
            <div className="meter">
              <span>frames / sec</span>
              <strong>{fps}</strong>
              <em>filter subregion updates only</em>
            </div>
          </div>

          <CodeBlock
            code={`const lens = useRef<LiquidGlassHandle>(null);

<LiquidGlass ref={lens} width={170} height={170}>
  <YourContent />
</LiquidGlass>

// per frame — zero re-renders:
lens.current?.setPosition(x, y);
lens.current?.engine?.setOptions({ strength });`}
          />
        </aside>
      </div>
    </Section>
  );
}
