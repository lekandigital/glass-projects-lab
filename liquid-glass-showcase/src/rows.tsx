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

export function Swatches({
  value,
  onChange,
  options = BACKDROPS,
}: {
  value: Backdrop;
  onChange: (b: Backdrop) => void;
  options?: Backdrop[];
}) {
  return (
    <div className="swatches" role="radiogroup" aria-label="Row backdrop">
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
  backdrop,
  innerRef,
}: {
  icons?: typeof ICONS;
  onHover?: (i: number) => void;
  onLeave?: () => void;
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
        >
          {icon.glyph}
        </button>
      ))}
    </div>
  );
}
