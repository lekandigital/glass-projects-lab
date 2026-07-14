import { useState } from 'react';
import { Section, ThemeToggle } from './components/ui';
import { BACKDROPS } from './lib/config';
import Playground from './sections/Playground';
import Internals from './sections/Internals';
import Gallery from './sections/Gallery';
import Performance from './sections/Performance';
import Vanilla from './sections/Vanilla';
import RealUI from './sections/RealUI';
import Reference from './sections/Reference';
import './styles/app.css';

const NAV = [
  ['s1', 'Playground'],
  ['s2', 'Internals'],
  ['s3', 'Gallery'],
  ['s4', 'Performance'],
  ['s5', 'Vanilla'],
  ['s6', 'Real UI'],
  ['s7', 'Reference']
];

export default function App() {
  const [backdrop, setBackdrop] = useState('checker');
  const current = BACKDROPS.find(b => b.key === backdrop)!;

  return (
    <>
      <header className="topbar">
        <span className="topbar__title">GlassSurface · react-bits</span>
        <nav className="topbar__nav">
          {NAV.map(([id, label]) => (
            <a key={id} className="topbar__link" href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
        <ThemeToggle />
      </header>

      <main className="shell">
        <div className="hero">
          <h1>Everything GlassSurface does, and the three things it doesn't tell you.</h1>
          <p>
            react-bits' GlassSurface is a CSS <code>backdrop-filter</code> pointed at an SVG filter graph, driven by a
            displacement map the component generates on the fly and never shows you. This page renders that map,
            benchmarks the effect's real cost, rebuilds it without React, and reports whether your browser is even
            getting it.
          </p>

          <div className="hero__meta">
            <span className="pill">1 export</span>
            <span className="pill">20 props</span>
            <span className="pill">6 filter primitives</span>
            <span className="pill">0 refs</span>
            <span className="pill">Chromium only</span>
          </div>
        </div>

        {/* GlassSurface refracts whatever is genuinely behind it in the DOM, so unlike a WebGL
            component this picker reaches every surface on the page. */}
        <section className="section" id="backdrop">
          <div className="section__head">
            <span className="section__num">00</span>
            <h2>Backdrop</h2>
          </div>
          <p className="section__lede">
            Pick what the glass has to refract. Neutral and high-frequency by default — over a colourful backdrop it is
            impossible to tell chromatic aberration from the source material, which is exactly the mistake most glass
            demos make.
          </p>
          <div className="seg" style={{ flexWrap: 'wrap' }}>
            {BACKDROPS.map(b => (
              <button
                key={b.key}
                className={`btn ${backdrop === b.key ? 'btn--active' : ''}`}
                onClick={() => setBackdrop(b.key)}
                data-testid={`backdrop-${b.key}`}
              >
                {b.label}
              </button>
            ))}
          </div>
          <p className="ctl__hint" style={{ marginTop: 8 }}>{current.note}</p>
        </section>

        <Playground backdrop={backdrop} />
        <Internals backdrop={backdrop} />
        <Gallery backdrop={backdrop} />
        <Performance backdrop={backdrop} />
        <Vanilla backdrop={backdrop} />
        <RealUI />
        <Reference />

        <Section id="s8" num={8} title="What this cost to find" lede="" >
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Finding</th>
                  <th>Where it shows up</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    The component's single <code>useEffect</code> regenerates the displacement map on <em>every</em>{' '}
                    prop change, including the seven the map never reads. Animating <code>distortionScale</code> should
                    be as cheap as animating <code>saturation</code>; measured over 12 surfaces it runs at roughly{' '}
                    <strong>60% of the frame rate</strong>, because it re-encodes and re-decodes an SVG image every
                    frame for nothing. The plain-DOM core runs the identical animation at full speed.
                  </td>
                  <td>
                    <a href="#s4">§4</a>, fixed in <a href="#s5">§5</a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>yChannel</code> defaults to <code>G</code>, but the generated map paints its vertical ramp
                    into <strong>blue</strong>. Green carries only the blurred rim — which is why the pane distorts at
                    its edges and not through its middle.
                  </td>
                  <td>
                    <a href="#s2">§2</a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>supportsSVGFilters()</code> refuses Safari and Firefox by user-agent string before any feature
                    test runs. In those browsers every displacement prop is silently a no-op.
                  </td>
                  <td>
                    <a href="#s7">§7</a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>mixBlendMode</code> is not the surface's CSS blend mode. It blends two gradients{' '}
                    <em>inside the generated map</em>, and nothing else.
                  </td>
                  <td>
                    <a href="#s1">§1</a>, <a href="#s2">§2</a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>blur</code> blurs the map, not the output. The only prop that blurs what you see is{' '}
                    <code>displace</code>.
                  </td>
                  <td>
                    <a href="#s2">§2</a>
                  </td>
                </tr>
                <tr>
                  <td>The identical ResizeObserver effect is registered twice, verbatim.</td>
                  <td>
                    <a href="#s5">§5</a>, <a href="#s7">§7</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <footer className="foot">
          <p>
            Built against{' '}
            <a href="https://github.com/DavidHDev/react-bits">react-bits</a>' GlassSurface source, not its README.{' '}
            <a href="https://glass-projects-lab-react-bits.vercel.app/components/glass-surface">Upstream docs page</a> ·{' '}
            <a href="https://glass-projects-lab-gs-alternate.vercel.app/">Standalone demo</a>
          </p>
        </footer>
      </main>
    </>
  );
}
