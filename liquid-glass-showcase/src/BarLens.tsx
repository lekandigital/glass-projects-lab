import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { LiquidGlass, type LiquidGlassHandle, type LiquidGlassOptions } from "liquid-glass-web-react";
import { ToggleWrapBar } from "./components";
import { DockRow, TabRow, type Backdrop } from "./rows";

export type BarKind = "toggleWrap" | "tabBar" | "dock";

/**
 * The upstream toggle's motion, generalised to all three bars.
 *
 * The lens is *not* free to roam: its y is pinned to the bar's own centre line
 * (measured, so it survives resizes and any substrate behind it) and its x is
 * clamped to the span between the first and last item. Click an item and it
 * springs there; drag it and it follows your pointer along the bar, then locks
 * onto the nearest item on release. Exactly the feel of the library's demo —
 * a selection indicator, not a floating magnifier.
 *
 * Everything else about the lens (its size, refraction, glow…) comes from
 * `options`, so the playground's sliders still drive it.
 */
export function BarLens({
  kind,
  options,
  backdrop,
  background,
  vars,
  glideOnHover = false,
  shadow = "0 0 0 1px var(--lens-rim), 0 8px 22px var(--lens-shadow)",
  onSelect,
}: {
  kind: BarKind;
  options: Partial<LiquidGlassOptions>;
  backdrop: Backdrop;
  /** What sits under the bar — a substrate, a flat field, anything. */
  background?: ReactNode;
  /**
   * Vars for the bar to inherit. The frosted toggle inks itself from --flat-ink,
   * which otherwise falls back to the *page* theme — and a substrate is free to
   * be dark on a light page (the grid is), which would leave the labels black on
   * black. A substrate that knows its own ink passes it in here.
   */
  vars?: CSSProperties;
  /** The dock glides to the hovered icon, like the real thing. */
  glideOnHover?: boolean;
  shadow?: string;
  onSelect?: (i: number) => void;
}) {
  const lensRef = useRef<LiquidGlassHandle>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const anim = useRef({ x: 0.5, y: 0.5, v: 0, target: 0.5, raf: 0, settled: false });
  const drag = useRef({ active: false, movedPx: 0, offset: 0 });

  /** Item centres and the bar's centre line, as fractions of the lens container. */
  const geometry = () => {
    const container = lensRef.current?.element;
    const bar = barRef.current;
    if (!container || !bar) return null;
    const cr = container.getBoundingClientRect();
    const br = bar.getBoundingClientRect();
    if (cr.width <= 0 || cr.height <= 0) return null;
    const items = Array.from(bar.querySelectorAll("button")).map((b) => {
      const r = b.getBoundingClientRect();
      return (r.left + r.width / 2 - cr.left) / cr.width;
    });
    if (!items.length) return null;
    return { y: (br.top + br.height / 2 - cr.top) / cr.height, items };
  };

  const place = (x: number) => {
    const g = geometry();
    if (!g) return;
    anim.current.x = x;
    anim.current.y = g.y;
    lensRef.current?.setPosition(x, g.y); // y is pinned to the bar, always
  };

  const spring = (target: number) => {
    const a = anim.current;
    a.target = target;
    cancelAnimationFrame(a.raf);
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      a.v += (170 * (a.target - a.x) - 20 * a.v) * dt; // the demo's spring
      place(a.x + a.v * dt);
      if (Math.abs(a.target - a.x) > 0.0005 || Math.abs(a.v) > 0.001) {
        a.raf = requestAnimationFrame(tick);
      } else {
        place(a.target);
      }
    };
    a.raf = requestAnimationFrame(tick);
  };

  const goTo = (i: number) => {
    const g = geometry();
    if (!g) return;
    const target = g.items[Math.max(0, Math.min(g.items.length - 1, i))];
    const a = anim.current;
    if (!a.settled) {
      // First layout: snap, don't spring in from nowhere.
      a.settled = true;
      a.v = 0;
      a.target = target;
      place(target);
      return;
    }
    spring(target);
  };

  const pick = (i: number) => {
    setSelected(i);
    onSelect?.(i);
    goTo(i);
  };

  // Land on the selected item, and stay on it through resizes and any option
  // change that moves the bar (a taller lens re-centres the whole row).
  useLayoutEffect(() => {
    goTo(selected);
    const container = lensRef.current?.element;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const a = anim.current;
      a.v = 0;
      const g = geometry();
      if (g) place(g.items[selected] ?? a.x);
    });
    ro.observe(container);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, options.width, options.height]);

  useEffect(() => () => cancelAnimationFrame(anim.current.raf), []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = lensRef.current?.element;
    const g = geometry();
    if (!container || !g) return;
    const cr = container.getBoundingClientRect();
    const fx = (e.clientX - cr.left) / cr.width;
    const halfLens = (options.width ?? 160) / 2 / cr.width;
    if (Math.abs(fx - anim.current.x) > halfLens) return; // only the glass itself is grabbable
    cancelAnimationFrame(anim.current.raf);
    anim.current.v = 0;
    drag.current = { active: true, movedPx: 0, offset: fx - anim.current.x };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const container = lensRef.current?.element;
    const g = geometry();
    if (!container || !g) return;
    const cr = container.getBoundingClientRect();
    const fx = (e.clientX - cr.left) / cr.width;
    const min = g.items[0];
    const max = g.items[g.items.length - 1];
    const nx = Math.min(max, Math.max(min, fx - drag.current.offset));
    drag.current.movedPx += Math.abs(nx - anim.current.x) * cr.width;
    place(nx); // x only — y stays on the bar
  };

  const onPointerEnd = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const g = geometry();
    if (!g) return;
    let nearest = 0;
    for (let i = 1; i < g.items.length; i++) {
      if (Math.abs(g.items[i] - anim.current.x) < Math.abs(g.items[nearest] - anim.current.x)) {
        nearest = i;
      }
    }
    setSelected(nearest);
    onSelect?.(nearest);
    spring(g.items[nearest]);
  };

  // A real drag shouldn't also register as a click on the item underneath.
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current.movedPx > 4) {
      e.preventDefault();
      e.stopPropagation();
    }
    drag.current.movedPx = 0;
  };

  return (
    <LiquidGlass
      ref={lensRef}
      {...options}
      shadow={shadow}
      className="barLens"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={onClickCapture}
    >
      <div className="stageContent" style={vars}>
        {background}
        <div className={background ? "stageOverlay" : "barOnly"}>
          {kind === "toggleWrap" && (
            <ToggleWrapBar bare selected={selected} onSelect={pick} innerRef={barRef} />
          )}
          {kind === "tabBar" && (
            <TabRow innerRef={barRef} selected={selected} onSelect={pick} backdrop={backdrop} />
          )}
          {kind === "dock" && (
            <DockRow
              innerRef={barRef}
              backdrop={backdrop}
              onSelect={pick}
              onHover={glideOnHover ? (i) => !drag.current.active && goTo(i) : undefined}
              onLeave={glideOnHover ? () => goTo(selected) : undefined}
            />
          )}
        </div>
      </div>
    </LiquidGlass>
  );
}
