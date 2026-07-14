import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, useFBO, useGLTF } from '@react-three/drei';
import { easing } from 'maath';
import { CostBadge, Section } from '../components/ui';
import { INTERNALS, type Mode } from '../lib/config';
import { makeBackdropTexture } from '../lib/backdrop';

/**
 * FluidGlass exports no pure functions to poke at — so the low-level surface *is*
 * the three pieces of machinery it drives: the offscreen FBO it feeds to the
 * material, the GLB bounding box it measures to auto-scale, and maath's damp3.
 * Each is reproduced here with the component's own constants and its raw output shown.
 */

const MODES: Mode[] = ['lens', 'bar', 'cube'];

useGLTF.preload(INTERNALS.glb.lens);
useGLTF.preload(INTERNALS.glb.bar);
useGLTF.preload(INTERNALS.glb.cube);

export default function Internals({ backdrop, dark }: { backdrop: string; dark: boolean }) {
  return (
    <Section
      id="s2"
      num={2}
      title="Internals"
      lede={
        <>
          FluidGlass has no low-level exports, so its internals are the three mechanisms it drives. All three are
          reproduced here with the component's own constants, wired to the backdrop picker — which the real component
          can't be.
        </>
      }
    >
      <div className="two">
        <FboProbe backdrop={backdrop} dark={dark} />
        <GeometryProbe />
      </div>
      <div className="two" style={{ marginTop: 16 }}>
        <AutoScalePlot dark={dark} />
        <DampPlot dark={dark} />
      </div>
    </Section>
  );
}

/* ── 2a. the render target ─────────────────────────────────────────────── */

function FboScene({ tex, showBuffer }: { tex: THREE.Texture; showBuffer: boolean }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const buffer = useFBO();
  const [scene] = useState(() => new THREE.Scene());
  const { nodes } = useGLTF(INTERNALS.glb.lens) as unknown as { nodes: Record<string, THREE.Mesh> };
  const { viewport: vp } = useThree();

  useFrame((state, delta) => {
    const { gl, viewport, pointer, camera } = state;
    const v = viewport.getCurrentViewport(camera, [0, 0, INTERNALS.meshZ]);

    // The mesh is unmounted in raw-buffer mode, so unlike FluidGlass this can't
    // assume the ref is populated.
    if (mesh.current) {
      easing.damp3(
        mesh.current.position,
        [(pointer.x * v.width) / 2, (pointer.y * v.height) / 2, INTERNALS.meshZ],
        INTERNALS.pointerSmoothTime,
        delta
      );
    }

    gl.setRenderTarget(buffer);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
  });

  const geo = nodes[INTERNALS.geometryKey.lens]?.geometry;

  return (
    <>
      {createPortal(
        <mesh scale={[vp.width, vp.height, 1]}>
          <planeGeometry />
          <meshBasicMaterial map={tex} />
        </mesh>,
        scene
      )}

      {/* Exactly what FluidGlass draws: the render target, blitted to a full-viewport quad. */}
      <mesh scale={[vp.width, vp.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={buffer.texture} transparent />
      </mesh>

      {!showBuffer && (
        <mesh ref={mesh} scale={0.25} rotation-x={Math.PI / 2} geometry={geo}>
          <MeshTransmissionMaterial buffer={buffer.texture} ior={1.15} thickness={5} anisotropy={0.01} chromaticAberration={0.2} />
        </mesh>
      )}
    </>
  );
}

function FboProbe({ backdrop, dark }: { backdrop: string; dark: boolean }) {
  const [showBuffer, setShowBuffer] = useState(false);
  const tex = useMemo(() => makeBackdropTexture(backdrop, dark), [backdrop, dark]);

  return (
    <div className="card">
      <div className="stage" style={{ height: 300, borderRadius: '16px 16px 0 0' }}>
        <span className="stage__tag">{showBuffer ? 'buffer.texture (raw)' : 'buffer.texture → material'}</span>
        <Canvas camera={{ position: INTERNALS.camera.position, fov: INTERNALS.camera.fov }} gl={{ alpha: true }}>
          <FboScene tex={tex} showBuffer={showBuffer} />
        </Canvas>
      </div>
      <div className="gcard__body">
        <div className="gcard__title">
          <span>The render target</span>
          <CostBadge cost="perframe" />
        </div>
        <p className="gcard__note">
          <code>useFBO()</code> allocates an offscreen target. The scene is portalled into a detached{' '}
          <code>THREE.Scene</code>, rendered into that target, then handed to{' '}
          <code>MeshTransmissionMaterial</code> as its <code>buffer</code> — which is why the glass refracts the page
          content and not an environment map. Toggle to see the raw target with the mesh removed.
        </p>
        <button className="btn" onClick={() => setShowBuffer(v => !v)} data-testid="toggle-buffer">
          {showBuffer ? 'Show refracted result' : 'Show raw buffer only'}
        </button>
      </div>
    </div>
  );
}

/* ── 2b. the geometry ModeWrapper measures ─────────────────────────────── */

function Wire({ mode }: { mode: Mode }) {
  const group = useRef<THREE.Group>(null);
  const { nodes } = useGLTF(INTERNALS.glb[mode]) as unknown as { nodes: Record<string, THREE.Mesh> };
  const geo = nodes[INTERNALS.geometryKey[mode]]?.geometry;
  const box = useMemo(() => {
    if (!geo) return null;
    geo.computeBoundingBox();
    return geo.boundingBox!.clone();
  }, [geo]);

  const size = box ? new THREE.Vector3().subVectors(box.max, box.min) : new THREE.Vector3(1, 1, 1);
  const fit = 1.6 / Math.max(size.x, size.y, size.z);

  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = clock.elapsedTime * 0.5;
  });

  return (
    <group ref={group} scale={fit}>
      <mesh geometry={geo}>
        <meshBasicMaterial wireframe color="#5227ff" />
      </mesh>
      {box && <box3Helper args={[box, new THREE.Color('#8a8a96')]} />}
    </group>
  );
}

/** `geo.boundingBox.max.x - geo.boundingBox.min.x` — the exact value ModeWrapper caches. */
function useGeoWidths(): Record<Mode, number> {
  const lens = useGLTF(INTERNALS.glb.lens) as unknown as { nodes: Record<string, THREE.Mesh> };
  const bar = useGLTF(INTERNALS.glb.bar) as unknown as { nodes: Record<string, THREE.Mesh> };
  const cube = useGLTF(INTERNALS.glb.cube) as unknown as { nodes: Record<string, THREE.Mesh> };

  return useMemo(() => {
    const w = (n: Record<string, THREE.Mesh>, k: string) => {
      const geo = n[k]?.geometry;
      if (!geo) return 1;
      geo.computeBoundingBox();
      return geo.boundingBox!.max.x - geo.boundingBox!.min.x || 1;
    };
    return {
      lens: w(lens.nodes, INTERNALS.geometryKey.lens),
      bar: w(bar.nodes, INTERNALS.geometryKey.bar),
      cube: w(cube.nodes, INTERNALS.geometryKey.cube)
    };
  }, [lens, bar, cube]);
}

function GeoReadout() {
  const widths = useGeoWidths();
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('fg:geowidths', { detail: widths }));
  }, [widths]);
  return null;
}

function GeometryProbe() {
  const [mode, setMode] = useState<Mode>('lens');
  const [widths, setWidths] = useState<Record<Mode, number> | null>(null);

  useEffect(() => {
    const on = (e: Event) => setWidths((e as CustomEvent).detail);
    window.addEventListener('fg:geowidths', on);
    return () => window.removeEventListener('fg:geowidths', on);
  }, []);

  return (
    <div className="card">
      <div className="stage" style={{ height: 300, borderRadius: '16px 16px 0 0' }}>
        <span className="stage__tag">
          nodes.{INTERNALS.geometryKey[mode]} · {INTERNALS.glb[mode]}
        </span>
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          <Wire mode={mode} />
          <GeoReadout />
        </Canvas>
      </div>
      <div className="gcard__body">
        <div className="gcard__title">
          <span>The GLB it measures</span>
          <CostBadge cost="remount" />
        </div>
        <p className="gcard__note">
          Each mode is a hardcoded GLB path plus a hardcoded node name. On mount, ModeWrapper calls{' '}
          <code>computeBoundingBox()</code> and caches <code>max.x − min.x</code>. Those are the real numbers, read from
          the real files:
        </p>
        <div className="seg" style={{ marginBottom: 12 }}>
          {MODES.map(m => (
            <button
              key={m}
              className={`btn ${mode === m ? 'btn--active' : ''}`}
              onClick={() => setMode(m)}
              data-testid={`geo-${m}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>mode</th>
                <th>node</th>
                <th>geoWidth</th>
              </tr>
            </thead>
            <tbody>
              {MODES.map(m => (
                <tr key={m}>
                  <td>
                    <code>{m}</code>
                  </td>
                  <td>
                    <code>{INTERNALS.geometryKey[m]}</code>
                  </td>
                  <td className="mono" data-testid={`geowidth-${m}`}>
                    {widths ? widths[m].toFixed(4) : '…'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── 2c + 2d. the two formulas, plotted from the real code ─────────────── */

function usePlot(draw: (g: CanvasRenderingContext2D, w: number, h: number, css: (v: string) => string) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, devicePixelRatio);
    const w = 560;
    const h = 260;
    c.width = w * dpr;
    c.height = h * dpr;
    const g = c.getContext('2d')!;
    g.scale(dpr, dpr);
    g.clearRect(0, 0, w, h);
    const cs = getComputedStyle(document.documentElement);
    draw(g, w, h, v => cs.getPropertyValue(v).trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/** min(0.15, viewportWidth * 0.9 / geoWidth) — ModeWrapper's auto-fit, run across widths. */
function AutoScalePlot({ dark }: { dark: boolean }) {
  const [geoWidth, setGeoWidth] = useState(1);
  useEffect(() => {
    const on = (e: Event) => setGeoWidth(((e as CustomEvent).detail as Record<Mode, number>).lens);
    window.addEventListener('fg:geowidths', on);
    return () => window.removeEventListener('fg:geowidths', on);
  }, []);

  const { cap, viewportFraction } = INTERNALS.autoScale;
  /** Below this viewport width the formula finally drops under its own cap. */
  const knee = (cap * geoWidth) / viewportFraction;

  const ref = usePlot(
    (g, w, h, css) => {
      const pad = 40;
      const line = css('--border-strong') || '#999';
      const text = css('--text-dim') || '#666';

      const maxV = 3;
      const maxY = 0.25;
      const X = (v: number) => pad + (v / maxV) * (w - pad - 20);
      const Y = (s: number) => h - pad - (s / maxY) * (h - pad - 20);

      // The band of viewport widths any real aspect ratio produces at z=15.
      g.fillStyle = '#5227ff';
      g.globalAlpha = 0.08;
      g.fillRect(X(1.3), 12, X(3.3) - X(1.3), h - pad - 12);
      g.globalAlpha = 1;

      g.strokeStyle = line;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(pad, 12);
      g.lineTo(pad, h - pad);
      g.lineTo(w - 12, h - pad);
      g.stroke();

      g.setLineDash([4, 4]);
      g.strokeStyle = text;
      g.beginPath();
      g.moveTo(pad, Y(cap));
      g.lineTo(w - 12, Y(cap));
      g.stroke();
      g.setLineDash([]);

      g.strokeStyle = '#5227ff';
      g.lineWidth = 2.5;
      g.beginPath();
      for (let i = 0; i <= 300; i++) {
        const vw = (i / 300) * maxV;
        const s = Math.min(cap, (vw * viewportFraction) / geoWidth);
        i ? g.lineTo(X(vw), Y(s)) : g.moveTo(X(vw), Y(s));
      }
      g.stroke();

      g.fillStyle = text;
      g.font = '11px ui-monospace, monospace';
      g.fillText('scale', 6, 18);
      g.fillText(`cap ${cap}`, w - 62, Y(cap) - 6);
      g.fillText(`knee ${knee.toFixed(2)}`, X(knee) + 4, 26);
      g.fillText('every real viewport lands here', X(1.3) + 6, h - pad - 10);
      g.fillText('viewport width (world units @ z=15)', pad, h - 14);
      g.fillText('0', pad - 8, h - pad + 14);
      g.fillText(String(maxV), w - 20, h - pad + 14);
    },
    [geoWidth, knee, cap, viewportFraction, dark]
  );

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="gcard__title">
        <span>Auto-fit, when you omit scale</span>
        <CostBadge cost="perframe" />
      </div>
      <p className="gcard__note">
        Leave <code>scale</code> out and ModeWrapper recomputes it <em>every frame</em>:{' '}
        <code>
          min({cap}, viewport.width × {viewportFraction} / geoWidth)
        </code>
        . With the measured lens <code>geoWidth</code> = <span className="mono">{geoWidth.toFixed(4)}</span>, the term
        only drops under the cap below a viewport width of <span className="mono">{knee.toFixed(2)}</span> world units —
        and the camera makes the viewport at <code>z=15</code> about <span className="mono">1.3–3.3</span> wide at any
        sane aspect ratio.
      </p>
      <canvas ref={ref} className="plot" style={{ aspectRatio: '560 / 260' }} />
      <p className="ctl__hint" style={{ marginTop: 8 }}>
        <strong>So the branch is effectively dead.</strong> The "responsive" auto-fit resolves to the constant{' '}
        <code>{cap}</code> on every real screen, phone included — the only thing omitting <code>scale</code> buys you is
        a <code>Math.min</code> per frame. If you want the lens to actually track the viewport, you have to pass{' '}
        <code>scale</code> yourself.
      </p>
    </div>
  );
}

/** maath's easing.damp3 — the real function, stepped by hand at a fixed dt. */
function DampPlot({ dark }: { dark: boolean }) {
  const [smoothTime, setSmoothTime] = useState<number>(INTERNALS.pointerSmoothTime);

  const ref = usePlot(
    (g, w, h, css) => {
      const pad = 40;
      const line = css('--border-strong') || '#999';
      const text = css('--text-dim') || '#666';
      const dt = 1 / 60;
      const steps = 90;

      const run = (st: number) => {
        const pos = new THREE.Vector3(0, 0, 0);
        const out: number[] = [];
        for (let i = 0; i < steps; i++) {
          easing.damp3(pos, [1, 0, 0], st, dt);
          out.push(pos.x);
        }
        return out;
      };

      const X = (i: number) => pad + (i / (steps - 1)) * (w - pad - 20);
      const Y = (v: number) => h - pad - v * (h - pad - 24);

      g.strokeStyle = line;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(pad, 12);
      g.lineTo(pad, h - pad);
      g.lineTo(w - 12, h - pad);
      g.stroke();

      g.setLineDash([4, 4]);
      g.strokeStyle = text;
      g.beginPath();
      g.moveTo(pad, Y(1));
      g.lineTo(w - 12, Y(1));
      g.stroke();
      g.setLineDash([]);

      const series: Array<[number, string, number]> = [
        [0.05, text, 1],
        [0.4, text, 1],
        [smoothTime, '#5227ff', 2.5]
      ];
      for (const [st, colour, lw] of series) {
        const ys = run(st);
        g.strokeStyle = colour;
        g.globalAlpha = colour === '#5227ff' ? 1 : 0.35;
        g.lineWidth = lw;
        g.beginPath();
        ys.forEach((v, i) => (i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v))));
        g.stroke();
      }
      g.globalAlpha = 1;

      g.fillStyle = text;
      g.font = '11px ui-monospace, monospace';
      g.fillText('pointer target', w - 100, Y(1) - 6);
      g.fillText('frames @ 60fps', pad, h - 14);
      g.fillText('0', pad - 8, h - pad + 14);
    },
    [smoothTime, dark]
  );

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="gcard__title">
        <span>The pointer easing</span>
        <CostBadge cost="perframe" />
      </div>
      <p className="gcard__note">
        <code>easing.damp3</code> from <code>maath</code>, called directly at a fixed{' '}
        <code>dt = 1/60</code> and plotted — the same call FluidGlass makes, with the same hardcoded{' '}
        <code>smoothTime = {INTERNALS.pointerSmoothTime}</code>. It's a critically-damped spring, so it never
        overshoots: that's why the lens never wobbles past the cursor.
      </p>
      <div className="ctl">
        <div className="ctl__row">
          <label className="ctl__label" htmlFor="smoothTime">
            smoothTime
          </label>
          <span className="ctl__val">{smoothTime.toFixed(2)}</span>
        </div>
        <input
          id="smoothTime"
          data-testid="c-smoothtime"
          type="range"
          min={0.02}
          max={0.6}
          step={0.01}
          value={smoothTime}
          onChange={e => setSmoothTime(Number(e.target.value))}
        />
      </div>
      <canvas ref={ref} className="plot" style={{ aspectRatio: '560 / 260' }} />
    </div>
  );
}
