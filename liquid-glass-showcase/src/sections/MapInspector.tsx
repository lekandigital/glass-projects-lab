import { useEffect, useMemo, useRef } from "react";
import { computeDisplacementMap, renderDisplacementMap, type DisplacementMapParams } from "liquid-glass-web-react";
import { CodeBlock, Section } from "../components";
import type { GlassParams } from "../glass";

const VIEW = 200; // px each canvas is displayed at

type Channel = { key: string; title: string; note: string };

const CHANNELS: Channel[] = [
  { key: "rgba", title: "The map", note: "What feImage actually loads. R/G bend, B glows, A is the shape." },
  { key: "r", title: "R — x displacement", note: "128 = don't move. Darker pulls left, brighter pushes right." },
  { key: "g", title: "G — y displacement", note: "Same story vertically. Flat in the middle, steep at the rim." },
  { key: "b", title: "B — baked specular", note: "Glow + edge highlight, precomputed. The filter lifts this into light." },
  { key: "a", title: "A — lens shape", note: "The exact rounded-rect. Refraction and blur get clipped to it." },
];

/** The engine's own translation from component options to map params. */
function toMapParams(p: GlassParams): DisplacementMapParams {
  const hw = p.width / 2;
  const hh = p.height / 2;
  const max = Math.min(hw, hh);
  return {
    size: p.quality,
    halfWidth: hw,
    halfHeight: hh,
    radius: p.radius === "auto" ? max : Math.min(p.radius, max),
    depth: p.depth,
    domeDepth: Math.max(0, Math.min(1, p.curvature)) * max,
    splay: p.splay,
    glow: p.glow,
    glowSpread: p.glowSpread,
    glowExponent: p.glowExponent,
    edgeHighlight: p.edgeHighlight,
    edgeWidth: p.edgeWidth,
    edgeExponent: p.edgeExponent,
    specularAngle: p.specularAngle,
  };
}

export function MapInspector({ params }: { params: GlassParams }) {
  const refs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const mapParams = useMemo(() => toMapParams(params), [params]);

  useEffect(() => {
    // The same pure function the engine calls — no DOM, no React, just pixels.
    const size = mapParams.size;
    const data = computeDisplacementMap(mapParams);

    for (const channel of CHANNELS) {
      const canvas = refs.current[channel.key];
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) continue;
      canvas.width = size;
      canvas.height = size;
      const image = ctx.createImageData(size, size);
      const out = image.data;

      for (let i = 0; i < size * size; i++) {
        const s = i * 4;
        if (channel.key === "rgba") {
          out[s] = data[s];
          out[s + 1] = data[s + 1];
          out[s + 2] = data[s + 2];
          out[s + 3] = data[s + 3];
          continue;
        }
        const offset = channel.key === "r" ? 0 : channel.key === "g" ? 1 : channel.key === "b" ? 2 : 3;
        const v = data[s + offset];
        out[s] = out[s + 1] = out[s + 2] = v;
        out[s + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
    }
  }, [mapParams]);

  const download = () => {
    const url = renderDisplacementMap(mapParams);
    const a = document.createElement("a");
    a.href = url;
    a.download = `displacement-${mapParams.size}.png`;
    a.click();
  };

  return (
    <Section
      id="map"
      eyebrow="02 · low-level exports"
      title="The map, pulled apart"
      lede={
        <>
          The lens is not magic — it's one small PNG. <code>computeDisplacementMap</code> is exported
          as a pure function (no DOM, worker-friendly), so this section calls it with the exact
          numbers you set upstairs and splits the result into its four channels. Only a quarter of it
          is ever computed; the other three quadrants are mirrored.
        </>
      }
    >
      <div className="mapRow">
        {CHANNELS.map((channel) => (
          <figure className="mapCard" key={channel.key}>
            <canvas
              ref={(el) => {
                refs.current[channel.key] = el;
              }}
              style={{ width: VIEW, height: VIEW }}
              className={channel.key === "rgba" ? "checker" : ""}
            />
            <figcaption>
              <strong>{channel.title}</strong>
              <span>{channel.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mapActions">
        <button type="button" className="ghost" onClick={download}>
          ↓ Download this map as PNG
        </button>
        <span className="stageNote">
          {mapParams.size}×{mapParams.size} · regenerated whenever a shape option changes
        </span>
      </div>

      <CodeBlock
        code={`import { computeDisplacementMap, renderDisplacementMap } from "liquid-glass-web-react";

// Raw RGBA — feed it to a WebGL shader, a worker, whatever you like.
const pixels = computeDisplacementMap({
  size: ${mapParams.size},
  halfWidth: ${mapParams.halfWidth}, halfHeight: ${mapParams.halfHeight},
  radius: ${round(mapParams.radius)}, depth: ${mapParams.depth},
  domeDepth: ${round(mapParams.domeDepth)},   // curvature × min(halfW, halfH)
  splay: ${round(mapParams.splay)},
  glow: ${round(mapParams.glow)}, glowSpread: ${round(mapParams.glowSpread)}, glowExponent: ${round(mapParams.glowExponent)},
  edgeHighlight: ${round(mapParams.edgeHighlight)}, edgeWidth: ${round(mapParams.edgeWidth)}, edgeExponent: ${round(mapParams.edgeExponent)},
  specularAngle: ${mapParams.specularAngle},
});

// Or straight to a PNG data URL:
const url = renderDisplacementMap(params);`}
      />
    </Section>
  );
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
