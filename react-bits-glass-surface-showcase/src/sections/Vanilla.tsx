import { useEffect, useRef, useState } from 'react';
import { CodeBlock, Section } from '../components/ui';
import { DEMO_CONFIGS, GLASS_SURFACE_DEFAULTS, type SurfaceProps } from '../lib/config';
import { mountVanillaGlass, type VanillaHandle } from '../lib/vanilla';

const BASE = {
  ...GLASS_SURFACE_DEFAULTS,
  ...DEMO_CONFIGS.upstreamDemo.props,
  width: 340,
  height: 150
} as Required<SurfaceProps> & { width: number; height: number };

const SNIPPET = `const glass = mountVanillaGlass(hostEl, { width: 340, height: 150, ...opts });

glass.update({ distortionScale: -220 });  // no rebuild: the map doesn't read it
glass.update({ blur: 20 });               // rebuild: the map draws with it
glass.regenerations();                    // how many maps were actually built

glass.dispose();                          // disconnects the observer, removes the node`;

export default function Vanilla({ backdrop }: { backdrop: string }) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<VanillaHandle | null>(null);

  const [mounted, setMounted] = useState(true);
  const [distortionScale, setDistortionScale] = useState(BASE.distortionScale);
  const [blur, setBlur] = useState(BASE.blur);
  const [regens, setRegens] = useState(0);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!mounted || !host.current) return;
    const h = mountVanillaGlass(host.current, { ...BASE, distortionScale, blur });
    handle.current = h;
    setSupported(h.supported);

    // Polled, not pushed: the ResizeObserver can rebuild the map without going through
    // update(), and a counter that only counted our own calls would be lying.
    const id = setInterval(() => setRegens(h.regenerations()), 250);
    setRegens(h.regenerations());

    return () => {
      clearInterval(id);
      h.dispose();
      handle.current = null;
    };
    // Intentionally not re-running on slider changes: those go through update(), which is
    // the whole point of the section.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const push = (next: Partial<SurfaceProps>) => handle.current?.update(next);

  return (
    <Section
      id="s5"
      num={5}
      title="Framework-free core"
      lede={
        <>
          There is no non-React build of GlassSurface — and there is no React in the technique either. It is a{' '}
          <code>&lt;div&gt;</code>, an inline <code>&lt;svg&gt;</code> filter, and{' '}
          <code>backdrop-filter: url(#id)</code>. This is the same six-primitive graph built on plain DOM, with the
          component's own <code>generateDisplacementMap</code>. It adds the two things the component doesn't have: a
          real <code>dispose()</code>, and an <code>update()</code> that only rebuilds the map when a prop the map
          actually reads has changed.
        </>
      }
    >
      <div className="play">
        <div>
          <div
            className={`stage bd bd--${backdrop}`}
            style={{ height: 360, display: 'grid', placeItems: 'center' }}
            data-testid="vanilla-stage"
          >
            <span className="stage__tag">no react · dom + svg only</span>
            <div ref={host} className="vhost" />
            {!mounted && <span className="pg__label">disposed — node removed, observer disconnected</span>}
          </div>

          <CodeBlock code={SNIPPET} />
        </div>

        <aside className="panel card">
          <div className="ctl__row" style={{ marginBottom: 16 }}>
            <strong style={{ fontSize: 13 }}>Lifecycle</strong>
            <button
              className={`btn ${mounted ? '' : 'btn--active'}`}
              onClick={() => setMounted(m => !m)}
              data-testid="vanilla-toggle"
            >
              {mounted ? 'dispose()' : 'mount()'}
            </button>
          </div>

          <div className="metrics" style={{ marginTop: 0, marginBottom: 24 }}>
            <div className="metric">
              <div className="metric__k">Maps generated</div>
              <div className="metric__v" data-testid="vanilla-regens">
                {regens}
              </div>
              <div className="metric__sub">since this instance mounted</div>
            </div>
            <div className="metric">
              <div className="metric__k">SVG filter path</div>
              <div className="metric__v" style={{ fontSize: 18 }}>
                {supported ? 'active' : 'fallback'}
              </div>
              <div className="metric__sub">{supported ? 'displacement is real' : 'plain blur only'}</div>
            </div>
          </div>

          <div className="panel__group">
            <div className="panel__grouphead">
              <strong style={{ fontSize: 12 }}>Drag either one</strong>
              <span className="panel__groupnote">watch the counter</span>
            </div>

            <div className="ctl">
              <div className="ctl__row">
                <label className="ctl__label" htmlFor="v-ds">
                  distortionScale
                </label>
                <span className="ctl__val">{distortionScale}</span>
              </div>
              <input
                id="v-ds"
                data-testid="v-distortionScale"
                type="range"
                min={-300}
                max={300}
                step={5}
                value={distortionScale}
                onChange={e => {
                  const v = Number(e.target.value);
                  setDistortionScale(v);
                  push({ distortionScale: v });
                }}
              />
              <p className="ctl__hint">
                The map doesn't read this, so <code>update()</code> skips the rebuild — the counter stays put no matter
                how far you drag. In the React component this same drag regenerates a map per frame.
              </p>
            </div>

            <div className="ctl">
              <div className="ctl__row">
                <label className="ctl__label" htmlFor="v-blur">
                  blur
                </label>
                <span className="ctl__val">{blur}</span>
              </div>
              <input
                id="v-blur"
                data-testid="v-blur"
                type="range"
                min={0}
                max={40}
                step={1}
                value={blur}
                onChange={e => {
                  const v = Number(e.target.value);
                  setBlur(v);
                  push({ blur: v });
                }}
              />
              <p className="ctl__hint">
                The map is drawn with this, so it must rebuild. The counter climbs — as it should. That's the honest
                cost, and the other slider is the one that shouldn't have been paying it.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="note">
        <span>◆</span>
        <span>
          <strong>The component registers two ResizeObservers.</strong> Lines 146–158 and 160–172 of the source are the
          same <code>useEffect</code>, written out twice, each observing the same node and doing the same work. It is
          harmless — but every resize regenerates the map twice, and this core registers one.
        </span>
      </div>
    </Section>
  );
}
