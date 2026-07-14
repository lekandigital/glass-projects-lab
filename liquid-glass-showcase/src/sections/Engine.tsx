import { useEffect, useRef, useState } from "react";
import { LiquidGlassEngine } from "liquid-glass-web-react";
import { CodeBlock, Range, Section } from "../components";
import { DEMO_LENSES } from "../glass";

/**
 * No <LiquidGlass> anywhere in this section. The React component is a thin
 * wrapper over LiquidGlassEngine, which is plain DOM — so here the engine is
 * constructed by hand against three divs, dragged with raw pointer events, and
 * torn down with destroy(). Same technique in Svelte, Vue, or nothing at all.
 */
export function Engine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const filteredRef = useRef<HTMLDivElement>(null);
  const defsRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<LiquidGlassEngine | null>(null);

  const [strength, setStrength] = useState(DEMO_LENSES.engine.strength);
  const [size, setSize] = useState(DEMO_LENSES.engine.width);
  const [alive, setAlive] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const filtered = filteredRef.current;
    const defsHost = defsRef.current;
    if (!alive || !container || !filtered || !defsHost) return;

    const engine = new LiquidGlassEngine(
      { container, filtered, defsHost, shadow: shadowRef.current },
      DEMO_LENSES.engine,
    );
    engine.setPosition(0.35, 0.5);
    engineRef.current = engine;

    // Raw pointer drag — no React state involved in the motion at all.
    let dragging = false;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      container.setPointerCapture(e.pointerId);
      move(e);
    };
    const move = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      engine.setPosition((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    const onMove = (e: PointerEvent) => dragging && move(e);
    const onUp = () => (dragging = false);

    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerup", onUp);
    container.addEventListener("pointercancel", onUp);

    return () => {
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerup", onUp);
      container.removeEventListener("pointercancel", onUp);
      engine.destroy(); // removes the filter, the <defs>, and the map canvas
      engineRef.current = null;
    };
  }, [alive]);

  useEffect(() => {
    engineRef.current?.setOptions({ strength });
  }, [strength]);

  useEffect(() => {
    engineRef.current?.setOptions({ width: size, height: size });
  }, [size]);

  return (
    <Section
      id="engine"
      eyebrow="05 · no framework"
      title="The engine on its own"
      lede={
        <>
          <code>LiquidGlassEngine</code> owns the SVG filter, the map and every per-frame attribute
          write. Give it three elements — a container, the element to filter, and somewhere to park
          the <code>&lt;defs&gt;</code> — and it does the rest. Drag anywhere on the panel; unmount
          it to see <code>destroy()</code> clean up after itself.
        </>
      }
    >
      <div className="engineGrid">
        <div className="stage engineStage" ref={containerRef}>
          {alive ? (
            <>
              <div ref={filteredRef} style={{ willChange: "filter" }}>
                <div className="engineBed bed bed-grid">
                  <h3>new LiquidGlassEngine({`{ container, filtered, defsHost }`})</h3>
                  <p>Plain DOM. Zero dependencies. Drag me.</p>
                </div>
              </div>
              <div
                ref={defsRef}
                style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                aria-hidden
              />
              <div
                ref={shadowRef}
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "none",
                  willChange: "transform",
                  boxShadow: "0 0 0 1px var(--lens-rim), 0 14px 40px var(--lens-shadow)",
                }}
              />
            </>
          ) : (
            <div className="engineGone">
              <p>
                Unmounted. <code>engine.destroy()</code> pulled the filter off the element, emptied
                the <code>&lt;defs&gt;</code>, disconnected the ResizeObserver and released the map
                canvas.
              </p>
            </div>
          )}
        </div>

        <aside className="engineSide">
          <Range
            label="engine.setOptions({ strength })"
            value={strength}
            min={0}
            max={0.2}
            step={0.001}
            onChange={setStrength}
          />
          <Range
            label="engine.setOptions({ width, height })"
            value={size}
            min={60}
            max={280}
            step={2}
            onChange={setSize}
          />
          <button type="button" className="ghost" onClick={() => setAlive((a) => !a)}>
            {alive ? "engine.destroy()" : "re-create the engine"}
          </button>

          <CodeBlock
            code={`import { LiquidGlassEngine } from "liquid-glass-web-react";

const engine = new LiquidGlassEngine(
  { container, filtered, defsHost, shadow },
  { width: 160, height: 160, strength: 0.08 },
);

engine.setPosition(0.35, 0.5);
engine.setOptions({ strength: 0.12 });
engine.getMapUrl();   // the PNG it just baked
engine.refresh();     // re-measure after a layout change
engine.destroy();`}
          />
        </aside>
      </div>
    </Section>
  );
}
