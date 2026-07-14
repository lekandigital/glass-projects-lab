import { useState } from "react";
import { DEFAULT_OPTIONS, LiquidGlass } from "liquid-glass-web-react";
import {
  CodeBlock,
  GridBackdrop,
  Range,
  Section,
  Segmented,
  SUBSTRATES,
  SUBSTRATE_NOTE,
  SubstrateView,
  ToggleWrapBar,
  type Substrate,
} from "../components";
import {
  BACKDROPS,
  backdropVars,
  DockRow,
  GRID_TINTS,
  Swatches,
  TabRow,
  type Backdrop,
  type GridTint,
} from "../rows";
import { BarLens, type BarKind } from "../BarLens";
import {
  GROUP_LABEL,
  PRESET_GROUP_LABEL,
  PRESETS,
  SLIDERS,
  toJsx,
  type GlassParams,
  type Group,
  type Preset,
} from "../glass";

const QUALITIES = [128, 256, 512, 1024] as const;

/**
 * The UI bar the stage is wearing. It is *not* an independent control — it's
 * simply which preset is loaded: the demo lenses bring their own bar with them,
 * every other preset has none.
 */
type Overlay = "none" | "toggleWrap" | "tabBar" | "dock";
const SHADOWS = {
  default: true as const,
  none: false as const,
  neon: "0 0 0 1px rgba(120,200,255,0.6), 0 0 40px rgba(80,160,255,0.55)",
  hard: "0 10px 0 -2px rgba(0,0,0,0.35)",
};
type ShadowKey = keyof typeof SHADOWS;

/** BarLens takes a plain box-shadow string; map the picker onto one. */
function barShadow(key: ShadowKey): string {
  if (key === "none") return "none";
  if (key === "default") return "0 0 0 1px var(--lens-rim), 0 8px 22px var(--lens-shadow)";
  return SHADOWS[key] as string;
}

/**
 * Every preset, all at once. Clicking them one at a time in the panel tells you
 * what each does; seeing them side by side over the same chart is the only way
 * to judge them *against each other* — which is the actual question when you're
 * picking one.
 */
/**
 * What the gallery puts under every lens. "each preset's own" is the default —
 * looks on a chart, demo lenses on the surface they were shaped for — but any
 * of the others forces *all* the cards onto one background, which is how you
 * see the same preset overlap a grid, a photo and a UI bar side by side.
 * "grid" is the library demo's own page background, in whichever glow color the
 * stage is currently wearing.
 */
const GALLERY_BEDS = ["each preset's own", "chart", "grid", "checker", "photo"] as const;
type GalleryBed = (typeof GALLERY_BEDS)[number];

/**
 * What a card actually renders, once "each preset's own" is resolved. The demo
 * lenses keep their own UI bar — a selection indicator floating on a grid tells
 * you nothing — while the looks follow whichever background you pick.
 */
type ResolvedBed = Exclude<GalleryBed, "each preset's own"> | "tabBar" | "dock" | "toggle" | "text";

/** The UI bars need more room than one gallery column. */
const WIDE_BEDS: ResolvedBed[] = ["tabBar", "dock", "toggle", "text"];

function resolveBed(preset: Preset, gallery: GalleryBed): ResolvedBed {
  if (preset.bed === "tabs") return "tabBar";
  if (preset.bed === "dock") return "dock";
  if (preset.bed === "toggle") return "toggle";
  if (preset.bed === "text") return "text";
  return gallery === "each preset's own" ? "chart" : gallery;
}

function PresetCard({
  preset,
  backdrop,
  gridTint,
  galleryBed,
  onLoad,
}: {
  preset: Preset;
  backdrop: Backdrop;
  gridTint: GridTint;
  galleryBed: GalleryBed;
  onLoad: () => void;
}) {
  const p: GlassParams = { ...DEFAULT_OPTIONS, ...preset.params };
  const bed = resolveBed(preset, galleryBed);
  const wide = WIDE_BEDS.includes(bed);
  const barKind: BarKind | null =
    bed === "toggle" ? "toggleWrap" : bed === "tabBar" ? "tabBar" : bed === "dock" ? "dock" : null;

  // A lens that belongs to a bar rides that bar: pinned to its centre line,
  // springing between items. Everything else is a free, draggable lens.
  if (barKind) {
    return (
      <figure className="presetCard live">
        <div className="presetBed rowBed" style={backdropVars(backdrop)}>
          <BarLens
            kind={barKind}
            options={p}
            backdrop={backdrop}
            glideOnHover={barKind === "dock"}
          />
        </div>
        <figcaption>
          <p className="primNote">
            <strong>{preset.name}.</strong> {preset.note}
          </p>
          <button type="button" className="loadBtn" onClick={onLoad}>
            load ↑
          </button>
        </figcaption>
      </figure>
    );
  }

  // On a bar bed the lens is shown at true size — a scaled-down selection
  // indicator would misrepresent the one thing you're trying to judge. On the
  // abstract beds the looks get shrunk to fit: width, height, depth and radius
  // are all px, so scaling them together preserves the character.
  const scale = wide ? 1 : Math.min(1, 220 / p.width, 180 / p.height);
  const px = (n: number) => Math.round(n * scale);

  return (
    <figure className={`presetCard${wide ? " live" : ""}`}>
      <LiquidGlass
        {...p}
        width={px(p.width)}
        height={px(p.height)}
        depth={px(p.depth)}
        radius={p.radius === "auto" ? "auto" : px(p.radius)}
        draggable
        shadow="0 0 0 1px var(--lens-rim), 0 10px 26px var(--lens-shadow)"
      >
        {/* The bed has to live *inside* the lens: the filter only ever sees
            its own children. */}
        <PresetBed bed={bed} backdrop={backdrop} gridTint={gridTint} />
      </LiquidGlass>
      <figcaption>
        <p className="primNote">
          <strong>{preset.name}.</strong> {preset.note}
        </p>
        <button type="button" className="loadBtn" onClick={onLoad}>
          load ↑
        </button>
      </figcaption>
    </figure>
  );
}

function PresetBed({
  bed,
  backdrop,
  gridTint,
}: {
  bed: ResolvedBed;
  backdrop: Backdrop;
  gridTint: GridTint;
}) {
  // The bars themselves are transparent — the flat field behind them is what
  // the swatches colour, and it's what the lens actually has to refract.
  if (bed === "toggle") {
    return (
      <div className="presetBed rowBed" style={backdropVars(backdrop)}>
        <ToggleWrapBar bare />
      </div>
    );
  }
  // The full bars, not compact stand-ins: same components, same class names,
  // same children as the live demos further down.
  if (bed === "tabBar") {
    return (
      <div className="presetBed rowBed" style={backdropVars(backdrop)}>
        <TabRow selected={0} backdrop={backdrop} />
      </div>
    );
  }
  if (bed === "dock") {
    return (
      <div className="presetBed rowBed" style={backdropVars(backdrop)}>
        <DockRow backdrop={backdrop} />
      </div>
    );
  }
  if (bed === "text") {
    return (
      <div className="presetBed rowBed textBed" style={backdropVars(backdrop)}>
        <p>Live, selectable text — the thing this lens exists to magnify.</p>
      </div>
    );
  }
  if (bed === "photo") {
    return <img className="presetBed presetPhoto" src="https://picsum.photos/id/1015/900/560" alt="" />;
  }
  if (bed === "grid") return <GridBackdrop tint={gridTint} className="presetBed" />;
  if (bed === "checker") return <div className="presetBed bed bed-check" />;
  return <div className="presetBed bed bed-chart" />;
}

export function Playground({
  params,
  setParams,
}: {
  params: GlassParams;
  setParams: React.Dispatch<React.SetStateAction<GlassParams>>;
}) {
  const [substrate, setSubstrate] = useState<Substrate>("photo");
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [active, setActive] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const [mapUrl, setMapUrl] = useState("");
  const [draggable, setDraggable] = useState(true);
  const [shadowKey, setShadowKey] = useState<ShadowKey>("default");
  const [backdrop, setBackdrop] = useState(BACKDROPS[0]);
  const [gridTint, setGridTint] = useState(GRID_TINTS[0]);
  const [galleryBed, setGalleryBed] = useState<GalleryBed>("each preset's own");
  const [autoRadius, setAutoRadius] = useState(params.radius === "auto");
  const [radiusPx, setRadiusPx] = useState(typeof params.radius === "number" ? params.radius : 40);

  const set = <K extends keyof GlassParams>(key: K, value: GlassParams[K]) =>
    setParams((p) => ({ ...p, [key]: value }));

  // Loading a preset also loads the surface it belongs on: pick "Dock hover"
  // and the dock lands on the stage under the lens, pick a look and the stage
  // goes back to bare substrate.
  const applyPreset = (preset: Preset) => {
    const patch = preset.params;
    setActive(preset.name);
    setParams((p) => ({ ...p, ...patch }));
    if (patch.radius !== undefined) {
      setAutoRadius(patch.radius === "auto");
      if (typeof patch.radius === "number") setRadiusPx(patch.radius);
    }
    setOverlay(
      preset.bed === "tabs"
        ? "tabBar"
        : preset.bed === "dock"
          ? "dock"
          : preset.bed === "toggle"
            ? "toggleWrap"
            : "none",
    );
  };

  const groups: Group[] = ["shape", "refraction", "light"];

  const extras = [
    `x={${pos.x.toFixed(2)}} y={${pos.y.toFixed(2)}}`,
    draggable ? "draggable" : "",
    shadowKey === "default" ? "" : shadowKey === "none" ? "shadow={false}" : `shadow="${SHADOWS[shadowKey]}"`,
  ].filter(Boolean);

  return (
    <Section
      id="playground"
      eyebrow="01 · every option"
      title="The playground"
      lede={
        <>
          All eighteen engine options, live. Watch the badges: <em className="cost map">map</em> knobs
          change the lens <em>shape</em>, so the displacement map is recomputed (throttled to one per
          frame); <em className="cost filter">filter</em> knobs are pure SVG attribute writes and cost
          essentially nothing. Moving the lens is always free.
        </>
      }
    >
      <div className="playGrid">
        <div className="stageCol">
          <div className="stageBar">
            <Segmented options={SUBSTRATES} value={substrate} onChange={setSubstrate} />
            {/* The grid is the only substrate with a colour to pick: its glows. */}
            {substrate === "grid" && (
              <Swatches
                value={gridTint}
                onChange={setGridTint}
                options={GRID_TINTS}
                label="Grid glow color"
              />
            )}
            <span className="stageNote">{SUBSTRATE_NOTE[substrate]}</span>
          </div>

          <div className="stage">
            {overlay === "none" ? (
              <LiquidGlass
                key={substrate}
                {...params}
                x={pos.x}
                y={pos.y}
                draggable={draggable}
                shadow={SHADOWS[shadowKey]}
                onMove={(x, y) => setPos({ x, y })}
                onMapGenerated={setMapUrl}
                className="stageGlass"
              >
                <SubstrateView kind={substrate} gridTint={gridTint} />
              </LiquidGlass>
            ) : (
              /* A bar preset: the lens becomes the bar's selection indicator.
                 Its y is pinned to the bar, its x springs to the item you click
                 or drag it nearest to — the upstream toggle's behaviour, on all
                 three bars. Every slider still drives it. */
              <BarLens
                key={`${substrate}-${overlay}`}
                kind={overlay}
                options={params}
                backdrop={backdrop}
                glideOnHover={overlay === "dock"}
                shadow={barShadow(shadowKey)}
                background={<SubstrateView kind={substrate} gridTint={gridTint} />}
                // The grid keeps its own ground in both themes, so it has to
                // tell the bar what colour to ink itself.
                vars={
                  substrate === "grid" ? { ["--flat-ink" as string]: gridTint.ink } : undefined
                }
              />
            )}
          </div>

          <div className="readout">
            <div className="readoutItem">
              <span>onMove</span>
              <code>
                x {pos.x.toFixed(3)} · y {pos.y.toFixed(3)}
              </code>
            </div>
            <div className="readoutItem">
              <span>onMapGenerated</span>
              {mapUrl ? <img className="mapChip" src={mapUrl} alt="displacement map" /> : <code>—</code>}
            </div>
            <div className="readoutItem">
              <span>map size</span>
              <code>
                {params.quality}×{params.quality}
              </code>
            </div>
          </div>

          <CodeBlock code={toJsx(params, extras)} />
        </div>

        <aside className="controlCol">
          {(["look", "demo"] as const).map((kind) => (
            <div className="presetGroup" key={kind}>
              <h4>{PRESET_GROUP_LABEL[kind]}</h4>
              <div className="presets">
                {PRESETS.filter((preset) => preset.kind === kind).map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className={`preset${kind === "demo" ? " demo" : ""}${
                      preset.name === active ? " on" : ""
                    }`}
                    aria-pressed={preset.name === active}
                    title={preset.note}
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {groups.map((group) => (
            <div className="controlGroup" key={group}>
              <h4>{GROUP_LABEL[group]}</h4>
              {group === "shape" && (
                <div className="radiusRow">
                  <Range
                    label="radius"
                    value={radiusPx}
                    min={0}
                    max={200}
                    step={1}
                    badge="map"
                    hint="Corner radius in px. 'auto' clamps to a full pill/circle."
                    onChange={(v) => {
                      setRadiusPx(v);
                      setAutoRadius(false);
                      set("radius", v);
                    }}
                  />
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={autoRadius}
                      onChange={(e) => {
                        setAutoRadius(e.target.checked);
                        set("radius", e.target.checked ? "auto" : radiusPx);
                      }}
                    />
                    <span>
                      radius=<code>"auto"</code>
                    </span>
                  </label>
                </div>
              )}
              {SLIDERS.filter((s) => s.group === group).map((s) => (
                <Range
                  key={s.key}
                  label={s.label}
                  value={params[s.key]}
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  badge={s.cost}
                  hint={s.hint}
                  onChange={(v) => set(s.key, v)}
                />
              ))}
            </div>
          ))}

          <div className="controlGroup">
            <h4>Component props</h4>
            <label className="check">
              <input
                type="checkbox"
                checked={draggable}
                onChange={(e) => setDraggable(e.target.checked)}
              />
              <span>
                <code>draggable</code> — built-in pointer drag
              </span>
            </label>

            <div className="field">
              <span className="fieldLabel">
                <code>shadow</code>
              </span>
              <Segmented
                options={Object.keys(SHADOWS) as ShadowKey[]}
                value={shadowKey}
                onChange={setShadowKey}
              />
            </div>

            <div className="field">
              <span className="fieldLabel">
                <code>quality</code> — map resolution
              </span>
              <Segmented
                options={QUALITIES.map(String)}
                value={String(params.quality)}
                onChange={(v) => set("quality", Number(v))}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="presetRowHead">
        <h3>Every preset at once</h3>
        <p className="lede">
          The same thirteen lenses the panel loads one at a time, side by side — each one draggable.
          By default the looks sit on a lens chart and the demo lenses on the surface they were
          shaped for; pick a background below to force every preset onto the <em>same</em> one and
          see how each overlaps a grid, a photo or a UI bar.
        </p>
        <div className="backdropBar">
          <span className="fieldLabel">Background</span>
          <Segmented options={GALLERY_BEDS} value={galleryBed} onChange={setGalleryBed} />
        </div>
        {galleryBed === "grid" && (
          <div className="backdropBar">
            <span className="fieldLabel">Grid glow</span>
            {/* The same tint the stage is wearing — one picker, both places. */}
            <Swatches
              value={gridTint}
              onChange={setGridTint}
              options={GRID_TINTS}
              label="Grid glow color"
            />
            <span className="stageNote">{gridTint.name} — also drives the stage above</span>
          </div>
        )}
        <div className="backdropBar">
          <span className="fieldLabel">Flat fill</span>
          <Swatches value={backdrop} onChange={setBackdrop} options={BACKDROPS} />
          <span className="stageNote">{backdrop.name} — used by the tabBar, dock and text beds</span>
        </div>
      </div>

      {/* Demo lenses first: they're the ones carrying the real UI bars, and
          burying them under seven abstract cards made them easy to miss. */}
      {(["demo", "look"] as const).map((kind) => (
        <div key={kind}>
          <h4 className="galleryGroup">
            {kind === "demo" ? "Lenses from the demos below — on their real bars" : "Looks"}
          </h4>
          <div className="presetRow">
            {PRESETS.filter((preset) => preset.kind === kind).map((preset) => (
              <PresetCard
                key={preset.name}
                preset={preset}
                backdrop={backdrop}
                gridTint={gridTint}
                galleryBed={galleryBed}
                onLoad={() => {
                  applyPreset(preset);
                  document.getElementById("playground")?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}
