import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { LiquidGlass, type LiquidGlassHandle, type LiquidGlassOptions } from "liquid-glass-web-react";

/**
 * A lens that floats over a whole region of the page.
 *
 * `<LiquidGlass draggable>` captures the pointer anywhere in the container,
 * which would swallow clicks on the content underneath. So instead of the
 * built-in drag, this drives the lens through the imperative handle and puts
 * an invisible round "grip" exactly on top of it: only the glass itself grabs
 * the pointer, the rest of the section stays fully interactive.
 *
 * It also shows the two cheap paths in action — `setPosition` per frame (never
 * re-renders React, never regenerates the map) for both dragging and the idle
 * wander, and `engine.setOptions` for the squish-on-grab feel.
 */
export function GripLens({
  options,
  size,
  initial = { x: 0.5, y: 0.5 },
  idleWander = false,
  followMouse = false,
  bleed = 0,
  shadow,
  onMove,
  children,
}: {
  options: Partial<LiquidGlassOptions>;
  size: number;
  initial?: { x: number; y: number };
  idleWander?: boolean;
  followMouse?: boolean;
  /** Pads the filtered box so refraction near the edge doesn't clip. */
  bleed?: number | { x: number; y: number };
  shadow?: string;
  onMove?: (x: number, y: number) => void;
  children: ReactNode;
}) {
  const bleedX = typeof bleed === "number" ? bleed : bleed.x;
  const bleedY = typeof bleed === "number" ? bleed : bleed.y;
  const lensRef = useRef<LiquidGlassHandle>(null);
  const gripRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(initial);
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const dragRef = useRef({ active: false, ox: 0, oy: 0 });
  const idleRef = useRef({ stopped: false, raf: 0, vx: 0.03, vy: 0.024 });
  const moveRef = useRef(onMove);
  moveRef.current = onMove;

  const place = (fx: number, fy: number) => {
    const el = lensRef.current?.element;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const half = sizeRef.current / 2;
    if (r.width > sizeRef.current) {
      const m = half / r.width;
      fx = Math.min(1 - m, Math.max(m, fx));
    }
    if (r.height > sizeRef.current) {
      const m = half / r.height;
      fy = Math.min(1 - m, Math.max(m, fy));
    }
    lensRef.current?.setPosition(fx, fy);
    const pos = lensRef.current?.engine?.getPosition() ?? { x: fx, y: fy };
    posRef.current = pos;
    moveRef.current?.(pos.x, pos.y);
    const grip = gripRef.current;
    if (grip) {
      grip.style.transform = `translate(${pos.x * r.width - half}px, ${pos.y * r.height - half}px)`;
    }
  };

  useLayoutEffect(() => {
    place(posRef.current.x, posRef.current.y);
    const el = lensRef.current?.element;
    if (!el) return;
    const ro = new ResizeObserver(() => place(posRef.current.x, posRef.current.y));
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // Drift and bounce until someone grabs it.
  useEffect(() => {
    if (!idleWander || idleRef.current.stopped) return;
    const idle = idleRef.current;
    let last = performance.now();
    const tick = (now: number) => {
      if (idle.stopped) return;
      const el = lensRef.current?.element;
      const dt = Math.min(50, now - last);
      last = now;
      if (el && !dragRef.current.active) {
        const r = el.getBoundingClientRect();
        const half = sizeRef.current / 2;
        const minX = half;
        const maxX = r.width - half;
        const minY = half;
        const maxY = r.height - half;
        if (maxX > minX && maxY > minY) {
          let cx = posRef.current.x * r.width + idle.vx * dt;
          let cy = posRef.current.y * r.height + idle.vy * dt;
          if (cx >= maxX) (cx = maxX), (idle.vx = -Math.abs(idle.vx));
          else if (cx <= minX) (cx = minX), (idle.vx = Math.abs(idle.vx));
          if (cy >= maxY) (cy = maxY), (idle.vy = -Math.abs(idle.vy));
          else if (cy <= minY) (cy = minY), (idle.vy = Math.abs(idle.vy));
          place(cx / r.width, cy / r.height);
        }
      }
      idle.raf = requestAnimationFrame(tick);
    };
    idle.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(idle.raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleWander]);

  useEffect(() => {
    if (!followMouse) return;
    let raf = 0;
    let pending: { x: number; y: number } | null = null;
    const onPointerMove = (e: PointerEvent) => {
      const el = lensRef.current?.element;
      if (!el) return;
      const r = el.getBoundingClientRect();
      pending = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (pending) place(pending.x, pending.y);
        });
      }
    };
    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followMouse]);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = lensRef.current?.element;
    if (!el) return;
    idleRef.current.stopped = true;
    cancelAnimationFrame(idleRef.current.raf);
    const r = el.getBoundingClientRect();
    dragRef.current = {
      active: true,
      ox: (e.clientX - r.left) / r.width - posRef.current.x,
      oy: (e.clientY - r.top) / r.height - posRef.current.y,
    };
    gripRef.current?.setPointerCapture(e.pointerId);
    gripRef.current?.classList.add("dragging");
    e.preventDefault();
  };

  const raf = useRef(0);
  const pending = useRef<{ x: number; y: number } | null>(null);

  const onDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const el = lensRef.current?.element;
    if (!el) return;
    const r = el.getBoundingClientRect();
    pending.current = {
      x: (e.clientX - r.left) / r.width - dragRef.current.ox,
      y: (e.clientY - r.top) / r.height - dragRef.current.oy,
    };
    // pointermove can outrun the display; coalesce to one filter update a frame.
    if (!raf.current) {
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        const p = pending.current;
        if (p && dragRef.current.active) place(p.x, p.y);
      });
    }
  };

  const onUp = () => {
    dragRef.current.active = false;
    gripRef.current?.classList.remove("dragging");
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const hasBleed = bleedX > 0 || bleedY > 0;

  return (
    <div className="gripWrap" style={hasBleed ? { margin: `${-bleedY}px ${-bleedX}px` } : undefined}>
      <LiquidGlass
        ref={lensRef}
        width={size}
        height={size}
        {...options}
        shadow={shadow ?? "0 0 0 1px var(--lens-rim), 0 18px 50px var(--lens-shadow)"}
      >
        {/* Bleed lives inside the filtered element so the filter's coordinate
            space and the engine's measurements stay in sync. */}
        {hasBleed ? <div style={{ padding: `${bleedY}px ${bleedX}px` }}>{children}</div> : children}
      </LiquidGlass>
      <div
        ref={gripRef}
        className="grip"
        style={{
          width: size,
          height: size,
          borderRadius: options.radius === "auto" || options.radius === undefined ? "50%" : options.radius,
          pointerEvents: followMouse ? "none" : "auto",
        }}
        onPointerDown={onDown}
        onPointerMove={onDrag}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
    </div>
  );
}
