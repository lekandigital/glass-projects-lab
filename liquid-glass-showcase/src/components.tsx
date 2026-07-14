import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "./theme";
import { gridVars, type GridTint } from "./rows";

/* ------------------------------------------------------------------ *
 * Section chrome
 * ------------------------------------------------------------------ */

export function Section({
  id,
  eyebrow,
  title,
  children,
  lede,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lede: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="section">
      <div className="sectionHead">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p className="lede">{lede}</p>
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Substrates: the live DOM the lens refracts. Every one of these stays
 * interactive under the glass — text selects, links click, video plays.
 * ------------------------------------------------------------------ */

export const SUBSTRATES = ["photo", "type", "interface", "chart", "grid", "video", "canvas"] as const;
export type Substrate = (typeof SUBSTRATES)[number];

export const SUBSTRATE_NOTE: Record<Substrate, string> = {
  photo: "A plain <img>. The real-world case — and the only colored one.",
  type: "Real text — try selecting it through the lens.",
  interface: "A live UI. The buttons under the glass still click.",
  chart: "A lens chart: rings, spokes, grid. Read curvature, splay and depth straight off it.",
  grid: "The demo's own page background — a ruled grid under two soft glows. Pick the glow color.",
  video: "An autoplaying <video>. Works in Chrome/Firefox; Safari can't route video through SVG filters.",
  canvas: "A <canvas> repainting every frame, refracted live.",
};

/** The upstream demo's own toggle-group labels. */
const TOGGLE_OPTIONS = ["Hubs", "Spokes", "Reserves", "Assets", "Chains"];

/**
 * `.toggleWrap` exactly as the library's demo writes it — the bar and nothing
 * else. `bare` drops the pill's own gradient so it sits frosted and translucent
 * on whatever field is behind it; without it, this is the upstream pill
 * untouched.
 */
export function ToggleWrapBar({
  bare = false,
  selected,
  onSelect,
  innerRef,
}: {
  bare?: boolean;
  /** Controlled selection. Left off, the bar keeps its own. */
  selected?: number;
  onSelect?: (i: number) => void;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  const [own, setOwn] = useState(0);
  const current = selected ?? own;
  return (
    <div className="toggleWrap">
      <div className={`toggle${bare ? " bare" : ""}`} ref={innerRef}>
        {TOGGLE_OPTIONS.map((label, i) => (
          <button
            key={label}
            aria-pressed={i === current}
            onClick={() => (onSelect ? onSelect(i) : setOwn(i))}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The library demo's page background, lifted from its `.page` rule: a 55px ruled
 * grid over two big radial glows. The rules and the near-black base are fixed —
 * they are what the lens is being read against — and only the glows take the
 * picked color.
 */
export function GridBackdrop({
  tint,
  className = "sub",
}: {
  tint: GridTint;
  className?: string;
}) {
  return <div className={`${className} gridBg`} style={gridVars(tint)} />;
}

export function SubstrateView({ kind, gridTint }: { kind: Substrate; gridTint: GridTint }) {
  if (kind === "photo") {
    return <img className="sub subPhoto" src="https://picsum.photos/id/1015/1400/900" alt="" />;
  }
  if (kind === "type") {
    return (
      <div className="sub subType bed">
        <h3>Refraction over live text</h3>
        <p>
          The lens bends pixels the browser has already painted, so nothing here is a snapshot.
          Drag the glass across this paragraph and then select the sentence underneath it — the
          selection follows your cursor through the distortion, because the text never left the
          DOM. That is the whole point of the technique: no canvas copy, no screenshot, no
          duplicated tree.
        </p>
        <p>
          A <a href="#top">link stays clickable</a>, a heading stays a heading, and a screen
          reader walks straight past the filter as if it were not there.
        </p>
      </div>
    );
  }
  if (kind === "interface") {
    return <FakeApp />;
  }
  if (kind === "chart") {
    return <div className="sub subChart bed bed-chart" />;
  }
  if (kind === "grid") {
    return <GridBackdrop tint={gridTint} />;
  }
  if (kind === "video") {
    return (
      <video
        className="sub subVideo"
        src="https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }
  return <LiveCanvas />;
}

function FakeApp() {
  const [active, setActive] = useState(1);
  return (
    <div className="sub subApp bed">
      <div className="appBar">
        <span className="appDot r" />
        <span className="appDot y" />
        <span className="appDot g" />
        <span className="appTitle">Refracted, still clickable</span>
      </div>
      <div className="appBody">
        <nav className="appNav">
          {["Overview", "Activity", "Reserves", "Settings"].map((label, i) => (
            <button
              key={label}
              className={i === active ? "on" : ""}
              onClick={() => setActive(i)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="appMain">
          <div className="appStat">
            <span>Balance</span>
            <strong>$41,208.55</strong>
          </div>
          <div className="appBars">
            {[52, 78, 41, 96, 63, 88, 34, 71, 59, 82, 47, 91].map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A field of thin neutral contour lines, repainted every frame. High spatial
 * frequency and no hue: exactly what you want under a lens, because every
 * distortion and every color fringe the filter invents is unambiguously the
 * lens's doing.
 */
function LiveCanvas() {
  const { theme } = useTheme();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = 900 * dpr;
    canvas.height = 520 * dpr;
    ctx.scale(dpr, dpr);

    const dark = theme === "dark";
    const bg = dark ? "#0b0c0f" : "#fbfbfa";
    const ink = dark ? "255,255,255" : "16,18,24";

    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const t = (now - start) / 1000;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 900, 520);
      for (let i = 0; i < 34; i++) {
        const p = i / 34;
        ctx.beginPath();
        for (let x = 0; x <= 900; x += 6) {
          const y =
            260 +
            Math.sin(x / 90 + t * 0.9 + p * 5) * (36 + 66 * p) +
            Math.cos(x / 160 - t * 0.6 + p * 3) * 30;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${ink}, ${0.12 + p * 0.45})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [theme]);

  return <canvas ref={ref} className="sub subCanvas" />;
}

/* ------------------------------------------------------------------ *
 * Controls
 * ------------------------------------------------------------------ */

export function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  badge,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  badge?: string;
  hint?: string;
}) {
  const decimals = Math.max(0, Math.ceil(-Math.log10(step)));
  return (
    <label className="range" title={hint}>
      <span className="rangeTop">
        <span className="rangeLabel">
          {label}
          {badge && <em className={`cost ${badge}`}>{badge}</em>}
        </span>
        <output>{value.toFixed(decimals)}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ["--fill" as string]: `${((value - min) / (max - min)) * 100}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={option === value}
          className={option === value ? "on" : ""}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="codeWrap">
      <button
        type="button"
        className="copyBtn"
        onClick={() => {
          void navigator.clipboard?.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
      >
        {copied ? "copied" : "copy"}
      </button>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
