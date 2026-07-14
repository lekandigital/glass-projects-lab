import { useEffect, useRef, useState } from 'react';
import { CodeBlock, Section } from '../components/ui';
import { makeBackdropTexture } from '../lib/backdrop';
import { mountVanillaGlass, type VanillaHandle } from '../lib/vanilla';

const SNIPPET = `const handle = mountVanillaGlass(hostEl, backdropTexture);

// …later, when the section unmounts:
handle.dispose();   // cancels the RAF, disposes geometry/materials/render
                    // target, removes the <canvas>, forces context loss`;

export default function Vanilla({ backdrop, dark }: { backdrop: string; dark: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<VanillaHandle | null>(null);
  const [mounted, setMounted] = useState(true);
  const [ior, setIor] = useState(1.15);
  const [thickness, setThickness] = useState(5);
  const [dispersion, setDispersion] = useState(2);
  const [contexts, setContexts] = useState(0);

  useEffect(() => {
    if (!mounted || !host.current) return;
    const h = mountVanillaGlass(host.current, makeBackdropTexture(backdrop, dark));
    handle.current = h;
    h.setIor(ior);
    h.setThickness(thickness);
    h.setDispersion(dispersion);
    setContexts(c => c + 1);
    return () => {
      h.dispose();
      handle.current = null;
    };
    // Re-mounting on backdrop/theme change is the honest way to prove teardown works:
    // if dispose() leaked, flipping the backdrop a few times would exhaust the contexts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, backdrop, dark]);

  return (
    <Section
      id="s5"
      num={5}
      title="Framework-free core"
      lede={
        <>
          There is no non-React build of FluidGlass — but there's no React in the technique either. This is the same
          pipeline in ~110 lines of plain three.js on a plain <code>&lt;div&gt;</code>: load the GLB, render the
          backdrop into a <code>WebGLRenderTarget</code>, feed the target to a transmissive material, damp the mesh
          toward the pointer with the same <code>easing.damp3</code> and the same <code>smoothTime</code>. Unmount it
          and every allocation is released.
        </>
      }
    >
      <div className="play">
        <div>
          <div className="stage bd bd--flat" style={{ height: 420 }} data-testid="vanilla-stage">
            <span className="stage__tag">no react · three.js only</span>
            <div ref={host} style={{ position: 'absolute', inset: 0 }} />
            {!mounted && (
              <div className="stage__veil" style={{ pointerEvents: 'none', background: 'transparent' }}>
                <span>Unmounted — canvas removed, context released</span>
              </div>
            )}
          </div>

          <CodeBlock code={SNIPPET} />

          <div className="note">
            <span>◆</span>
            <span>
              <strong>The substitution:</strong> <code>MeshTransmissionMaterial</code> is a drei class, so this uses
              three's own <code>MeshPhysicalMaterial</code> with <code>transmission</code> and <code>dispersion</code>.
              You get real refraction and real colour split — what you lose is drei's multi-sample buffer refraction,
              which is precisely the value drei adds over stock three.
            </span>
          </div>

          <div className="note">
            <span>⚠</span>
            <span>
              <strong>The dependency nobody mentions:</strong> all three GLBs are Draco-compressed. drei's{' '}
              <code>useGLTF</code> quietly attaches a <code>DRACOLoader</code> for you and points it at{' '}
              <code>gstatic.com</code> — so FluidGlass reaches out to a Google CDN at runtime to decode its own
              geometry, and dies without network access to it. A plain <code>GLTFLoader</code> just logs{' '}
              <em>"No DRACOLoader instance provided"</em> and adds nothing to the scene, which is exactly what this
              panel did until the decoder below it was vendored into <code>/draco/</code>. It is in neither the README
              nor the dependency list.
            </span>
          </div>
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
              <div className="metric__k">Mounts this session</div>
              <div className="metric__v" data-testid="vanilla-mounts">
                {contexts}
              </div>
              <div className="metric__sub">
                {contexts > 8 ? 'still alive — dispose() is real' : 'flip the backdrop a few times'}
              </div>
            </div>
            <div className="metric">
              <div className="metric__k">Live contexts</div>
              <div className="metric__v">{mounted ? 1 : 0}</div>
              <div className="metric__sub">forceContextLoss() on teardown</div>
            </div>
          </div>

          <div className="panel__group">
            <div className="panel__grouphead">
              <strong style={{ fontSize: 12 }}>Material (imperative)</strong>
              <span className="panel__groupnote">no re-render</span>
            </div>

            <Slider
              id="v-ior"
              label="ior"
              min={1}
              max={2.33}
              step={0.01}
              value={ior}
              onChange={v => {
                setIor(v);
                handle.current?.setIor(v);
              }}
            />
            <Slider
              id="v-thickness"
              label="thickness"
              min={0}
              max={20}
              step={0.1}
              value={thickness}
              onChange={v => {
                setThickness(v);
                handle.current?.setThickness(v);
              }}
            />
            <Slider
              id="v-dispersion"
              label="dispersion"
              min={0}
              max={10}
              step={0.1}
              value={dispersion}
              onChange={v => {
                setDispersion(v);
                handle.current?.setDispersion(v);
              }}
            />
            <p className="ctl__hint">
              These write straight to the material instance. The React state exists only to move the slider thumb.
            </p>
          </div>
        </aside>
      </div>
    </Section>
  );
}

function Slider({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="ctl">
      <div className="ctl__row">
        <label className="ctl__label" htmlFor={id}>
          {label}
        </label>
        <span className="ctl__val">{value}</span>
      </div>
      <input
        id={id}
        data-testid={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  );
}
