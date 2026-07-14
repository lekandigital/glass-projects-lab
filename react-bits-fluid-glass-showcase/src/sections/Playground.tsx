import { useMemo, useState } from 'react';
import FluidGlass from '@lib/FluidGlass';
import { CodeBlock, CostBadge, Section, Stage } from '../components/ui';
import {
  CONTROLS,
  DEFAULT_NAV_ITEMS,
  DEMO_CONFIGS,
  PLAYGROUND_INITIAL,
  type ControlSpec,
  type Cost,
  type Mode,
  type ModeProps
} from '../lib/config';

const GROUPS: Array<{ cost: Cost; title: string; note: string }> = [
  { cost: 'remount', title: 'Remount', note: 'New GLB + new Canvas. Needs a fresh key.' },
  { cost: 'perframe', title: 'Per-frame', note: "Read inside FluidGlass's own useFrame." },
  { cost: 'recompile', title: 'Recompile', note: 'Shader defines and render targets. Rebuilds the program.' },
  { cost: 'uniform', title: 'Uniform', note: 'Plain material uniforms. Free to change every frame.' }
];

type State = Record<string, number | string | boolean>;

const INITIAL: State = {
  mode: PLAYGROUND_INITIAL.mode,
  ...(PLAYGROUND_INITIAL.props as State),
  transmission: 1,
  roughness: 0,
  distortion: 0,
  distortionScale: 0.5,
  temporalDistortion: 0,
  clearcoat: 0,
  attenuationDistance: 1,
  color: '#ffffff',
  attenuationColor: '#ffffff',
  samples: 10,
  resolution: 256,
  backside: false
};

/** Props the caller didn't touch are left out entirely, so FluidGlass's own `??` defaults win. */
const DIRTY_ONLY = new Set([
  'transmission',
  'roughness',
  'distortion',
  'distortionScale',
  'temporalDistortion',
  'clearcoat',
  'attenuationDistance',
  'color',
  'attenuationColor',
  'samples',
  'resolution',
  'backside'
]);

function fmt(v: unknown): string {
  if (typeof v === 'string') return `'${v}'`;
  if (typeof v === 'number') return String(Number(v.toFixed(3)));
  return String(v);
}

export default function Playground({ backdrop }: { backdrop: string }) {
  const [state, setState] = useState<State>(INITIAL);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [autoScale, setAutoScale] = useState(false);
  const [live, setLive] = useState(false);

  const mode = state.mode as Mode;
  const set = (k: string, v: number | string | boolean) => {
    setState(s => ({ ...s, [k]: v }));
    setTouched(t => new Set(t).add(k));
  };

  const modeProps: ModeProps = useMemo(() => {
    const p: ModeProps = {};
    for (const c of CONTROLS) {
      if (c.key === 'mode') continue;
      if (c.key === 'scale' && autoScale) continue;
      if (DIRTY_ONLY.has(c.key) && !touched.has(c.key)) continue;
      p[c.key] = state[c.key];
    }
    if (mode === 'bar') p.navItems = DEFAULT_NAV_ITEMS;
    return p;
  }, [state, touched, autoScale, mode]);

  const code = useMemo(() => {
    const entries = Object.entries(modeProps).filter(([k]) => k !== 'navItems');
    const body = entries.map(([k, v]) => `    ${k}: ${fmt(v)}`).join(',\n');
    const nav =
      mode === 'bar'
        ? `,\n    navItems: [\n${DEFAULT_NAV_ITEMS.map(n => `      { label: '${n.label}', link: '${n.link}' }`).join(',\n')}\n    ]`
        : '';
    return `import FluidGlass from './FluidGlass';

<FluidGlass
  mode="${mode}"
  ${mode}Props={{
${body}${nav}
  }}
/>`;
  }, [modeProps, mode]);

  const reset = () => {
    setState(INITIAL);
    setTouched(new Set());
    setAutoScale(false);
  };

  const applyPreset = (key: string) => {
    const cfg = DEMO_CONFIGS[key];
    const next: State = { ...INITIAL, mode: cfg.mode };
    const t = new Set<string>();
    for (const [k, v] of Object.entries(cfg.props)) {
      if (k === 'navItems') continue;
      next[k] = v as number | string | boolean;
      t.add(k);
    }
    setState(next);
    setTouched(t);
    setAutoScale(false);
  };

  return (
    <Section
      id="s1"
      num={1}
      title="Playground"
      lede={
        <>
          Every knob FluidGlass will actually forward — including the ten its own demo hides, because anything that
          isn't <code>navItems</code> gets spread straight into <code>MeshTransmissionMaterial</code>. Controls are
          grouped by what a change costs, which is a real distinction here: <code>mode</code> can't be changed without a
          remount, <code>samples</code> rebuilds the shader, and everything green is a uniform you could animate at
          60fps.
        </>
      }
    >
      <div className="play">
        <div>
          <Stage
            className={`play__stage bd bd--${backdrop}`}
            active={live}
            onActivate={() => setLive(true)}
            tag={`mode="${mode}"`}
            eager
          >
            <FluidGlass
              key={mode}
              mode={mode}
              lensProps={mode === 'lens' ? modeProps : {}}
              barProps={mode === 'bar' ? modeProps : {}}
              cubeProps={mode === 'cube' ? modeProps : {}}
            />
          </Stage>

          <div className="note">
            <span>⚠</span>
            <span>
              The backdrop picker doesn't reach this canvas, and that's the finding, not a bug:{' '}
              <code>ModeWrapper</code> calls <code>gl.setClearColor(0x5227ff, 1)</code> on <em>every frame</em>, so the
              background is unthemeable from outside. Sections 2 and 5 rebuild the pipeline by hand and do respect it.
            </span>
          </div>

          <CodeBlock code={code} />
        </div>

        <aside className="panel card">
          <div className="ctl__row" style={{ marginBottom: 16 }}>
            <strong style={{ fontSize: 13 }}>Controls</strong>
            <button className="btn btn--ghost" onClick={reset} data-testid="reset">
              Reset
            </button>
          </div>

          <div className="panel__group">
            <div className="panel__grouphead">
              <strong style={{ fontSize: 12 }}>Presets</strong>
              <span className="panel__groupnote">from DEMO_CONFIGS</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Object.entries(DEMO_CONFIGS)
                .filter(([k]) => k !== 'productNav')
                .map(([k, c]) => (
                  <button key={k} className="btn" onClick={() => applyPreset(k)} data-testid={`preset-${k}`}>
                    {c.label.replace(/ \(upstream default\)/, '')}
                  </button>
                ))}
            </div>
          </div>

          {GROUPS.map(g => {
            const items = CONTROLS.filter(c => c.cost === g.cost);
            if (!items.length) return null;
            return (
              <div className="panel__group" key={g.cost}>
                <div className="panel__grouphead">
                  <CostBadge cost={g.cost} />
                  <span className="panel__groupnote">{g.note}</span>
                </div>
                {items.map(c => (
                  <Control
                    key={c.key}
                    spec={c}
                    value={state[c.key]}
                    mode={mode}
                    autoScale={autoScale}
                    onAutoScale={setAutoScale}
                    onChange={v => set(c.key, v)}
                  />
                ))}
              </div>
            );
          })}
        </aside>
      </div>
    </Section>
  );
}

function Control({
  spec,
  value,
  mode,
  autoScale,
  onAutoScale,
  onChange
}: {
  spec: ControlSpec;
  value: number | string | boolean;
  mode: Mode;
  autoScale: boolean;
  onAutoScale: (v: boolean) => void;
  onChange: (v: number | string | boolean) => void;
}) {
  const inactive = spec.modes ? !spec.modes.includes(mode) : false;
  const isScale = spec.key === 'scale';
  const disabled = inactive || (isScale && autoScale);

  return (
    <div className={`ctl ${disabled ? 'ctl--off' : ''}`}>
      <div className="ctl__row">
        <label className="ctl__label" htmlFor={`c-${spec.key}`} title={spec.hint}>
          {spec.label}
        </label>
        {spec.kind === 'range' && <span className="ctl__val">{isScale && autoScale ? 'auto' : String(value)}</span>}
      </div>

      {spec.kind === 'select' && (
        <div className="seg" style={{ marginTop: 4, width: '100%' }}>
          {spec.options!.map(o => (
            <button
              key={o}
              className={`btn ${value === o ? 'btn--active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => onChange(o)}
              data-testid={`mode-${o}`}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {spec.kind === 'range' && (
        <input
          id={`c-${spec.key}`}
          data-testid={`c-${spec.key}`}
          type="range"
          min={spec.min}
          max={spec.max}
          step={spec.step}
          value={Number(value)}
          disabled={disabled}
          onChange={e => onChange(Number(e.target.value))}
        />
      )}

      {spec.kind === 'color' && (
        <input
          id={`c-${spec.key}`}
          data-testid={`c-${spec.key}`}
          type="color"
          value={String(value)}
          onChange={e => onChange(e.target.value)}
        />
      )}

      {spec.kind === 'bool' && (
        <label className="switch" style={{ marginTop: 4 }}>
          <input
            id={`c-${spec.key}`}
            data-testid={`c-${spec.key}`}
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => onChange(e.target.checked)}
          />
          {String(Boolean(value))}
        </label>
      )}

      {isScale && (
        <label className="switch" style={{ marginTop: 6 }}>
          <input
            type="checkbox"
            checked={autoScale}
            onChange={e => onAutoScale(e.target.checked)}
            data-testid="c-autoscale"
          />
          omit scale → auto-fit
        </label>
      )}

      <p className="ctl__hint">{spec.hint}</p>
    </div>
  );
}
