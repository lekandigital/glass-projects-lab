import { useEffect, useRef, useState } from "react";
import { PRESETS, type BackdropKey, type GlassConfig } from "../config";
import { Backdrop, BackdropPicker, Section, Slider } from "../ui";
import { OPTIONS } from "../config";
import { mountLiquidGlass, type VanillaHandle } from "../vanilla";

const OPT = (k: keyof GlassConfig) => OPTIONS.find((o) => o.key === k)!;

export function FrameworkFree() {
  const [cfg, setCfg] = useState<GlassConfig>(PRESETS.thickLens.config);
  const [backdrop, setBackdrop] = useState<BackdropKey>("rings");
  const [mounted, setMounted] = useState(true);

  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<VanillaHandle | null>(null);
  const [status, setStatus] = useState("not mounted");

  // Mount / unmount the vanilla surface imperatively — the point is that teardown
  // is explicit and complete, so we drive it from a real button.
  useEffect(() => {
    if (!mounted || !hostRef.current) return;
    const handle = mountLiquidGlass(hostRef.current, cfg, "vanilla-filter");
    handleRef.current = handle;
    setStatus("mounted · 1 <svg> + 1 surface <div>");
    return () => {
      handle.destroy();
      handleRef.current = null;
      setStatus("destroyed · nodes removed");
    };
    // Mount once per mounted-toggle; live updates go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    handleRef.current?.setConfig(cfg);
  }, [cfg]);

  const set = <K extends keyof GlassConfig>(k: K, v: GlassConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  return (
    <Section
      id="framework-free"
      num={5}
      title="Framework-free core"
      lede={
        <>
          The library ships no vanilla component — but <code>liquid-lib.ts</code> is pure, so the
          effect doesn't actually need React. <code>src/vanilla.ts</code> imports{" "}
          <em>only</em> <code>getDisplacementData</code> and <code>calculateRefractionSpecular</code>
          , then builds the identical <code>&lt;filter&gt;</code> graph on bare DOM with{" "}
          <code>createElementNS</code> — same primitives, same <code>result</code> names as{" "}
          <code>filter.tsx</code>. The surface below is that. Teardown removes every node it added.
        </>
      }
    >
      <div className="split">
        <div>
          <div className="stage" style={{ minHeight: 420 }} data-testid="vanilla-stage">
            <Backdrop kind={backdrop} />
            <div className="stage-content" ref={hostRef} data-testid="vanilla-host" />
          </div>

          <div style={{ marginTop: 16 }}>
            <BackdropPicker value={backdrop} onChange={setBackdrop} />
          </div>
        </div>

        <div className="panel pad">
          <div className="group-head">
            <h4>Lifecycle</h4>
          </div>
          <div className="seg" style={{ marginTop: 8 }}>
            <button
              className="btn"
              type="button"
              aria-pressed={mounted}
              onClick={() => setMounted((m) => !m)}
              data-testid="vanilla-toggle"
            >
              {mounted ? "destroy()" : "mount()"}
            </button>
          </div>
          <p className="group-blurb" style={{ marginTop: 8 }}>
            status: <code data-testid="vanilla-status">{status}</code>
          </p>

          <div className="group-head">
            <h4>Live config</h4>
          </div>
          <p className="group-blurb">
            These write straight to SVG attributes via <code>setConfig()</code> — no React on the
            surface itself.
          </p>
          {(["glassThickness", "bezelWidth", "refractiveIndex", "blur", "specularOpacity", "radius", "width", "height", "canvasPad"] as const).map(
            (k) => (
              <Slider key={k} spec={OPT(k)} value={cfg[k]} onChange={(v) => set(k, v)} />
            ),
          )}
        </div>
      </div>
    </Section>
  );
}
