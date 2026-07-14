import { DEFAULT_OPTIONS } from "liquid-glass-web-react";
import { Section } from "../components";

const ROWS: [prop: string, type: string, def: string, desc: string][] = [
  ["x, y", "number", "0.5", "Lens center, as a fraction of the container."],
  ["width, height", "number", `${DEFAULT_OPTIONS.width}, ${DEFAULT_OPTIONS.height}`, "Lens size in px."],
  ["radius", 'number | "auto"', '"auto"', "Corner radius in px; auto is a full pill."],
  ["strength", "number", String(DEFAULT_OPTIONS.strength), "Refraction strength, as a fraction of the container size."],
  ["chromaticAberration", "number", String(DEFAULT_OPTIONS.chromaticAberration), "Per-channel scale offset, 0–1."],
  ["blur", "number", String(DEFAULT_OPTIONS.blur), "Blur of the refracted content, px."],
  ["depth", "number", String(DEFAULT_OPTIONS.depth), "Width of the refracting edge band, px."],
  ["curvature", "number", String(DEFAULT_OPTIONS.curvature), "Lens profile: 0 linear → 1 spherical dome."],
  ["splay", "number", String(DEFAULT_OPTIONS.splay), "Keeps edge refraction perpendicular to the edge, 0–1."],
  ["glow", "number", String(DEFAULT_OPTIONS.glow), "Inner specular glow, 0–1."],
  ["glowSpread", "number", String(DEFAULT_OPTIONS.glowSpread), "Fraction of the lens the glow spreads across."],
  ["glowExponent", "number", String(DEFAULT_OPTIONS.glowExponent), "Falloff exponent of the glow."],
  ["edgeHighlight", "number", String(DEFAULT_OPTIONS.edgeHighlight), "Bright rim along the lens edge, 0–1."],
  ["edgeWidth", "number", String(DEFAULT_OPTIONS.edgeWidth), "Width of the edge highlight band, px."],
  ["edgeExponent", "number", String(DEFAULT_OPTIONS.edgeExponent), "Falloff exponent of the edge highlight."],
  ["specular", "number", String(DEFAULT_OPTIONS.specular), "Master intensity of the specular pass."],
  ["specularAngle", "number", String(DEFAULT_OPTIONS.specularAngle), "Light direction, degrees."],
  ["quality", "number", String(DEFAULT_OPTIONS.quality), "Displacement map resolution."],
  ["draggable", "boolean", "false", "Let the user drag the lens."],
  ["shadow", "boolean | string", "true", "Lens drop shadow; pass a box-shadow string to customize."],
  ["onMove", "(x, y) => void", "—", "Fires as the lens moves."],
  ["onMapGenerated", "(url) => void", "—", "Fires with the map PNG data URL on regeneration."],
];

const EXPORTS: [name: string, what: string][] = [
  ["LiquidGlass", "The React component. Everything above, plus any <div> prop."],
  ["LiquidGlassHandle", "ref shape: { element, engine, setPosition(x, y) }."],
  ["LiquidGlassEngine", "The framework-free core. Owns the filter and the map."],
  ["computeDisplacementMap", "Pure function → raw RGBA pixels. No DOM; worker-safe."],
  ["renderDisplacementMap", "Same, rendered to a PNG data URL via a canvas."],
  ["DEFAULT_OPTIONS", "The defaults object, so you can diff against it."],
  ["LiquidGlassOptions, DisplacementMapParams", "The types."],
];

export function Reference() {
  return (
    <Section
      id="reference"
      eyebrow="08 · the whole surface area"
      title="Everything it exports"
      lede="Twenty-two props, seven exports, zero dependencies. Defaults below are read straight out of DEFAULT_OPTIONS at runtime — this table cannot go stale."
    >
      <div className="refGrid">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>What it does</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([prop, type, def, desc]) => (
                <tr key={prop}>
                  <td>
                    <code>{prop}</code>
                  </td>
                  <td className="muted">
                    <code>{type}</code>
                  </td>
                  <td>
                    <code>{def}</code>
                  </td>
                  <td className="muted">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="refSide">
          <h4>Exports</h4>
          <ul className="exportList">
            {EXPORTS.map(([name, what]) => (
              <li key={name}>
                <code>{name}</code>
                <span>{what}</span>
              </li>
            ))}
          </ul>

          <h4>The sharp edges</h4>
          <ul className="warnList">
            <li>
              <strong>Safari + &lt;video&gt;</strong> — WebKit never routes video into the SVG filter
              pipeline. The video substrate in the playground refracts in Chrome and Firefox; on
              Safari it just plays. Feed <code>computeDisplacementMap</code> to a WebGL shader if you
              need it there.
            </li>
            <li>
              <strong>Safari source size</strong> — there's a cap on how large a source graphic a
              filter can process. The engine warns once past ~2.5 megapixels. Keep the glass on
              reasonably sized regions.
            </li>
            <li>
              <strong>iOS</strong> — misplaces <code>objectBoundingBox</code> filter subregions, so
              the engine silently switches to <code>userSpaceOnUse</code> there. Nothing to
              configure; <code>strength</code> means the same thing everywhere.
            </li>
            <li>
              <strong>SSR</strong> — safe. All DOM work happens in effects and the bundle is marked{" "}
              <code>"use client"</code>.
            </li>
          </ul>
        </aside>
      </div>
    </Section>
  );
}
