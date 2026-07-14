import { LiquidFilter } from "@creatorem/web-glass-effect";
import { useEffect, useState } from "react";
import { LIBRARY_DEFAULTS, OPTIONS, type Owner } from "../config";
import { CostBadge, Section } from "../ui";

/* ------------------------------------------------------------------ *
 * Runtime default probe.
 *
 * We render a LiquidFilter with ONLY its required props (id/width/height/radius)
 * and every optional prop omitted, then read the actual attributes the library
 * wrote onto the <filter> graph. Those attributes *are* the defaults in effect —
 * so the table below cannot drift from the library, no matter what its source
 * says. Where a probed value disagrees with LIBRARY_DEFAULTS (transcribed from
 * the source), the row is flagged.
 * ------------------------------------------------------------------ */

interface Probed {
  blur: number;
  specularOpacity: number;
  specularSaturation: number;
  displacementScale: number;
}

function useProbedDefaults(): Probed | null {
  const [probed, setProbed] = useState<Probed | null>(null);

  useEffect(() => {
    // LiquidFilter mounts on a client effect (isMounted gate); poll briefly.
    let tries = 0;
    const read = () => {
      const filter = document.getElementById("wge-probe-filter");
      const blur = filter?.querySelector("feGaussianBlur")?.getAttribute("stdDeviation");
      const sat = filter?.querySelector("feColorMatrix")?.getAttribute("values");
      const slope = filter?.querySelector("feFuncA")?.getAttribute("slope");
      const scale = filter?.querySelector("feDisplacementMap")?.getAttribute("scale");

      if (blur != null && sat != null && slope != null && scale != null) {
        setProbed({
          blur: Number(blur),
          specularSaturation: Number(sat),
          specularOpacity: Number(slope),
          displacementScale: Number(scale),
        });
        return true;
      }
      return false;
    };

    if (read()) return;
    const iv = setInterval(() => {
      if (read() || ++tries > 40) clearInterval(iv);
    }, 50);
    return () => clearInterval(iv);
  }, []);

  return probed;
}

function OwnerTags({ owners }: { owners: Owner[] }) {
  return (
    <>
      {owners.map((o) => (
        <span key={o} className="badge neutral" style={{ marginRight: 4 }}>
          {o.replace("Liquid", "")}
        </span>
      ))}
    </>
  );
}

const RUNTIME_KEYS: Record<string, keyof Probed> = {
  blur: "blur",
  specularOpacity: "specularOpacity",
  specularSaturation: "specularSaturation",
};

export function Reference() {
  const probed = useProbedDefaults();

  return (
    <Section
      id="reference"
      num={7}
      title="Reference"
      lede={
        <>
          Every prop, its type as the library writes it, the cost tier it belongs to, and which
          exports accept it. The <strong>runtime default</strong> column is not transcribed — it is
          read back from a live <code>LiquidFilter</code> rendered with all optional props omitted
          (see the hidden probe at the end of this section). If it ever disagrees with the value
          taken from source, the cell is flagged.
        </>
      }
    >
      <div className="legend">
        <div>
          <CostBadge cost="attribute" /> one SVG attribute, free to animate
        </div>
        <div>
          <CostBadge cost="displacement" /> re-rasterises the displacement map
        </div>
        <div>
          <CostBadge cost="both" /> re-rasterises both maps
        </div>
        <div>
          <span className="badge motion">MotionValue</span> drivable without a re-render
        </div>
      </div>

      <div className="panel scroll-x">
        <table className="ref">
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Source default</th>
              <th>Runtime default</th>
              <th>Cost</th>
              <th>Accepted by</th>
            </tr>
          </thead>
          <tbody>
            {OPTIONS.map((o) => {
              const sourceDefault = LIBRARY_DEFAULTS[o.key];
              const runtimeKey = RUNTIME_KEYS[o.key as string];
              const runtimeVal = runtimeKey && probed ? probed[runtimeKey] : null;
              const drift = runtimeVal != null && Number(runtimeVal) !== Number(sourceDefault);

              return (
                <tr key={o.key}>
                  <td className="mono">{o.key === "surface" ? "bezelHeightFn" : o.key === "canvasPad" ? "canvasWidth/Height" : o.key}</td>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {o.type}
                  </td>
                  <td className="mono">
                    {o.key === "surface" ? "CONVEX.fn" : o.key === "dpr" ? "1 / devicePixelRatio" : String(sourceDefault)}
                  </td>
                  <td className="mono">
                    {runtimeKey ? (
                      probed ? (
                        <span className={drift ? "drift" : "ok-mark"}>
                          {runtimeVal}
                          {drift ? " ✕" : " ✓"}
                        </span>
                      ) : (
                        "probing…"
                      )
                    ) : (
                      <span style={{ color: "var(--ink-3)" }}>—</span>
                    )}
                  </td>
                  <td>
                    <CostBadge cost={o.cost} />
                  </td>
                  <td style={{ minWidth: 160 }}>
                    <OwnerTags owners={o.owners} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {probed && (
        <p className="group-blurb" style={{ marginTop: 10 }}>
          Probed live: <code>feDisplacementMap/@scale = {probed.displacementScale.toFixed(3)}</code>{" "}
          — this is <code>maximumDisplacement</code> for the default profile (glassThickness 40,
          bezelWidth 20, index 1.5, CONVEX), the number every displacement calculation is normalised
          against.
        </p>
      )}

      <h4 style={{ margin: "32px 0 4px", fontSize: "var(--step-1)", fontWeight: 620 }}>Full export surface</h4>
      <div className="panel scroll-x" style={{ marginTop: 12 }}>
        <table className="ref">
          <thead>
            <tr>
              <th>Export</th>
              <th>Kind</th>
              <th>Signature / notes</th>
            </tr>
          </thead>
          <tbody>
            {EXPORTS.map((e) => (
              <tr key={e.name}>
                <td className="mono">{e.name}</td>
                <td>
                  <span className="badge neutral">{e.kind}</span>
                </td>
                <td style={{ fontSize: 12 }}>{e.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* The probe. Rendered with required props only; every default flows from the library. */}
      <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden>
        <LiquidFilter id="wge-probe-filter" width={200} height={120} radius={30} />
      </div>
    </Section>
  );
}

const EXPORTS: { name: string; kind: string; notes: string }[] = [
  { name: "LiquidGlass", kind: "component", notes: "motion.div wrapper. Forwards 8 filter props + targetRef/width/height/borderRadius. dpr defaults to window.devicePixelRatio." },
  { name: "LiquidFilter", kind: "component", notes: "The <filter> graph. Root of every option including filterOnly, scaleRatio, canvasWidth/Height that LiquidGlass hides." },
  { name: "LiquidSlider", kind: "component", notes: "Draggable thumb. sizes xs/sm/md/lg. Controlled or uncontrolled. Hardcodes blur/specular internally." },
  { name: "LiquidSwitch", kind: "component", notes: "Toggle. sizes sm/md/lg/xl. Drag or tap. Hardcodes bezelHeightFn = LIP.fn. Exposes blur/specular props." },
  { name: "useLiquidSurface", kind: "hook", notes: "→ { filterId, filterStyles, ref, Filter }. Bring your own element." },
  { name: "getDisplacementData", kind: "function", notes: "Pure. → { displacementMap: ImageData, maximumDisplacement: number }." },
  { name: "calculateRefractionSpecular", kind: "function", notes: "Pure. → ImageData. 5th arg specularAngle (default π/3) is otherwise unreachable." },
  { name: "getValueOrMotion", kind: "function", notes: "Pure. Unwraps MotionValue<T> | T → T. Why every prop is dual-typed." },
  { name: "CONVEX_CIRCLE / CONVEX / CONCAVE / LIP", kind: "constant", notes: "SurfaceFnDef bezel profiles. CONVEX is the default; LIP is the switch's." },
  { name: "WAVE / STEPPED / ELASTIC / BUBBLE", kind: "constant", notes: "Four more SurfaceFnDef profiles. ELASTIC and BUBBLE overshoot y=1." },
  { name: "fns", kind: "constant", notes: "SurfaceFnDef[] of all eight, in export order." },
  { name: "SurfaceFnDef", kind: "type", notes: "{ title: string; fn: (x: number) => number }." },
  { name: "LiquidGlassProps / LiquidFilterProps", kind: "type", notes: "Prop types. LiquidGlassProps Picks 8 keys from LiquidFilterProps." },
  { name: "LiquidSliderProps / LiquidSwitchProps", kind: "type", notes: "Prop types for the two controls." },
];
