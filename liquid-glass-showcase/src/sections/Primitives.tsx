import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LiquidGlass, type LiquidGlassHandle } from "liquid-glass-web-react";
import { Section } from "../components";
import { DEMO_LENSES } from "../glass";
import { BACKDROPS, backdropVars, DockRow, Swatches, TabRow, type Backdrop } from "../rows";

/* ------------------------------------------------------------------ *
 * 1 — Segmented control: the glass *is* the selection indicator.
 * ------------------------------------------------------------------ */

function SegmentedGlass({ backdrop }: { backdrop: Backdrop }) {
  const [selected, setSelected] = useState(0);
  const lens = useRef<LiquidGlassHandle>(null);
  const group = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEMO_LENSES.selection.width);
  const spring = useRef({ x: 0, v: 0, target: 0, raf: 0, settled: false });

  // Buttons are content-sized, so read their real centers instead of assuming
  // equal widths.
  const centers = () => {
    const container = lens.current?.element;
    const el = group.current;
    if (!container || !el) return null;
    const cr = container.getBoundingClientRect();
    if (cr.width <= 0) return null;
    return Array.from(el.querySelectorAll("button")).map((b) => {
      const r = b.getBoundingClientRect();
      return { x: (r.left + r.width / 2 - cr.left) / cr.width, width: Math.round(r.width) + 10 };
    });
  };

  useLayoutEffect(() => {
    const target = centers()?.[selected];
    if (!target) return;
    setWidth(target.width);
    const s = spring.current;
    if (!s.settled) {
      s.settled = true;
      s.x = s.target = target.x;
      lens.current?.setPosition(target.x, 0.5);
      return;
    }
    s.target = target.x;
    cancelAnimationFrame(s.raf);
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.v += (170 * (s.target - s.x) - 20 * s.v) * dt; // critically-damped-ish
      s.x += s.v * dt;
      lens.current?.setPosition(s.x, 0.5);
      if (Math.abs(s.target - s.x) > 0.0005 || Math.abs(s.v) > 0.001) s.raf = requestAnimationFrame(tick);
      else lens.current?.setPosition(s.target, 0.5);
    };
    s.raf = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => () => cancelAnimationFrame(spring.current.raf), []);

  return (
    <div className="primCard">
      <LiquidGlass
        ref={lens}
        y={0.5}
        {...DEMO_LENSES.selection}
        width={width} // measured from the button it landed on
        shadow="0 0 0 1px var(--lens-rim), 0 4px 14px var(--lens-shadow)"
      >
        <div className="flatBed" style={backdropVars(backdrop)}>
          <TabRow innerRef={group} selected={selected} onSelect={setSelected} backdrop={backdrop} />
        </div>
      </LiquidGlass>
      <p className="primNote">
        <strong>Selection indicator.</strong> The lens springs to the clicked tab through{" "}
        <code>setPosition</code>, and its <code>width</code> animates to the button it landed on.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 2 — Dock: the lens snaps to whatever icon you're hovering.
 * ------------------------------------------------------------------ */

function Dock({ backdrop }: { backdrop: Backdrop }) {
  const lens = useRef<LiquidGlassHandle>(null);
  const row = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const anim = useRef({ x: 0.5, raf: 0, target: 0.5 });

  const glide = (target: number) => {
    const a = anim.current;
    a.target = target;
    cancelAnimationFrame(a.raf);
    const tick = () => {
      a.x += (a.target - a.x) * 0.22;
      lens.current?.setPosition(a.x, 0.5);
      if (Math.abs(a.target - a.x) > 0.0008) a.raf = requestAnimationFrame(tick);
      else lens.current?.setPosition(a.target, 0.5);
    };
    a.raf = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const container = lens.current?.element;
    const el = row.current;
    if (!container || !el || hover === null) return;
    const cr = container.getBoundingClientRect();
    const r = el.children[hover].getBoundingClientRect();
    glide((r.left + r.width / 2 - cr.left) / cr.width);
  }, [hover]);

  useEffect(() => () => cancelAnimationFrame(anim.current.raf), []);

  return (
    <div className="primCard">
      <LiquidGlass
        ref={lens}
        y={0.5}
        {...DEMO_LENSES.dock}
        specular={hover === null ? 0.5 : 1.2} // lifts on hover — filter-only, so it's free
        shadow="0 0 0 1px var(--lens-rim), 0 8px 22px var(--lens-shadow)"
      >
        <div className="flatBed" style={backdropVars(backdrop)}>
          <DockRow
            innerRef={row}
            backdrop={backdrop}
            onHover={setHover}
            onLeave={() => setHover(null)}
          />
        </div>
      </LiquidGlass>
      <p className="primNote">
        <strong>Dock hover.</strong> One lens, glided to the hovered icon. <code>specular</code>{" "}
        lifts on hover — it's a filter-only option, so that costs nothing.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 3 — Reading glass: a magnifier you drag across live, selectable text.
 * ------------------------------------------------------------------ */

function ReadingGlass() {
  const lens = useRef<LiquidGlassHandle>(null);
  const raf = useRef(0);
  const pending = useRef<{ x: number; y: number } | null>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = lens.current?.element;
    if (!el) return;
    const r = el.getBoundingClientRect();
    pending.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    if (!raf.current) {
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        const p = pending.current;
        if (p) lens.current?.setPosition(p.x, p.y);
      });
    }
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div className="primCard wide">
      <LiquidGlass
        ref={lens}
        {...DEMO_LENSES.reading}
        shadow="0 0 0 1px var(--lens-rim), 0 12px 30px var(--lens-shadow)"
        onPointerMove={onMove}
        style={{ cursor: "crosshair" }}
      >
        <div className="readBed bed">
          <p>
            Move the pointer across this paragraph. The lens follows it, and the text underneath is
            still text — <strong>select it</strong>, copy it, tab to{" "}
            <a href="#top">this link</a> and press enter. Nothing here is a screenshot; the filter
            bends the very pixels the browser painted for the DOM you are reading, which is why the
            selection highlight distorts along with the glyphs.
          </p>
        </div>
      </LiquidGlass>
      <p className="primNote">
        <strong>Follow the cursor.</strong> A full dome (<code>curvature={1}</code>) with a wide{" "}
        <code>depth</code> band reads as a physical magnifier.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 4 — Lenses compose: nest them and each one refracts the output of the
 *     one below, glass included.
 * ------------------------------------------------------------------ */

function NestedLenses() {
  const outer = useRef<LiquidGlassHandle>(null);
  const middle = useRef<LiquidGlassHandle>(null);

  // The two passive lenses drift on their own; the inner one you drag.
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      outer.current?.setPosition(0.28 + 0.16 * Math.sin(t * 0.5), 0.42 + 0.2 * Math.cos(t * 0.37));
      middle.current?.setPosition(0.72 + 0.14 * Math.cos(t * 0.42), 0.6 + 0.18 * Math.sin(t * 0.61));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="primCard wide">
      <LiquidGlass
        ref={outer}
        width={140}
        height={140}
        radius="auto"
        strength={0.08}
        chromaticAberration={0.85}
        curvature={1}
        depth={28}
        glow={0.45}
        edgeHighlight={0.8}
        specularAngle={40}
        shadow="0 0 0 1px var(--lens-rim), 0 12px 30px var(--lens-shadow)"
      >
        <LiquidGlass
          ref={middle}
          width={200}
          height={78}
          radius="auto"
          strength={0.035}
          chromaticAberration={0.2}
          blur={5}
          curvature={0.5}
          depth={14}
          glow={0.3}
          edgeHighlight={0.5}
          specularAngle={200}
          shadow="0 0 0 1px var(--lens-rim), 0 8px 22px var(--lens-shadow)"
        >
          <LiquidGlass
            draggable
            x={0.5}
            y={0.3}
            width={96}
            height={96}
            radius={28}
            strength={0.12}
            chromaticAberration={0.5}
            curvature={0.2}
            depth={40}
            glow={0.2}
            edgeHighlight={0.9}
            specularAngle={300}
            shadow="0 0 0 1px var(--lens-rim), 0 8px 22px var(--lens-shadow)"
          >
            <div className="nestBed">
              <img src="https://picsum.photos/id/1039/1200/700" alt="" />
            </div>
          </LiquidGlass>
        </LiquidGlass>
      </LiquidGlass>
      <p className="primNote">
        <strong>They compose.</strong> Three nested lenses over one photo: the outer two drift on
        their own, the squircle is yours to drag. Each filter's source is the rendered output of the
        one inside it — so where they overlap, glass refracts glass.
      </p>
    </div>
  );
}

export function Primitives() {
  // One backdrop for both rows: the whole point is comparing the same glass
  // across flat fields of very different lightness and hue.
  const [backdrop, setBackdrop] = useState(BACKDROPS[0]);

  return (
    <Section
      id="primitives"
      eyebrow="06 · in real UI"
      title="Where you'd actually put it"
      lede="The lens is not just decoration — it makes a very good selection indicator, dock highlight, magnifier or focus ring, because the thing it highlights stays live underneath it."
    >
      <div className="backdropBar">
        <span className="fieldLabel">Row backdrop — flat, no gradient</span>
        <Swatches value={backdrop} onChange={setBackdrop} />
        <span className="stageNote">
          {backdrop.name}. Watch the specular rim: on a light field it reads as shadow, on a dark
          one as light. Same lens, same numbers.
        </span>
      </div>

      <div className="primGrid">
        <SegmentedGlass backdrop={backdrop} />
        <Dock backdrop={backdrop} />
        <ReadingGlass />
        <NestedLenses />
      </div>
    </Section>
  );
}
