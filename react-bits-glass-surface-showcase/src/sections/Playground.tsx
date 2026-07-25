import { useMemo, useState } from 'react';
import GlassSurface from '@lib/GlassSurface';
import { BackdropVideo, CodeBlock, CostBadge, Section } from '../components/ui';
import {
  CONTROLS,
  DEMO_CONFIGS,
  GLASS_SURFACE_DEFAULTS,
  PLAYGROUND_INITIAL,
  type ControlSpec,
  type Cost,
  type SurfaceProps
} from '../lib/config';

const GROUPS: Array<{ cost: Cost; title: string; note: string }> = [
  { cost: 'map', title: 'Regenerates the map', note: 'Rebuilds the SVG string and swaps the feImage href.' },
  { cost: 'filter', title: 'Filter attribute', note: 'setAttribute on a live primitive. No new image.' },
  { cost: 'css', title: 'CSS variable', note: "A custom property on the container. The filter graph isn't touched." }
];

type State = Required<SurfaceProps>;

const INITIAL = { ...GLASS_SURFACE_DEFAULTS, ...PLAYGROUND_INITIAL.props } as State;

function fmt(v: unknown): string {
  return typeof v === 'string' ? `"${v}"` : String(v);
}

export default function Playground({ backdrop }: { backdrop: string }) {
  const [state, setState] = useState<State>(INITIAL);

  const set = (k: keyof State, v: number | string) => setState(s => ({ ...s, [k]: v }) as State);

  /** Only props that differ from the component's own defaults are emitted. */
  const code = useMemo(() => {
    const entries = (Object.keys(state) as Array<keyof State>)
      .filter(k => state[k] !== GLASS_SURFACE_DEFAULTS[k])
      .map(k => `  ${k}={${fmt(state[k])}}`);

    return `import GlassSurface from './GlassSurface';

<GlassSurface
${entries.join('\n')}
>
  Content
</GlassSurface>`;
  }, [state]);

  return (
    <Section
      id="s1"
      num={1}
      title="Playground"
      lede={
        <>
          All seventeen visual props, live. They're grouped by the path they take through the component, which is the
          distinction that actually matters: red props rebuild an SVG image from scratch and force the browser to decode
          it, blue props poke a single attribute on a filter that's already running, and green props never touch the
          filter at all. Section 4 measures what that costs.
        </>
      }
    >
      <div className="play">
        <div>
          {/* GlassSurface doesn't spread unknown props onto its root, so the hook for tests
              has to go through className — the one escape hatch it does offer. */}
          <div className={`stage play__stage bd bd--${backdrop}`} data-testid="pg-stage">
            {backdrop === 'video' && <BackdropVideo />}
            <GlassSurface {...state} className="pg__surface">
              <span className="pg__label">GlassSurface</span>
            </GlassSurface>
          </div>

          <CodeBlock code={code} />
        </div>

        <aside className="panel card">
          <div className="ctl__row" style={{ marginBottom: 16 }}>
            <strong style={{ fontSize: 13 }}>Controls</strong>
            <button className="btn btn--ghost" onClick={() => setState(INITIAL)} data-testid="reset">
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
                .filter(([k]) => k !== 'appChrome')
                .map(([k, c]) => (
                  <button
                    key={k}
                    className="btn"
                    data-testid={`preset-${k}`}
                    onClick={() => setState({ ...GLASS_SURFACE_DEFAULTS, ...c.props } as State)}
                  >
                    {c.label}
                  </button>
                ))}
            </div>
          </div>

          {GROUPS.map(g => {
            const own = CONTROLS.filter(c => primaryCost(c) === g.cost);
            if (!own.length) return null;

            return (
              <div className="panel__group" key={g.cost}>
                <div className="panel__grouphead">
                  <CostBadge cost={g.cost} />
                  <span className="panel__groupnote">{g.note}</span>
                </div>
                {own.map(c => (
                  <Control key={c.key} spec={c} value={state[c.key] as number | string} onChange={v => set(c.key, v)} />
                ))}
              </div>
            );
          })}
        </aside>
      </div>
    </Section>
  );
}

/** A prop on two paths is filed under the more expensive one — that's the cost that dominates. */
function primaryCost(c: ControlSpec): Cost {
  if (c.cost.includes('map')) return 'map';
  if (c.cost.includes('filter')) return 'filter';
  return 'css';
}

function Control({
  spec,
  value,
  onChange
}: {
  spec: ControlSpec;
  value: number | string;
  onChange: (v: number | string) => void;
}) {
  return (
    <div className="ctl">
      <div className="ctl__row">
        <label className="ctl__label" htmlFor={`c-${spec.key}`} title={spec.hint}>
          {spec.label}
          {spec.cost.length > 1 && (
            <span className="ctl__also" title={`also: ${spec.cost.join(' + ')}`}>
              {' '}
              +{spec.cost.filter(c => c !== primaryCost(spec)).join('/')}
            </span>
          )}
        </label>
        <span className="ctl__val">{String(value)}</span>
      </div>

      {spec.kind === 'range' ? (
        <input
          id={`c-${spec.key}`}
          data-testid={`c-${spec.key}`}
          type="range"
          min={spec.min}
          max={spec.max}
          step={spec.step}
          value={Number(value)}
          onChange={e => onChange(Number(e.target.value))}
        />
      ) : (
        <select
          id={`c-${spec.key}`}
          data-testid={`c-${spec.key}`}
          className="select"
          value={String(value)}
          onChange={e => onChange(e.target.value)}
        >
          {spec.options!.map(o => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}

      <p className="ctl__hint">{spec.hint}</p>
    </div>
  );
}
