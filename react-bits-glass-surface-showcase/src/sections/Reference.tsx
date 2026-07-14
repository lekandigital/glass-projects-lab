import { useEffect, useState } from 'react';
import { CostBadge, Section } from '../components/ui';
import { CONTROLS, type Cost } from '../lib/config';
import { GLASS_SURFACE_SOURCE, HARDCODED, PROP_TYPES, SIGNATURE_DEFAULTS } from '../lib/source';
import { supportsSVGFilters } from '../lib/displacement';

/**
 * Nothing in these tables is typed by hand. GlassSurface has no defaults object, so
 * src/lib/source.ts imports the component's source with ?raw and parses the destructuring
 * literals and the prop interface back out at runtime.
 */

const COST_OF: Record<string, Cost[]> = Object.fromEntries(CONTROLS.map(c => [c.key, c.cost]));
const HINT_OF: Record<string, string> = Object.fromEntries(CONTROLS.map(c => [c.key, c.hint]));

const EXTRA_DOCS: Record<string, string> = {
  children: 'Rendered into .glass-surface__content. The reason this component can hold real UI.',
  className: 'Appended to the root. The only way to reach the internal layout — see §6.',
  style: 'Merged into the container style, before the width/height/borderRadius the component sets itself.'
};

export default function Reference() {
  const [showSource, setShowSource] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => setSupported(supportsSVGFilters()), []);

  const keys = Object.keys(PROP_TYPES);

  return (
    <Section
      id="s7"
      num={7}
      title="Reference"
      lede={
        <>
          One export, twenty props. Every default below is parsed out of the component's own source at runtime — not
          transcribed — so it cannot go stale.
        </>
      }
    >
      <div className={`browser ${supported ? 'browser--ok' : 'browser--bad'}`} data-testid="browser-gate">
        <strong>{supported ? 'This browser gets the real effect.' : 'This browser gets the fallback.'}</strong>{' '}
        <code>supportsSVGFilters()</code> returns <code>{String(supported)}</code> here.{' '}
        {supported ? (
          <>
            It hard-refuses Safari and Firefox by <em>user-agent string</em>, before running any feature test — so a
            Chromium browser is the only one that ever reaches the displacement path. In the other two you silently get{' '}
            <code>.glass-surface--fallback</code>: a plain <code>blur(12px) saturate(1.8)</code> with no displacement,
            no rim and no chromatic aberration. Every prop on this page except{' '}
            <code>backgroundOpacity</code> becomes a no-op there.
          </>
        ) : (
          <>
            You are seeing <code>.glass-surface--fallback</code> — a plain <code>blur(12px)</code>. None of the
            displacement props do anything. Open this in a Chromium browser to see the actual component.
          </>
        )}
      </div>

      <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Exports</h3>
      <div className="tablewrap" style={{ marginBottom: 32 }}>
        <table>
          <thead>
            <tr>
              <th>Export</th>
              <th>Kind</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>default</code>
              </td>
              <td>
                <code>GlassSurface</code>
              </td>
              <td>The component. The only runtime export.</td>
            </tr>
            <tr>
              <td>
                <code>GlassSurfaceProps</code>
              </td>
              <td>
                <code>interface</code>
              </td>
              <td>Type-only. Exported, unlike FluidGlass's props type.</td>
            </tr>
            <tr>
              <td>
                <code>generateDisplacementMap</code>
              </td>
              <td>
                <code>— not exported</code>
              </td>
              <td>
                A closure inside the component. It is the entire effect, and there is no way to reach it. §2 reproduces
                it.
              </td>
            </tr>
            <tr>
              <td>
                <code>supportsSVGFilters</code>
              </td>
              <td>
                <code>— not exported</code>
              </td>
              <td>Also private, so you cannot ask the library whether it will work before you render it.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Props</h3>
      <div className="tablewrap" style={{ marginBottom: 32 }}>
        <table>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Default</th>
              <th>Cost</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k} data-testid={`ref-${k}`}>
                <td>
                  <code>{k}</code>
                </td>
                <td>
                  <code style={{ fontSize: 11 }}>{PROP_TYPES[k]}</code>
                </td>
                <td className="mono" data-testid={`default-${k}`}>
                  {SIGNATURE_DEFAULTS[k] ? (
                    <code>{SIGNATURE_DEFAULTS[k]}</code>
                  ) : (
                    <span style={{ color: 'var(--text-faint)' }}>undefined</span>
                  )}
                </td>
                <td>
                  <span style={{ display: 'inline-flex', gap: 3, flexWrap: 'wrap' }}>
                    {(COST_OF[k] ?? ['css']).map(c => (
                      <CostBadge key={c} cost={c} />
                    ))}
                  </span>
                </td>
                <td>{HINT_OF[k] ?? EXTRA_DOCS[k] ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>Hardcoded — no prop reaches these</h3>
      <p className="section__lede" style={{ marginBottom: 12 }}>
        Parsed straight out of the source and its stylesheet. Each one is a fork-to-change.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>What</th>
              <th>Value in source</th>
              <th>Where</th>
            </tr>
          </thead>
          <tbody>
            {HARDCODED.map(h => (
              <tr key={h.what}>
                <td>{h.what}</td>
                <td className="mono">
                  <code>{h.value}</code>
                </td>
                <td>
                  <code>{h.where}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        className="btn"
        style={{ marginTop: 16 }}
        onClick={() => setShowSource(s => !s)}
        data-testid="toggle-source"
      >
        {showSource ? 'Hide' : 'Show'} the source these tables were parsed from (
        {GLASS_SURFACE_SOURCE.split('\n').length} lines)
      </button>

      {showSource && (
        <div className="code" data-testid="source-dump">
          <pre>{GLASS_SURFACE_SOURCE}</pre>
        </div>
      )}
    </Section>
  );
}
