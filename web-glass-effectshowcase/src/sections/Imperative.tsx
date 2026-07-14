import { LiquidFilter, LiquidGlass, useLiquidSurface } from "@creatorem/web-glass-effect";
import { useAnimationFrame, useMotionValue } from "motion/react";
import { useRef, useState } from "react";
import { PRESETS, SURFACES, type BackdropKey } from "../config";
import { Backdrop, BackdropPicker, Section, Stage } from "../ui";

type Tier = "attribute" | "displacement";

const BASE = PRESETS.stressPanel.config;
const BOX = { width: 190, height: 130, radius: 26 };

/** Same oscillation for both drivers, so the only variable is how it reaches the filter. */
const wave = (t: number) => (Math.sin(t / 500) + 1) / 2;

/* ------------------------------------------------------------------ *
 * Driver A — MotionValues. The component renders once; motion writes the
 * SVG attributes directly.
 * ------------------------------------------------------------------ */

function MotionDriven({ tier, running }: { tier: Tier; running: boolean }) {
  const renders = useRef(0);
  renders.current++;

  const blur = useMotionValue(BASE.blur);
  const specularSaturation = useMotionValue(BASE.specularSaturation);
  const glassThickness = useMotionValue(BASE.glassThickness);
  const refractiveIndex = useMotionValue(BASE.refractiveIndex);

  // fps is written straight to the DOM — using setState here would itself force a
  // render every ~500ms and quietly break the "zero renders" claim this panel makes.
  const fpsRef = useRef<HTMLElement>(null);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useAnimationFrame((t) => {
    if (!running) return;
    const k = wave(t);
    if (tier === "attribute") {
      blur.set(k * 6);
      specularSaturation.set(1 + k * 14);
    } else {
      glassThickness.set(30 + k * 240);
      refractiveIndex.set(1.05 + k * 1.6);
    }

    frames.current++;
    const now = performance.now();
    if (now - last.current >= 500) {
      if (fpsRef.current) fpsRef.current.textContent = String(Math.round((frames.current * 1000) / (now - last.current)));
      frames.current = 0;
      last.current = now;
    }
  });

  return (
    <Panel
      title="MotionValue"
      subtitle="mv.set() every frame · zero React renders"
      renders={renders.current}
      fpsRef={fpsRef}
      good
    >
      <LiquidFilter
        id="perf-motion"
        width={BOX.width}
        height={BOX.height}
        radius={BOX.radius}
        blur={blur}
        specularSaturation={specularSaturation}
        glassThickness={glassThickness}
        refractiveIndex={refractiveIndex}
        bezelWidth={BASE.bezelWidth}
        specularOpacity={BASE.specularOpacity}
        bezelHeightFn={SURFACES[BASE.surface].fn}
        dpr={1}
      />
      <div
        data-testid="perf-motion-surface"
        style={{ ...BOX, backdropFilter: "url(#perf-motion)", WebkitBackdropFilter: "url(#perf-motion)" }}
      />
    </Panel>
  );
}

/* ------------------------------------------------------------------ *
 * Driver B — the naive alternative. setState at 60fps: the whole subtree
 * reconciles on every frame to produce the identical picture.
 * ------------------------------------------------------------------ */

function StateDriven({ tier, running }: { tier: Tier; running: boolean }) {
  const renders = useRef(0);
  renders.current++;

  const [v, setV] = useState(0);

  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useAnimationFrame((t) => {
    if (!running) return;
    setV(wave(t));

    frames.current++;
    const now = performance.now();
    if (now - last.current >= 500) {
      setFps(Math.round((frames.current * 1000) / (now - last.current)));
      frames.current = 0;
      last.current = now;
    }
  });

  const attr = tier === "attribute";

  return (
    <Panel
      title="useState"
      subtitle="setState every frame · one React render per frame"
      renders={renders.current}
      fps={fps}
    >
      <LiquidFilter
        id="perf-state"
        width={BOX.width}
        height={BOX.height}
        radius={BOX.radius}
        blur={attr ? v * 6 : BASE.blur}
        specularSaturation={attr ? 1 + v * 14 : BASE.specularSaturation}
        glassThickness={attr ? BASE.glassThickness : 30 + v * 240}
        refractiveIndex={attr ? BASE.refractiveIndex : 1.05 + v * 1.6}
        bezelWidth={BASE.bezelWidth}
        specularOpacity={BASE.specularOpacity}
        bezelHeightFn={SURFACES[BASE.surface].fn}
        dpr={1}
      />
      <div
        data-testid="perf-state-surface"
        style={{ ...BOX, backdropFilter: "url(#perf-state)", WebkitBackdropFilter: "url(#perf-state)" }}
      />
    </Panel>
  );
}

function Panel({
  title,
  subtitle,
  renders,
  fps,
  fpsRef,
  good,
  children,
}: {
  title: string;
  subtitle: string;
  renders: number;
  fps?: number;
  fpsRef?: React.RefObject<HTMLElement | null>;
  good?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="panel" style={{ overflow: "hidden", flex: "1 1 300px" }}>
      <div className="card-head">
        <h4>{title}</h4>
        <span className={`badge ${good ? "attribute" : "both"}`}>{good ? "no re-render" : "re-renders"}</span>
      </div>
      <div className="stage" style={{ borderRadius: 0, border: 0, height: 200 }}>
        <Backdrop kind="checker" />
        <div className="stage-content">{children}</div>
      </div>
      <div className="pad">
        <dl className="metrics">
          <div className="metric">
            <dt>React renders</dt>
            <dd
              data-testid={`renders-${title.toLowerCase()}`}
              className={renders > 100 ? "hot" : "cool"}
            >
              {renders.toLocaleString()}
            </dd>
          </div>
          <div className="metric">
            <dt>fps</dt>
            <dd>{fpsRef ? <span ref={fpsRef}>—</span> : fps || "—"}</dd>
          </div>
        </dl>
        <p className="group-blurb" style={{ marginTop: 8 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Escape hatch 1 — useLiquidSurface. You own the markup; the hook hands you
 * a ref, the <Filter/> to mount, and the backdrop-filter style to spread.
 * ------------------------------------------------------------------ */

function HookSurface() {
  const { Filter, ref, filterStyles, filterId } = useLiquidSurface<HTMLButtonElement>({
    glassThickness: 140,
    bezelWidth: 30,
    refractiveIndex: 1.8,
    blur: 0.4,
    specularOpacity: 0.9,
    dpr: 1,
  });

  return (
    <>
      <Filter />
      <button
        ref={ref}
        data-testid="hook-surface"
        style={{
          ...filterStyles,
          width: 190,
          height: 60,
          borderRadius: 30,
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(255,255,255,0.12)",
          color: "inherit",
          font: "inherit",
          cursor: "pointer",
        }}
      >
        a real &lt;button&gt;
      </button>
      <p className="group-blurb" style={{ marginTop: 8, textAlign: "center" }}>
        filterId: <code>{filterId}</code>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Escape hatch 2 — targetRef. LiquidGlass renders no wrapper at all; it
 * assigns backdropFilter onto an element you already have.
 * ------------------------------------------------------------------ */

function TargetRefSurface() {
  const target = useRef<HTMLDivElement>(null);

  return (
    <>
      <LiquidGlass
        targetRef={target}
        glassThickness={140}
        bezelWidth={30}
        refractiveIndex={1.8}
        blur={0.4}
        specularOpacity={0.9}
        dpr={1}
      />
      <div
        ref={target}
        data-testid="targetref-surface"
        style={{
          width: 190,
          height: 60,
          borderRadius: 30,
          border: "1px solid rgba(255,255,255,0.25)",
          display: "grid",
          placeItems: "center",
        }}
      >
        pre-existing div
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Escape hatch 3 — filterOnly. Two filters sharing one <svg><defs>.
 * ------------------------------------------------------------------ */

function FilterOnlySurface() {
  return (
    <>
      <svg style={{ position: "absolute", width: 0, height: 0 }} colorInterpolationFilters="sRGB">
        <defs>
          <LiquidFilter filterOnly id="only-a" width={90} height={60} radius={30} glassThickness={200} bezelWidth={26} refractiveIndex={2.1} dpr={1} />
          <LiquidFilter filterOnly id="only-b" width={90} height={60} radius={12} glassThickness={200} bezelWidth={26} refractiveIndex={2.1} bezelHeightFn={SURFACES.CONCAVE.fn} dpr={1} />
        </defs>
      </svg>
      <div style={{ display: "flex", gap: 10 }}>
        <div data-testid="filteronly-a" style={{ width: 90, height: 60, borderRadius: 30, backdropFilter: "url(#only-a)" }} />
        <div data-testid="filteronly-b" style={{ width: 90, height: 60, borderRadius: 12, backdropFilter: "url(#only-b)" }} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

export function Imperative() {
  const [tier, setTier] = useState<Tier>("attribute");
  const [running, setRunning] = useState(true);
  const [backdrop, setBackdrop] = useState<BackdropKey>("grid");

  return (
    <Section
      id="imperative"
      num={4}
      title="Imperative & performance"
      lede={
        <>
          There is no ref handle with methods — the escape hatch is that every numeric prop accepts a{" "}
          <code>MotionValue</code>, so you can drive the filter at 60fps without React ever
          re-rendering. Both panels below animate identically. Watch the render counter.
        </>
      }
    >
      <div className="seg" style={{ marginBottom: 8 }}>
        <button className="btn" type="button" aria-pressed={tier === "attribute"} onClick={() => setTier("attribute")}>
          Animate attribute-tier props
        </button>
        <button className="btn" type="button" aria-pressed={tier === "displacement"} onClick={() => setTier("displacement")}>
          Animate displacement-tier props
        </button>
        <button className="btn" type="button" aria-pressed={running} onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : "Run"}
        </button>
      </div>

      <p className="group-blurb" style={{ marginBottom: 16, maxWidth: "74ch" }}>
        {tier === "attribute" ? (
          <>
            Animating <code>blur</code> and <code>specularSaturation</code> — these land on SVG
            attributes, so no pixels are regenerated. Both panels hold 60fps; the difference is
            purely React work the MotionValue panel never does.
          </>
        ) : (
          <>
            Animating <code>glassThickness</code> and <code>refractiveIndex</code> — these re-run{" "}
            <code>getDisplacementData</code> over every pixel plus a <code>toDataURL()</code>, every
            frame, in <em>both</em> panels. MotionValues save the reconciliation, not the raster.
            This is the honest ceiling of the library, and it is why the fps drops here and not
            above.
          </>
        )}
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <MotionDriven tier={tier} running={running} />
        <StateDriven tier={tier} running={running} />
      </div>

      <div className="note">
        <strong>The render counters are cumulative and never reset.</strong> Leave the page running
        and the <code>useState</code> panel climbs by ~60/second forever, while the MotionValue
        panel stays at its mount count. Same picture, same fps in the attribute tier — one of them
        is just doing thousands of times more work to get there.
      </div>

      <h4 style={{ margin: "32px 0 4px", fontSize: "var(--step-1)", fontWeight: 620 }}>
        The three escape hatches
      </h4>
      <p className="sec-lede">
        All three exist because <code>LiquidGlass</code> renders a <code>motion.div</code> you may
        not want.
      </p>

      <BackdropPicker value={backdrop} onChange={setBackdrop} />

      <div className="gallery" style={{ marginTop: 16 }}>
        <div className="panel" style={{ overflow: "hidden" }}>
          <div className="card-head">
            <h4>useLiquidSurface</h4>
            <span className="badge neutral">hook</span>
          </div>
          <Stage backdrop={backdrop} minHeight={170}>
            <HookSurface />
          </Stage>
          <div className="card-blurb">
            Returns <code>{"{ filterId, filterStyles, ref, Filter }"}</code>. Your markup, your
            element type — here a real <code>&lt;button&gt;</code>, which <code>LiquidGlass</code>{" "}
            could never be.
          </div>
        </div>

        <div className="panel" style={{ overflow: "hidden" }}>
          <div className="card-head">
            <h4>targetRef</h4>
            <span className="badge neutral">LiquidGlass</span>
          </div>
          <Stage backdrop={backdrop} minHeight={170}>
            <TargetRefSurface />
          </Stage>
          <div className="card-blurb">
            Pass <code>targetRef</code> and <code>LiquidGlass</code> renders <em>no wrapper</em> —
            it only mounts the filter and assigns <code>backdropFilter</code> onto your element in
            an effect.
          </div>
        </div>

        <div className="panel" style={{ overflow: "hidden" }}>
          <div className="card-head">
            <h4>filterOnly</h4>
            <span className="badge neutral">LiquidFilter</span>
          </div>
          <Stage backdrop={backdrop} minHeight={170}>
            <FilterOnlySurface />
          </Stage>
          <div className="card-blurb">
            <code>filterOnly</code> emits the bare <code>&lt;filter&gt;</code> with no wrapping{" "}
            <code>&lt;svg&gt;</code>, so many filters can share one hidden <code>&lt;defs&gt;</code>{" "}
            instead of one <code>&lt;svg&gt;</code> each.
          </div>
        </div>
      </div>
    </Section>
  );
}
