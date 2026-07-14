import { useState } from 'react';
import { CostBadge, Section } from '../components/ui';
import { CONTROLS, type Cost } from '../lib/config';
import { BAR_DEFAULTS, FLUID_GLASS_SOURCE, HARDCODED, NULLISH_DEFAULTS, SIGNATURE_DEFAULTS } from '../lib/source';

/**
 * Nothing in these tables is typed by hand. FluidGlass has no defaults object to read,
 * so src/lib/source.ts imports the component's source with ?raw and parses the literals
 * back out at runtime. Change a default upstream and this table changes with it.
 */

const PROP_DOCS: Record<string, string> = {
  mode: "Which GLB, which geometry node, and whether the mesh tracks the pointer. Changing it needs a new key — ModeWrapper is memo'd and caches the geometry.",
  lensProps: 'Read only when mode="lens". navItems is ignored here.',
  barProps: 'Read only when mode="bar". The one mode that renders navItems.',
  cubeProps: 'Read only when mode="cube". navItems is ignored here.'
};

const COST_OF: Record<string, Cost> = Object.fromEntries(CONTROLS.map(c => [c.key, c.cost]));

export default function Reference() {
  const [showSource, setShowSource] = useState(false);

  const passthrough = CONTROLS.filter(c => c.key !== 'mode');

  return (
    <Section
      id="s7"
      num={7}
      title="Reference"
      lede={
        <>
          Four props, one export, and a great deal hiding behind the spread. Every default below is parsed out of the
          component's own source at runtime — not transcribed — so it cannot go stale.
        </>
      }
    >
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
                <code>FluidGlass</code>
              </td>
              <td>
                The only export. <code>Lens</code>, <code>Bar</code>, <code>Cube</code>, <code>ModeWrapper</code>,{' '}
                <code>NavItems</code>, <code>Images</code> and <code>Typography</code> are module-private — not
                importable, not overridable.
              </td>
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
            {Object.entries(SIGNATURE_DEFAULTS).map(([k, v]) => (
              <tr key={k} data-testid={`ref-${k}`}>
                <td>
                  <code>{k}</code>
                </td>
                <td>
                  <code>{k === 'mode' ? "'lens' | 'bar' | 'cube'" : 'Record<string, unknown>'}</code>
                </td>
                <td className="mono">
                  <code>{v}</code>
                </td>
                <td>
                  <CostBadge cost={k === 'mode' ? 'remount' : 'uniform'} />
                </td>
                <td>{PROP_DOCS[k]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>Inside lensProps / barProps / cubeProps</h3>
      <p className="section__lede" style={{ marginBottom: 12 }}>
        <code>navItems</code> is destructured out; <strong>everything else is spread into drei's</strong>{' '}
        <code>MeshTransmissionMaterial</code>. Only the first five have defaults in FluidGlass — the rest fall through
        to the material's own, and none of them are documented.
      </p>
      <div className="tablewrap" style={{ marginBottom: 32 }}>
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>FluidGlass default</th>
              <th>Bar override</th>
              <th>Cost</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>navItems</code>
              </td>
              <td className="mono">
                <code>[Home, About, Contact]</code>
              </td>
              <td>—</td>
              <td>
                <CostBadge cost="remount" />
              </td>
              <td>
                <code>{'{ label, link }[]'}</code>. Silently ignored unless <code>mode="bar"</code>.
              </td>
            </tr>
            {passthrough.map(c => (
              <tr key={c.key} data-testid={`ref-${c.key}`}>
                <td>
                  <code>{c.key}</code>
                </td>
                <td className="mono" data-testid={`default-${c.key}`}>
                  {NULLISH_DEFAULTS[c.key] ? (
                    <code>{NULLISH_DEFAULTS[c.key]}</code>
                  ) : (
                    <span style={{ color: 'var(--text-faint)' }}>material default</span>
                  )}
                </td>
                <td className="mono">
                  {BAR_DEFAULTS[c.key] ? (
                    <code>{BAR_DEFAULTS[c.key]}</code>
                  ) : (
                    <span style={{ color: 'var(--text-faint)' }}>—</span>
                  )}
                </td>
                <td>
                  <CostBadge cost={COST_OF[c.key]} />
                </td>
                <td>{c.hint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>Hardcoded — no prop reaches these</h3>
      <p className="section__lede" style={{ marginBottom: 12 }}>
        Parsed straight out of the source. Each one is a thing you'd have to fork the component to change.
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

      <button className="btn" style={{ marginTop: 16 }} onClick={() => setShowSource(s => !s)} data-testid="toggle-source">
        {showSource ? 'Hide' : 'Show'} the source these tables were parsed from ({FLUID_GLASS_SOURCE.split('\n').length}{' '}
        lines)
      </button>

      {showSource && (
        <div className="code" data-testid="source-dump">
          <pre>{FLUID_GLASS_SOURCE}</pre>
        </div>
      )}
    </Section>
  );
}
