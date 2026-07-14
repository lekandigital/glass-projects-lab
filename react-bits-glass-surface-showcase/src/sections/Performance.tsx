import { useCallback, useEffect, useRef, useState } from 'react';
import GlassSurface from '@lib/GlassSurface';
import { CostBadge, Section } from '../components/ui';
import { DEMO_CONFIGS, GLASS_SURFACE_DEFAULTS, type Cost, type SurfaceProps } from '../lib/config';
import { generateDisplacementMap } from '../lib/displacement';
import { mountVanillaGlass, type VanillaHandle } from '../lib/vanilla';

/**
 * GlassSurface has no ref, no forwardRef, no useImperativeHandle — props are the only way
 * in. Which makes the shape of its one effect the entire performance story, because that
 * effect regenerates the displacement map on every prop it depends on, including the seven
 * the map never reads. This measures that rather than asserting it.
 */

const BASE = {
  ...GLASS_SURFACE_DEFAULTS,
  ...DEMO_CONFIGS.upstreamDemo.props,
  width: 150,
  height: 70
} as Required<SurfaceProps> & { width: number; height: number };

type Path = 'css' | 'filter' | 'map' | 'vanilla';

const PATHS: Array<{ id: Path; cost: Cost; label: string; note: string }> = [
  {
    id: 'css',
    cost: 'css',
    label: 'saturation',
    note: "Not in the effect's dependency array, so the effect never runs. One CSS custom property, and nothing else happens."
  },
  {
    id: 'filter',
    cost: 'filter',
    label: 'distortionScale',
    note: 'Should be three setAttribute calls. But it is in the dependency array, and the effect regenerates the map on its first line — so it pays the full image cost for nothing.'
  },
  {
    id: 'map',
    cost: 'map',
    label: 'blur',
    note: 'Genuinely needs a new map — blur is drawn into the SVG — and a wide blur radius is expensive to rasterise on top of that. Slower still, but honestly so: this is work that had to happen.'
  },
  {
    id: 'vanilla',
    cost: 'filter',
    label: 'distortionScale (§5 core)',
    note: 'The same animation on the plain-DOM core from section 5, which rebuilds the map only when a prop the map actually reads has changed. This is what the filter path should have cost all along.'
  }
];

const COUNT = 12;
const SAMPLE_MS = 2000;

type Results = Partial<Record<Path, { fps: number; frames: number }>>;

export default function Performance({ backdrop }: { backdrop: string }) {
  const [active, setActive] = useState<Path>('filter');
  const [results, setResults] = useState<Results>({});
  const [busy, setBusy] = useState<Path | null>(null);
  const [t, setT] = useState(0);
  const frames = useRef(0);
  const activeRef = useRef<Path>(active);
  activeRef.current = active;

  const vanillaHost = useRef<HTMLDivElement>(null);
  const handles = useRef<VanillaHandle[]>([]);
  const [regens, setRegens] = useState(0);

  const path = PATHS.find(p => p.id === active)!;
  const wave = (time: number) => (Math.sin(time * 1.6) + 1) / 2;

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      frames.current++;
      const now = performance.now() / 1000;

      if (activeRef.current === 'vanilla') {
        // Driven imperatively: no React state, no re-render, no reconciliation.
        const v = -300 + wave(now) * 300;
        for (const h of handles.current) h.update({ distortionScale: v });
      } else {
        setT(now);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // The vanilla surfaces exist only while their path is showing, so the two
  // implementations never contend for the main thread during a measurement.
  useEffect(() => {
    if (active !== 'vanilla' || !vanillaHost.current) return;
    const host = vanillaHost.current;

    handles.current = Array.from({ length: COUNT }, () => mountVanillaGlass(host, { ...BASE }));
    const id = setInterval(() => setRegens(handles.current.reduce((n, h) => n + h.regenerations(), 0)), 400);

    return () => {
      clearInterval(id);
      for (const h of handles.current) h.dispose();
      handles.current = [];
    };
  }, [active]);

  /**
   * All three values are continuous, so each one lands on a fresh number every frame. If
   * `blur` were rounded to an integer it would repeat for runs of frames, React would bail
   * out of the re-render, and the map path would look far cheaper than it is — which is the
   * exact trap this measurement exists to avoid.
   */
  const animated = (id: Path, time: number): Partial<SurfaceProps> => {
    const w = wave(time);
    if (id === 'css') return { saturation: 0.2 + w * 2.6 };
    if (id === 'filter') return { distortionScale: -300 + w * 300 };
    if (id === 'map') return { blur: 1 + w * 30 };
    return {};
  };

  const runBench = useCallback(async () => {
    const out: Results = {};
    for (const p of PATHS) {
      setActive(p.id);
      setBusy(p.id);
      // Let the switch commit and the first maps decode before the clock starts.
      await new Promise(r => setTimeout(r, 700));

      const start = performance.now();
      const f0 = frames.current;
      await new Promise(r => setTimeout(r, SAMPLE_MS));
      const elapsed = (performance.now() - start) / 1000;
      const delivered = frames.current - f0;

      out[p.id] = { fps: Math.round(delivered / elapsed), frames: delivered };
      setResults({ ...out });
    }
    setBusy(null);
  }, []);

  const mapBytes = generateDisplacementMap({
    width: BASE.width,
    height: BASE.height,
    borderRadius: BASE.borderRadius,
    borderWidth: BASE.borderWidth,
    brightness: BASE.brightness,
    opacity: BASE.opacity,
    blur: BASE.blur,
    mixBlendMode: BASE.mixBlendMode
  }).length;

  const best = Math.max(...Object.values(results).map(r => r.fps), 1);

  return (
    <Section
      id="s4"
      num={4}
      title="Imperative & performance"
      lede={
        <>
          There is no imperative surface — no ref, no <code>forwardRef</code>, no <code>useImperativeHandle</code>.
          Props are the only way in, and the component's single effect lists <strong>all fifteen</strong> of them as
          dependencies while calling <code>updateDisplacementMap()</code> on its first line. So animating{' '}
          <code>distortionScale</code> — a value the map never reads — rebuilds and re-decodes the map every frame
          anyway. Run the benchmark: {COUNT} surfaces, each path for {SAMPLE_MS / 1000}s. Watch the second bar against
          the first and the fourth: that gap is entirely a rebuild that didn't need to happen.
        </>
      }
    >
      <div className="play">
        <div>
          <div className={`stage bd bd--${backdrop}`} style={{ padding: 20, minHeight: 300 }}>
            <span className="stage__tag">
              animating {path.label} · {COUNT} surfaces
            </span>

            {active === 'vanilla' ? (
              <div className="bench__grid" ref={vanillaHost} data-testid="bench-vanilla" />
            ) : (
              <div className="bench__grid">
                {Array.from({ length: COUNT }, (_, i) => (
                  <GlassSurface key={i} {...BASE} {...animated(active, t)} className="pg__surface">
                    <span className="pg__label" style={{ fontSize: 11 }}>
                      {i + 1}
                    </span>
                  </GlassSurface>
                ))}
              </div>
            )}
          </div>

          <div className="note">
            <span>⚠</span>
            <span>
              Each map is <strong>{(mapBytes / 1024).toFixed(1)} KB</strong> of percent-encoded SVG. On both the{' '}
              <code>filter</code> and <code>map</code> paths that string is rebuilt, re-encoded and re-decoded{' '}
              <strong>{COUNT}× per frame</strong> — around {((mapBytes * COUNT * 60) / 1024 / 1024).toFixed(1)} MB/s of
              throwaway data URIs at 60fps. For <code>blur</code> that is necessary. For <code>distortionScale</code> it
              is pure waste, and it is the entire gap between the second and fourth bars.
              {active === 'vanilla' && (
                <>
                  {' '}
                  <strong className="mono" data-testid="vanilla-regens">
                    {regens} regenerations
                  </strong>{' '}
                  so far across {COUNT} surfaces — one each at mount, and no more.
                </>
              )}
            </span>
          </div>
        </div>

        <aside className="panel card">
          <div className="ctl__row" style={{ marginBottom: 16 }}>
            <strong style={{ fontSize: 13 }}>Benchmark</strong>
            <button className="btn btn--active" onClick={runBench} disabled={!!busy} data-testid="run-bench">
              {busy ? `Measuring ${busy}…` : 'Run'}
            </button>
          </div>

          <p className="ctl__hint" style={{ marginBottom: 16 }}>
            Counts the frames the browser actually delivered while each path animates {COUNT} surfaces.
          </p>

          {PATHS.map(p => {
            const r = results[p.id];
            return (
              <div className="panel__group" key={p.id}>
                <div className="panel__grouphead">
                  <CostBadge cost={p.cost} />
                  <span className="panel__groupnote mono" style={{ fontSize: 11 }}>
                    {p.label}
                  </span>
                  <button
                    className={`btn ${active === p.id ? 'btn--active' : ''}`}
                    style={{ marginLeft: 'auto', padding: '2px 8px' }}
                    onClick={() => setActive(p.id)}
                    data-testid={`path-${p.id}`}
                  >
                    show
                  </button>
                </div>

                <div className="bench__bar">
                  <div
                    className="bench__fill"
                    data-cost={p.cost}
                    style={{ width: r ? `${(r.fps / best) * 100}%` : '0%' }}
                  />
                </div>
                <div className="ctl__row" style={{ marginTop: 4 }}>
                  <span className="ctl__val" data-testid={`fps-${p.id}`}>
                    {r ? `${r.fps} fps` : '—'}
                  </span>
                  <span className="ctl__val">{r ? `${r.frames} frames` : ''}</span>
                </div>
                <p className="ctl__hint">{p.note}</p>
              </div>
            );
          })}
        </aside>
      </div>
    </Section>
  );
}
