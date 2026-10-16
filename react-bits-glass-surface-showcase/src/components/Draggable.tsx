import { useRef, useState, type PointerEvent, type ReactNode } from 'react';

/**
 * Drag a glass surface anywhere over its stage — the same interaction as the
 * web-glass showcase's Playground (which uses motion's `drag` with
 * `dragConstraints={stageRef}`); this one is plain pointer events, constrained
 * to the nearest `.stage`. Double-click puts it back in the middle.
 */
export function Draggable({ children, testId }: { children: ReactNode; testId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    px: number;
    py: number;
    x: number;
    y: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    const stage = el?.closest('.stage');
    if (!el || !stage || e.button !== 0) return;
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    // bounds for the translation, so the surface never leaves its stage
    drag.current = {
      px: e.clientX,
      py: e.clientY,
      x: pos.x,
      y: pos.y,
      minX: pos.x + (s.left - r.left),
      maxX: pos.x + (s.right - r.right),
      minY: pos.y + (s.top - r.top),
      maxY: pos.y + (s.bottom - r.bottom)
    };
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, Math.min(lo, hi)), Math.max(lo, hi));
    setPos({
      x: clamp(d.x + e.clientX - d.px, d.minX, d.maxX),
      y: clamp(d.y + e.clientY - d.py, d.minY, d.maxY)
    });
  };

  const end = () => {
    drag.current = null;
  };

  return (
    <div
      ref={ref}
      className="draggable"
      data-testid={testId}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={() => setPos({ x: 0, y: 0 })}
      title="drag me · double-click to re-centre"
    >
      {children}
    </div>
  );
}
