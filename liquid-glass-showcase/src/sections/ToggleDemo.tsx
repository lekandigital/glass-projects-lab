import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LiquidGlass, type LiquidGlassHandle } from "liquid-glass-web-react";
import { Section } from "../components";

/* ------------------------------------------------------------------ *
 * The upstream demo's toggle group, ported as-is: same `.toggleWrap` /
 * `.toggle` markup, same pill, same spring, same drag-to-nearest-option,
 * same press response (strength and chroma deepen while the glass is
 * held, and ease back on release). Nothing here is a variation on it.
 * ------------------------------------------------------------------ */

const OPTIONS = ["Hubs", "Spokes", "Reserves", "Assets", "Chains"];

export function ToggleDemo() {
  const [selected, setSelected] = useState(0);
  const lensRef = useRef<LiquidGlassHandle>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [lensWidth, setLensWidth] = useState(104);
  const animRef = useRef({ x: 0, v: 0, target: 0, raf: 0, settled: false });
  const dragRef = useRef({ active: false, movedPx: 0, offset: 0 });

  // Buttons are content-sized, so the lens follows their measured centers
  // rather than assuming equal widths.
  const measureCenters = () => {
    const container = lensRef.current?.element;
    const group = groupRef.current;
    if (!container || !group) return null;
    const crect = container.getBoundingClientRect();
    if (crect.width <= 0) return null;
    return Array.from(group.querySelectorAll("button")).map((button) => {
      const r = button.getBoundingClientRect();
      return {
        x: (r.left + r.width / 2 - crect.left) / crect.width,
        width: Math.round(r.width) + 8,
      };
    });
  };

  const startSpring = (target: number) => {
    const a = animRef.current;
    a.target = target;
    cancelAnimationFrame(a.raf);
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // critically damped-ish spring
      const k = 170;
      const damping = 20;
      a.v += (k * (a.target - a.x) - damping * a.v) * dt;
      a.x += a.v * dt;
      lensRef.current?.setPosition(a.x, 0.5);
      if (Math.abs(a.target - a.x) > 0.0005 || Math.abs(a.v) > 0.001) {
        a.raf = requestAnimationFrame(tick);
      } else {
        lensRef.current?.setPosition(a.target, 0.5);
      }
    };
    a.raf = requestAnimationFrame(tick);
  };

  useLayoutEffect(() => {
    const a = animRef.current;
    const centers = measureCenters();
    const target = centers?.[selected];
    if (!target) return;
    setLensWidth(target.width);

    if (!a.settled) {
      // First layout: snap into place, no spring.
      a.settled = true;
      a.x = target.x;
      a.target = target.x;
      lensRef.current?.setPosition(target.x, 0.5);
      return;
    }
    startSpring(target.x);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => () => cancelAnimationFrame(animRef.current.raf), []);

  // Keep the lens on its option across resizes.
  useEffect(() => {
    const onResize = () => {
      const target = measureCenters()?.[selected];
      if (!target) return;
      const a = animRef.current;
      a.target = target.x;
      a.x = target.x;
      a.v = 0;
      setLensWidth(target.width);
      lensRef.current?.setPosition(target.x, 0.5);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // While the glass is held, the refraction deepens and the chromatic
  // fringe widens; both ease back on release.
  const REST_GLASS = { strength: 0.02, chromaticAberration: 0.25 };
  const DRAG_GLASS = { strength: 0.042, chromaticAberration: 0.65 };
  const fxRef = useRef({ raf: 0, ...REST_GLASS });

  const animateGlass = (target: typeof REST_GLASS) => {
    const fx = fxRef.current;
    cancelAnimationFrame(fx.raf);
    const tick = () => {
      fx.strength += (target.strength - fx.strength) * 0.18;
      fx.chromaticAberration += (target.chromaticAberration - fx.chromaticAberration) * 0.18;
      const settled =
        Math.abs(target.strength - fx.strength) < 0.0005 &&
        Math.abs(target.chromaticAberration - fx.chromaticAberration) < 0.005;
      if (settled) {
        fx.strength = target.strength;
        fx.chromaticAberration = target.chromaticAberration;
      }
      lensRef.current?.engine?.setOptions({
        strength: fx.strength,
        chromaticAberration: fx.chromaticAberration,
      });
      if (!settled) fx.raf = requestAnimationFrame(tick);
    };
    fx.raf = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(fxRef.current.raf), []);

  // Drag the lens; on release it locks onto the nearest option.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = lensRef.current?.element;
    if (!container) return;
    const crect = container.getBoundingClientRect();
    const fx = (e.clientX - crect.left) / crect.width;
    const a = animRef.current;
    const halfLens = lensWidth / 2 / crect.width;
    if (Math.abs(fx - a.x) > halfLens) return; // only grab the glass itself
    cancelAnimationFrame(a.raf);
    a.v = 0;
    dragRef.current = { active: true, movedPx: 0, offset: fx - a.x };
    e.currentTarget.setPointerCapture(e.pointerId);
    animateGlass(DRAG_GLASS);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const container = lensRef.current?.element;
    const centers = measureCenters();
    if (!container || !centers) return;
    const crect = container.getBoundingClientRect();
    const fx = (e.clientX - crect.left) / crect.width;
    const min = centers[0].x;
    const max = centers[centers.length - 1].x;
    const nx = Math.min(max, Math.max(min, fx - drag.offset));
    drag.movedPx += Math.abs(nx - animRef.current.x) * crect.width;
    animRef.current.x = nx;
    lensRef.current?.setPosition(nx, 0.5);
  };

  const handlePointerEnd = () => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    animateGlass(REST_GLASS);
    const centers = measureCenters();
    if (!centers) return;
    const a = animRef.current;
    let nearest = 0;
    for (let i = 1; i < centers.length; i++) {
      if (Math.abs(centers[i].x - a.x) < Math.abs(centers[nearest].x - a.x)) nearest = i;
    }
    if (nearest !== selected) setSelected(nearest); // layout effect springs it home
    else startSpring(centers[nearest].x);
  };

  // A real drag shouldn't also count as a click on whatever button is under
  // the pointer when it's released.
  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current.movedPx > 4) {
      e.preventDefault();
      e.stopPropagation();
    }
    dragRef.current.movedPx = 0;
  };

  return (
    <Section
      id="toggle"
      eyebrow="07 · the original"
      title="As a component primitive"
      lede={
        <>
          The upstream demo's toggle group, ported unchanged — same <code>.toggleWrap</code>, same
          spring, same drag-to-the-nearest-option. The glass <em>is</em> the selection indicator:
          click an option or drag the lens and it locks onto the nearest one. Hold it to feel the
          press response.
        </>
      }
    >
      <div className="toggleWrap">
        <LiquidGlass
          ref={lensRef}
          y={0.5}
          width={lensWidth}
          height={46}
          strength={REST_GLASS.strength}
          chromaticAberration={REST_GLASS.chromaticAberration}
          curvature={0.85}
          depth={8}
          glow={0.15}
          edgeHighlight={0.35}
          shadow="0 0 0 1px rgba(255,255,255,0.14), 0 4px 14px rgba(0,0,0,0.45)"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onClickCapture={handleClickCapture}
        >
          <div className="toggle" ref={groupRef}>
            {OPTIONS.map((label, i) => (
              <button key={label} aria-pressed={i === selected} onClick={() => setSelected(i)}>
                {label}
              </button>
            ))}
          </div>
        </LiquidGlass>
      </div>
    </Section>
  );
}
