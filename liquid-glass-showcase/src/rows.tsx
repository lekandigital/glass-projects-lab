import type { CSSProperties } from "react";

/**
 * Flat backdrops for the UI rows. Deliberately solid — no gradients, no
 * texture. A lens over a flat field is the honest test of the specular pass:
 * every highlight you see is baked light, not the background showing through.
 * Switch between them to see how the same glass behaves on dark, saturated and
 * paper-white surfaces.
 */
export interface Backdrop {
  name: string;
  bg: string;
  ink: string;
}

export const BACKDROPS: Backdrop[] = [
  { name: "Slate", bg: "#2b3440", ink: "#ffffff" },
  { name: "Indigo", bg: "#3b35b8", ink: "#ffffff" },
  { name: "Teal", bg: "#0f766e", ink: "#ffffff" },
  { name: "Crimson", bg: "#a41b3f", ink: "#ffffff" },
  { name: "Amber", bg: "#c2760c", ink: "#241200" },
  { name: "Paper", bg: "#eceae5", ink: "#14161a" },
];

export function backdropVars(backdrop: Backdrop): CSSProperties {
  return { ["--flat" as string]: backdrop.bg, ["--flat-ink" as string]: backdrop.ink };
}

/**
 * The demo's page background, recoloured. Upstream paints a ruled grid under two
 * soft radial glows — one indigo, one teal, on near-black. "Original" is that,
 * to the value; the rest lift the base and push the glows so the colour actually
 * reads, and "White" flips the whole thing to paper with dark rules.
 *
 * `base` is the flat ground, `rule` the grid lines, `glow1` / `glow2` the two
 * radials. `bg` is only what the picker's swatch shows.
 */
export interface GridTint extends Backdrop {
  base: string;
  rule: string;
  glow1: string;
  glow2: string;
}

export const GRID_TINTS: GridTint[] = [
  {
    name: "Original",
    bg: "linear-gradient(120deg, #5b4ec9, #1f7a6e)",
    ink: "#ffffff",
    base: "#08080b",
    rule: "rgba(255, 255, 255, 0.03)",
    glow1: "rgba(91, 78, 201, 0.22)",
    glow2: "rgba(31, 122, 110, 0.16)",
  },
  {
    name: "White",
    bg: "#ffffff",
    ink: "#14161a",
    base: "#ffffff",
    rule: "rgba(16, 18, 24, 0.07)",
    glow1: "rgba(91, 78, 201, 0.16)",
    glow2: "rgba(31, 122, 110, 0.12)",
  },
  {
    name: "Indigo",
    bg: "#5b4ec9",
    ink: "#ffffff",
    base: "#14152b",
    rule: "rgba(255, 255, 255, 0.07)",
    glow1: "rgba(112, 98, 240, 0.5)",
    glow2: "rgba(59, 53, 184, 0.32)",
  },
  {
    name: "Teal",
    bg: "#1f7a6e",
    ink: "#ffffff",
    base: "#0c2422",
    rule: "rgba(255, 255, 255, 0.07)",
    glow1: "rgba(45, 212, 191, 0.42)",
    glow2: "rgba(31, 122, 110, 0.34)",
  },
  {
    name: "Crimson",
    bg: "#a41b3f",
    ink: "#ffffff",
    base: "#2a0d17",
    rule: "rgba(255, 255, 255, 0.07)",
    glow1: "rgba(255, 69, 120, 0.4)",
    glow2: "rgba(164, 27, 63, 0.36)",
  },
  {
    name: "Amber",
    bg: "#c2760c",
    ink: "#241200",
    base: "#2a1c07",
    rule: "rgba(255, 255, 255, 0.07)",
    glow1: "rgba(255, 190, 60, 0.4)",
    glow2: "rgba(194, 118, 12, 0.34)",
  },
];

export function gridVars(tint: GridTint): CSSProperties {
  return {
    ["--grid-base" as string]: tint.base,
    ["--grid-rule" as string]: tint.rule,
    ["--grid-glow-1" as string]: tint.glow1,
    ["--grid-glow-2" as string]: tint.glow2,
  };
}

export function Swatches<T extends Backdrop>({
  value,
  onChange,
  options,
  label = "Row backdrop",
}: {
  value: T;
  onChange: (b: T) => void;
  options: T[];
  label?: string;
}) {
  return (
    <div className="swatches" role="radiogroup" aria-label={label}>
      {options.map((backdrop) => (
        <button
          key={backdrop.name}
          type="button"
          role="radio"
          aria-checked={backdrop.name === value.name}
          className={`swatch${backdrop.name === value.name ? " on" : ""}`}
          style={{ background: backdrop.bg }}
          title={backdrop.name}
          onClick={() => onChange(backdrop)}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The two rows the lens rides on. Both are used twice: once in the
 * "In real UI" section as the live demo, and again in the playground's
 * preset gallery, so the preset shows the lens on the surface it was
 * actually designed for.
 * ------------------------------------------------------------------ */

export const TABS = ["Home", "Discover", "Library", "Radio", "Search"];

export function TabRow({
  labels = TABS,
  selected,
  onSelect,
  backdrop,
  innerRef,
}: {
  labels?: string[];
  selected: number;
  onSelect?: (i: number) => void;
  backdrop: Backdrop;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className="tabBar" ref={innerRef} style={backdropVars(backdrop)}>
      {labels.map((label, i) => (
        <button
          key={label}
          type="button"
          aria-pressed={i === selected}
          onClick={() => onSelect?.(i)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Flat icon tiles — one solid fill each, no gradient. */
export const ICONS = [
  { glyph: "◐", bg: "#ff453a", ink: "#ffffff" },
  { glyph: "✦", bg: "#ff9f0a", ink: "#3a1c00" },
  { glyph: "⬡", bg: "#ffd60a", ink: "#3a3000" },
  { glyph: "◈", bg: "#30d158", ink: "#04351a" },
  { glyph: "❋", bg: "#0a84ff", ink: "#ffffff" },
  { glyph: "⧗", bg: "#5e5ce6", ink: "#ffffff" },
  { glyph: "◍", bg: "#ff2d92", ink: "#ffffff" },
];

export function DockRow({
  icons = ICONS,
  onHover,
  onLeave,
  onSelect,
  backdrop,
  innerRef,
}: {
  icons?: typeof ICONS;
  onHover?: (i: number) => void;
  onLeave?: () => void;
  onSelect?: (i: number) => void;
  backdrop: Backdrop;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className="dock" ref={innerRef} style={backdropVars(backdrop)} onPointerLeave={onLeave}>
      {icons.map((icon, i) => (
        <button
          key={icon.glyph}
          type="button"
          className="dockIcon"
          style={{ background: icon.bg, color: icon.ink }}
          onPointerEnter={() => onHover?.(i)}
          onClick={() => onSelect?.(i)}
        >
          {icon.glyph}
        </button>
      ))}
    </div>
  );
}
