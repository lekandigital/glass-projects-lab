import { LiquidGlass, type LiquidGlassOptions } from "liquid-glass-web-react";
import { Section } from "../components";

interface Shape {
  name: string;
  code: string;
  /** Which test surface reads this shape best. */
  bed: "bed-chart" | "bed-check" | "bed-grid";
  options: Partial<LiquidGlassOptions>;
}

const SHAPES: Shape[] = [
  {
    name: "Circle",
    code: 'width=height, radius="auto"',
    bed: "bed-chart",
    options: { width: 130, height: 130, radius: "auto", strength: 0.09, curvature: 0.85, depth: 22, glow: 0.5, edgeHighlight: 0.7 },
  },
  {
    name: "Pill",
    code: 'width > height, radius="auto"',
    bed: "bed-grid",
    options: { width: 190, height: 74, radius: "auto", strength: 0.06, curvature: 0.8, depth: 16, glow: 0.35, edgeHighlight: 0.6 },
  },
  {
    name: "Squircle",
    code: "radius={44}",
    bed: "bed-check",
    options: { width: 150, height: 150, radius: 44, strength: 0.07, curvature: 0.7, depth: 20, glow: 0.4, edgeHighlight: 0.65 },
  },
  {
    name: "Sharp pane",
    code: "radius={0}, curvature={0}",
    bed: "bed-grid",
    options: { width: 160, height: 120, radius: 0, strength: 0.05, curvature: 0, splay: 0, depth: 34, glow: 0.15, edgeHighlight: 0.75, edgeWidth: 6 },
  },
  {
    name: "Slit",
    code: "a 28px tall bar",
    bed: "bed-check",
    options: { width: 210, height: 28, radius: "auto", strength: 0.05, curvature: 0.9, depth: 8, glow: 0.4, edgeHighlight: 0.6 },
  },
  {
    name: "Bevelled slab",
    code: "big depth, no dome",
    bed: "bed-chart",
    options: { width: 170, height: 130, radius: 16, strength: 0.08, curvature: 0.15, splay: 1, depth: 46, glow: 0.2, edgeHighlight: 0.8, chromaticAberration: 0.6 },
  },
];

export function Shapes() {
  return (
    <Section
      id="shapes"
      eyebrow="03 · geometry"
      title="Any shape you can round-rect"
      lede={
        <>
          <code>width</code>, <code>height</code>, <code>radius</code>, <code>curvature</code>,{" "}
          <code>depth</code> and <code>splay</code> between them cover everything from a marble to a
          sheet of window glass. Each of these has <code>draggable</code> set — that's the library's
          own drag, one prop, no handlers.
        </>
      }
    >
      <div className="shapeGrid">
        {SHAPES.map((shape) => (
          <figure className="shapeCard" key={shape.name}>
            <LiquidGlass
              {...shape.options}
              draggable
              shadow="0 0 0 1px var(--lens-rim), 0 10px 30px var(--lens-shadow)"
            >
              <div className={`shapeBed bed ${shape.bed}`}>
                <span className="shapeBedText">GLASS</span>
              </div>
            </LiquidGlass>
            <figcaption>
              <strong>{shape.name}</strong>
              <code>{shape.code}</code>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
