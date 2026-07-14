import { useState } from "react";
import { GlassSurface } from "../GlassSurface";
import { LIBRARY_DEFAULTS, PRESETS, PRESET_KEYS, type BackdropKey, type GlassConfig } from "../config";
import { Backdrop, BackdropPicker, Section } from "../ui";

/** The props this preset actually moves off the library default — the whole story of the look. */
function deltas(c: GlassConfig): string[] {
  const out: string[] = [];
  for (const k of Object.keys(LIBRARY_DEFAULTS) as (keyof GlassConfig)[]) {
    if (k === "width" || k === "height") continue;
    if (c[k] !== LIBRARY_DEFAULTS[k]) out.push(`${k}=${c[k]}`);
  }
  return out;
}

const CARD_W = 250;
const CARD_H = 150;

export function Variants() {
  const [backdrop, setBackdrop] = useState<BackdropKey>("checker");

  return (
    <Section
      id="variants"
      num={3}
      title="Variants gallery"
      lede={
        <>
          One preset per distinct look, all on the same backdrop at the same size, because the only
          question that matters is how they differ from each other. Every card is a{" "}
          <code>GlassConfig</code> from <code>config.ts</code> — the four presets labelled
          “Upstream” are composed from the library's own demo constants, not retyped, so they cannot
          drift from the real thing in section 6.
        </>
      }
    >
      <BackdropPicker value={backdrop} onChange={setBackdrop} />

      <div className="gallery" style={{ marginTop: 20 }}>
        {PRESET_KEYS.map((key) => {
          const { label, blurb, config } = PRESETS[key];
          // Normalise the box so the gallery compares surfaces, not sizes.
          const card: GlassConfig = { ...config, width: CARD_W - 40, height: CARD_H - 40 };
          return (
            <div className="panel" key={key} style={{ overflow: "hidden" }}>
              <div className="card-head">
                <h4>{label}</h4>
                <span className="badge neutral">{config.surface}</span>
              </div>

              <div
                className="stage"
                style={{ borderRadius: 0, border: 0, height: CARD_H }}
                data-testid={`variant-${key}`}
              >
                <Backdrop kind={backdrop} />
                <div className="stage-content">
                  <GlassSurface id={`variant-${key}`} config={card} />
                </div>
              </div>

              <div className="card-blurb">
                <p style={{ margin: "0 0 6px" }}>{blurb}</p>
                <code style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                  {deltas(config).join(" · ") || "— all defaults —"}
                </code>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
