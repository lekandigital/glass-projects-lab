import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  BACKDROPS,
  COST_LABEL,
  type BackdropKey,
  type Cost,
  type GlassConfig,
  type OptionSpec,
  SURFACES,
} from "./config";

/* ------------------------------------------------------------------ *
 * Theme — the initial value is already on <html> from the inline script
 * in index.html, so we read it back rather than recomputing it.
 * ------------------------------------------------------------------ */

export type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme) ?? "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("wge:theme", theme);
    } catch {
      /* private mode */
    }
  }, [theme]);

  return [theme, setTheme] as const;
}

/* ------------------------------------------------------------------ *
 * Backdrops
 * ------------------------------------------------------------------ */

const TYPE_FILL = (
  "REFRACTIVE INDEX 1.5 · BEZEL WIDTH 20 · GLASS THICKNESS 40 · SPECULAR SATURATION 4 · " +
  "displacement map feImage feDisplacementMap xChannelSelector R yChannelSelector G · "
).repeat(60);

export function Backdrop({ kind }: { kind: BackdropKey }) {
  if (kind === "type") {
    return (
      <div className="backdrop backdrop-type" aria-hidden>
        {TYPE_FILL}
      </div>
    );
  }
  if (kind === "video") {
    return (
      <div className="backdrop" aria-hidden>
        <video
          className="backdrop-video"
          src="https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
    );
  }
  return <div className={`backdrop backdrop-${kind}`} aria-hidden />;
}

export function BackdropPicker({
  value,
  onChange,
}: {
  value: BackdropKey;
  onChange: (k: BackdropKey) => void;
}) {
  return (
    <div>
      <div className="seg">
        {(Object.keys(BACKDROPS) as BackdropKey[]).map((k) => (
          <button
            key={k}
            className="btn"
            aria-pressed={value === k}
            onClick={() => onChange(k)}
            type="button"
          >
            {BACKDROPS[k].label}
          </button>
        ))}
      </div>
      <p className="group-blurb">{BACKDROPS[value].blurb}</p>
    </div>
  );
}

export function Stage({
  backdrop,
  minHeight = 420,
  children,
}: {
  backdrop: BackdropKey;
  minHeight?: number;
  children: ReactNode;
}) {
  return (
    <div className="stage" style={{ minHeight }}>
      <Backdrop kind={backdrop} />
      <div className="stage-content">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Section chrome
 * ------------------------------------------------------------------ */

export function Section({
  id,
  num,
  title,
  lede,
  children,
}: {
  id: string;
  num: number;
  title: string;
  lede: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="sec" id={id}>
      <div className="sec-head">
        <span className="sec-num">{String(num).padStart(2, "0")}</span>
        <h3>{title}</h3>
      </div>
      <p className="sec-lede">{lede}</p>
      {children}
    </section>
  );
}

export function CostBadge({ cost }: { cost: Cost }) {
  return <span className={`badge ${cost}`}>{COST_LABEL[cost]}</span>;
}

/* ------------------------------------------------------------------ *
 * Controls
 * ------------------------------------------------------------------ */

export function Slider({
  spec,
  value,
  onChange,
}: {
  spec: OptionSpec;
  value: number;
  onChange: (v: number) => void;
}) {
  const decimals = (spec.step ?? 1) < 1 ? 2 : 0;
  return (
    <label className="ctl">
      <span className="ctl-top">
        <span className="ctl-name">{spec.key === "canvasPad" ? "canvasW/H pad" : spec.key}</span>
        {spec.motion && <span className="badge motion">MotionValue</span>}
      </span>
      <span className="ctl-val">{value.toFixed(decimals)}</span>
      <input
        className="ctl-row"
        type="range"
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
      />
      {spec.note && <span className="ctl-note">{spec.note}</span>}
    </label>
  );
}

export function SurfacePicker({
  spec,
  value,
  onChange,
}: {
  spec: OptionSpec;
  value: GlassConfig["surface"];
  onChange: (v: GlassConfig["surface"]) => void;
}) {
  return (
    <label className="ctl">
      <span className="ctl-top">
        <span className="ctl-name">bezelHeightFn</span>
      </span>
      <span className="ctl-val" />
      <select
        className="ctl-row"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value as GlassConfig["surface"])}
      >
        {(Object.keys(SURFACES) as GlassConfig["surface"][]).map((k) => (
          <option key={k} value={k}>
            {k} — {SURFACES[k].title}
          </option>
        ))}
      </select>
      {spec.note && <span className="ctl-note">{spec.note}</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ *
 * Codegen + copy
 * ------------------------------------------------------------------ */

const n = (v: number) => (Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2))));

/** Prints the JSX that reproduces `c`, omitting anything left at the library default. */
export function generateCode(c: GlassConfig, defaults: GlassConfig): string {
  const glassProps: string[] = [];
  const push = (k: keyof GlassConfig, printed: string) => {
    if (c[k] !== defaults[k]) glassProps.push(printed);
  };

  push("glassThickness", `glassThickness={${n(c.glassThickness)}}`);
  push("bezelWidth", `bezelWidth={${n(c.bezelWidth)}}`);
  push("refractiveIndex", `refractiveIndex={${n(c.refractiveIndex)}}`);
  push("blur", `blur={${n(c.blur)}}`);
  push("specularOpacity", `specularOpacity={${n(c.specularOpacity)}}`);
  push("specularSaturation", `specularSaturation={${n(c.specularSaturation)}}`);
  push("surface", `bezelHeightFn={${c.surface}.fn}`);
  push("dpr", `dpr={${n(c.dpr)}}`);

  const filterOnly = c.scaleRatio !== defaults.scaleRatio || c.canvasPad !== defaults.canvasPad;

  const imports = ["LiquidGlass"];
  if (c.surface !== defaults.surface) imports.push(c.surface);

  const head = `import { ${imports.join(", ")} } from '@creatorem/web-glass-effect';`;

  const body = [
    `<LiquidGlass`,
    ...glassProps.map((p) => `  ${p}`),
    `  className="p-6"`,
    `  style={{ width: ${n(c.width)}, height: ${n(c.height)}, borderRadius: ${n(c.radius)} }}`,
    `>`,
    `  {children}`,
    `</LiquidGlass>`,
  ].join("\n");

  if (!filterOnly) return `${head}\n\n${body}`;

  // scaleRatio and canvasWidth/canvasHeight never reach LiquidGlass — it does not
  // forward them — so a config that uses either has to drop to LiquidFilter.
  const filterImports = ["LiquidFilter"];
  if (c.surface !== defaults.surface) filterImports.push(c.surface);

  const filterProps = [
    `id="glass"`,
    `width={${n(c.width)}}`,
    `height={${n(c.height)}}`,
    `radius={${n(c.radius)}}`,
    ...(c.canvasPad !== defaults.canvasPad
      ? [
          `canvasWidth={${n(c.width + c.canvasPad * 2)}}`,
          `canvasHeight={${n(c.height + c.canvasPad * 2)}}`,
        ]
      : []),
    ...glassProps.filter((p) => !p.startsWith("dpr")),
    `dpr={${n(c.dpr)}}`,
    ...(c.scaleRatio !== defaults.scaleRatio ? [`scaleRatio={scaleRatio}`] : []),
  ];

  return [
    `import { ${filterImports.join(", ")} } from '@creatorem/web-glass-effect';`,
    `import { useMotionValue } from 'motion/react';`,
    ``,
    `// LiquidGlass does not forward scaleRatio / canvasWidth / canvasHeight.`,
    `// Reaching them means driving LiquidFilter yourself.`,
    ...(c.scaleRatio !== defaults.scaleRatio
      ? [`const scaleRatio = useMotionValue(${n(c.scaleRatio)});`, ``]
      : []),
    `<LiquidFilter`,
    ...filterProps.map((p) => `  ${p}`),
    `/>`,
    `<div style={{`,
    `  width: ${n(c.width)}, height: ${n(c.height)}, borderRadius: ${n(c.radius)},`,
    `  backdropFilter: 'url(#glass)',`,
    `}} />`,
  ].join("\n");
}

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      },
      () => setCopied(false),
    );
  }, [code]);

  return (
    <div className="code">
      <button className="btn copy" onClick={copy} type="button">
        {copied ? "Copied" : "Copy"}
      </button>
      <pre>{code}</pre>
    </div>
  );
}
