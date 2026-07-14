import {
  calculateRefractionSpecular,
  fns,
  getDisplacementData,
  getValueOrMotion,
} from "@creatorem/web-glass-effect";
import { useMotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LIBRARY_DEFAULTS, OPTIONS, SURFACES, SURFACE_KEYS, type GlassConfig } from "../config";
import { Section, Slider, SurfacePicker } from "../ui";

/* ------------------------------------------------------------------ *
 * Raw ImageData → canvas, with optional channel isolation / amplification.
 * Nothing here interprets the data; it only makes 8-bit deltas visible.
 * ------------------------------------------------------------------ */

type View = "raw" | "amplified" | "r" | "g" | "alpha";

function RawCanvas({
  data,
  view,
  gain = 1,
  displayWidth,
}: {
  data: ImageData;
  view: View;
  gain?: number;
  displayWidth: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = data.width;
    canvas.height = data.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (view === "raw") {
      ctx.putImageData(data, 0, 0);
      return;
    }

    const out = ctx.createImageData(data.width, data.height);
    for (let i = 0; i < data.data.length; i += 4) {
      const r = data.data[i]!;
      const g = data.data[i + 1]!;
      const a = data.data[i + 3]!;

      if (view === "amplified") {
        // Neutral in the displacement map is (128,128) — i.e. "no bend".
        const dr = (r - 128) * gain;
        const dg = (g - 128) * gain;
        out.data[i] = 128 + dr;
        out.data[i + 1] = 128 + dg;
        out.data[i + 2] = 128;
        out.data[i + 3] = 255;
      } else if (view === "r" || view === "g") {
        const v = 128 + ((view === "r" ? r : g) - 128) * gain;
        out.data[i] = v;
        out.data[i + 1] = v;
        out.data[i + 2] = v;
        out.data[i + 3] = 255;
      } else {
        // Opaque grayscale heatmap of the alpha channel. Drawing the highlight as
        // white-with-alpha would vanish on a light panel; alpha→luminance reads in
        // both themes.
        out.data[i] = a;
        out.data[i + 1] = a;
        out.data[i + 2] = a;
        out.data[i + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
  }, [data, view, gain]);

  return <canvas ref={ref} className="raw" style={{ width: displayWidth }} />;
}

/* ------------------------------------------------------------------ *
 * Surface profile curves — the eight exported SurfaceFnDefs, plotted from
 * the library's own `fns` array so a new profile shows up here for free.
 * ------------------------------------------------------------------ */

function SurfaceCurves({ active }: { active: GlassConfig["surface"] }) {
  const W = 300;
  const H = 150;
  const PAD = 10;

  const paths = useMemo(
    () =>
      fns.map((def) => {
        const pts: string[] = [];
        for (let i = 0; i <= 96; i++) {
          const x = i / 96;
          const y = def.fn(x);
          const px = PAD + x * (W - PAD * 2);
          // ELASTIC and BUBBLE exceed 1, so the viewport is 0…1.25, not 0…1.
          const py = H - PAD - (y / 1.25) * (H - PAD * 2);
          pts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
        }
        return { title: def.title, d: `M ${pts.join(" L ")}` };
      }),
    [],
  );

  const activeTitle = SURFACES[active].title;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Surface height functions">
      <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} fill="none" stroke="var(--rule)" />
      <line
        x1={PAD}
        x2={W - PAD}
        y1={H - PAD - (1 / 1.25) * (H - PAD * 2)}
        y2={H - PAD - (1 / 1.25) * (H - PAD * 2)}
        stroke="var(--rule-strong)"
        strokeDasharray="3 3"
      />
      {paths.map((p) => {
        const on = p.title === activeTitle;
        return (
          <path
            key={p.title}
            d={p.d}
            fill="none"
            stroke={on ? "var(--accent)" : "var(--ink-3)"}
            strokeWidth={on ? 2.2 : 0.9}
            opacity={on ? 1 : 0.35}
          />
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Section
 * ------------------------------------------------------------------ */

const OPT = (k: keyof GlassConfig) => OPTIONS.find((o) => o.key === k)!;

export function Internals() {
  const [cfg, setCfg] = useState<GlassConfig>({
    ...LIBRARY_DEFAULTS,
    glassThickness: 160,
    bezelWidth: 55,
    refractiveIndex: 1.7,
    width: 280,
    height: 180,
    radius: 48,
    dpr: 1,
  });
  const [view, setView] = useState<View>("amplified");
  const [gain, setGain] = useState(6);
  const [specularAngle, setSpecularAngle] = useState(60);

  const set = <K extends keyof GlassConfig>(k: K, v: GlassConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  const { displacementMap, maximumDisplacement, ms } = useMemo(() => {
    const t0 = performance.now();
    const out = getDisplacementData({
      glassThickness: cfg.glassThickness,
      bezelWidth: cfg.bezelWidth,
      bezelHeightFn: SURFACES[cfg.surface].fn,
      refractiveIndex: cfg.refractiveIndex,
      canvasWidth: cfg.width,
      canvasHeight: cfg.height,
      objectWidth: cfg.width,
      objectHeight: cfg.height,
      radius: cfg.radius,
      dpr: cfg.dpr,
    });
    return { ...out, ms: performance.now() - t0 };
  }, [cfg]);

  const { specular, specularMs } = useMemo(() => {
    const t0 = performance.now();
    const out = calculateRefractionSpecular(
      cfg.width,
      cfg.height,
      cfg.radius,
      cfg.bezelWidth,
      (specularAngle * Math.PI) / 180,
      cfg.dpr,
    );
    return { specular: out, specularMs: performance.now() - t0 };
  }, [cfg, specularAngle]);

  // Recovers the refraction profile the library computed but does not export.
  // Along the left edge at mid-height the normal is purely horizontal, so the
  // R channel there is exactly 128 + (d / maxDisplacement) * 127.
  const profile = useMemo(() => {
    const w = displacementMap.width;
    const row = Math.floor(displacementMap.height / 2);
    const px = Math.round(cfg.radius * cfg.dpr);
    const pts: number[] = [];
    for (let x = 0; x < px; x++) {
      const idx = (row * w + x) * 4;
      pts.push(((displacementMap.data[idx] ?? 128) - 128) / 127);
    }
    return pts;
  }, [displacementMap, cfg.radius, cfg.dpr]);

  const profilePath = useMemo(() => {
    if (!profile.length) return "";
    const W = 300;
    const H = 110;
    const PAD = 10;
    const max = Math.max(0.0001, ...profile.map(Math.abs));
    return profile
      .map((v, i) => {
        const px = PAD + (i / (profile.length - 1 || 1)) * (W - PAD * 2);
        const py = H / 2 - (v / max) * (H / 2 - PAD);
        return `${i === 0 ? "M" : "L"} ${px.toFixed(2)},${py.toFixed(2)}`;
      })
      .join(" ");
  }, [profile]);

  // getValueOrMotion, proved rather than described.
  const mv = useMotionValue(42);
  const unwrapped = getValueOrMotion(mv);
  const passthrough = getValueOrMotion(42);

  const displayW = Math.min(320, cfg.width);

  return (
    <Section
      id="internals"
      num={2}
      title="Internals"
      lede={
        <>
          <code>getDisplacementData</code> and <code>calculateRefractionSpecular</code> are pure —
          no React, no DOM, they just return <code>ImageData</code>. Here they are called directly
          and their raw output painted to a canvas. The displacement map is neutral{" "}
          <code>rgb(128,128,0)</code> everywhere except the bezel ring, where R and G carry the x/y
          bend, so it needs amplifying before the eye can read it.
        </>
      }
    >
      <div className="split">
        <div>
          <div className="panel pad">
            <div className="seg" style={{ marginBottom: 12 }}>
              {(["raw", "amplified", "r", "g"] as View[]).map((v) => (
                <button
                  key={v}
                  className="btn"
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                >
                  {v === "r" ? "R = x-bend" : v === "g" ? "G = y-bend" : v}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div>
                <p className="group-blurb" style={{ marginBottom: 6 }}>
                  getDisplacementData().displacementMap — {displacementMap.width}×
                  {displacementMap.height}
                </p>
                <RawCanvas
                  data={displacementMap}
                  view={view}
                  gain={gain}
                  displayWidth={displayW}
                />
              </div>
              <div>
                <p className="group-blurb" style={{ marginBottom: 6 }}>
                  calculateRefractionSpecular() — alpha only
                </p>
                <RawCanvas data={specular} view="alpha" displayWidth={displayW} />
              </div>
            </div>

            {view !== "raw" && (
              <label className="ctl" style={{ marginTop: 12 }}>
                <span className="ctl-top">
                  <span className="ctl-name">amplification</span>
                </span>
                <span className="ctl-val">×{gain}</span>
                <input
                  className="ctl-row"
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={gain}
                  onChange={(e) => setGain(Number(e.currentTarget.value))}
                />
                <span className="ctl-note">
                  Display gain only — it does not touch the data the filter consumes.
                </span>
              </label>
            )}

            <dl className="metrics" style={{ marginTop: 16 }}>
              <div className="metric">
                <dt>maximumDisplacement</dt>
                <dd>{maximumDisplacement.toFixed(2)}</dd>
              </div>
              <div className="metric">
                <dt>displacement raster</dt>
                <dd className={ms > 8 ? "hot" : "cool"}>{ms.toFixed(1)} ms</dd>
              </div>
              <div className="metric">
                <dt>specular raster</dt>
                <dd className={specularMs > 8 ? "hot" : "cool"}>{specularMs.toFixed(1)} ms</dd>
              </div>
              <div className="metric">
                <dt>pixels touched</dt>
                <dd>{(displacementMap.width * displacementMap.height).toLocaleString()}</dd>
              </div>
            </dl>
            <p className="group-blurb">
              <code>maximumDisplacement</code> is what lands in{" "}
              <code>feDisplacementMap/@scale</code>. Both rasters run on the main thread, on every
              change to any input they depend on — at 60fps you have a 16.7 ms budget for
              everything.
            </p>
          </div>

          <div className="panel pad" style={{ marginTop: 16 }}>
            <div className="group-head">
              <h4>Recovered refraction profile</h4>
            </div>
            <p className="group-blurb">
              The library computes an internal <code>calculateRefractionProfile</code> but does not
              export it. It is recoverable: along the left edge at mid-height the surface normal is
              purely horizontal, so that scanline's R channel <em>is</em> the profile, scaled by{" "}
              <code>maximumDisplacement</code>. Read straight out of the ImageData above.
            </p>
            <svg viewBox="0 0 300 110" width="100%" role="img" aria-label="Recovered refraction profile">
              <line x1={10} y1={55} x2={290} y2={55} stroke="var(--rule-strong)" strokeDasharray="3 3" />
              <path d={profilePath} fill="none" stroke="var(--accent)" strokeWidth={2} />
            </svg>
            <p className="group-blurb">
              x-axis: outer edge → inner edge of the bezel. y-axis: signed ray deviation.
            </p>
          </div>

          <div className="panel pad" style={{ marginTop: 16 }}>
            <div className="group-head">
              <h4>specularAngle — reachable only from here</h4>
            </div>
            <p className="group-blurb">
              <code>calculateRefractionSpecular</code> takes a 5th argument,{" "}
              <code>specularAngle</code> (default <code>Math.PI / 3</code>). No component exposes
              it: <code>LiquidFilter</code> calls the function with <code>undefined</code> for this
              argument and hardcodes the bezel to <code>50</code>. Calling the pure function
              yourself is the only way to move the highlight.
            </p>
            <label className="ctl">
              <span className="ctl-top">
                <span className="ctl-name">specularAngle</span>
              </span>
              <span className="ctl-val">{specularAngle}°</span>
              <input
                className="ctl-row"
                type="range"
                min={0}
                max={180}
                step={1}
                value={specularAngle}
                onChange={(e) => setSpecularAngle(Number(e.currentTarget.value))}
              />
            </label>
          </div>
        </div>

        <div>
          <div className="panel pad">
            <div className="group-head">
              <h4>Surface profiles</h4>
            </div>
            <p className="group-blurb">
              All {fns.length} exported <code>SurfaceFnDef</code>s, plotted from the library's own{" "}
              <code>fns</code> array. Dashed line is y = 1 — <code>ELASTIC</code> and{" "}
              <code>BUBBLE</code> overshoot it.
            </p>
            <SurfaceCurves active={cfg.surface} />
            <SurfacePicker spec={OPT("surface")} value={cfg.surface} onChange={(v) => set("surface", v)} />
            {(["glassThickness", "bezelWidth", "refractiveIndex", "radius", "width", "height", "dpr"] as const).map(
              (k) => (
                <Slider key={k} spec={OPT(k)} value={cfg[k]} onChange={(v) => set(k, v)} />
              ),
            )}
          </div>

          <div className="panel pad" style={{ marginTop: 16 }}>
            <div className="group-head">
              <h4>getValueOrMotion</h4>
            </div>
            <p className="group-blurb">
              The whole reason every prop can be <code>number | MotionValue&lt;number&gt;</code>. It
              is three lines, and it is exported.
            </p>
            <div className="code">
              <pre>{`getValueOrMotion(useMotionValue(42))  // → ${unwrapped}
getValueOrMotion(42)                 // → ${passthrough}`}</pre>
            </div>
          </div>

          <div className="panel pad" style={{ marginTop: 16 }}>
            <div className="group-head">
              <h4>Exported profiles</h4>
            </div>
            <table className="ref">
              <tbody>
                {SURFACE_KEYS.map((k) => (
                  <tr key={k}>
                    <td className="mono">{k}</td>
                    <td>{SURFACES[k].title}</td>
                    <td className="mono">f(0.5) = {SURFACES[k].fn(0.5).toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Section>
  );
}
