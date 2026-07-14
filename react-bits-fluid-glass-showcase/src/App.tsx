import { useEffect, useState } from 'react';
import { Section, ThemeToggle } from './components/ui';
import { BACKDROPS, CONTROLS, DEMO_CONFIGS, GALLERY_KEYS } from './lib/config';
import { FLUID_GLASS_SOURCE } from './lib/source';
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
] as const;

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark');
  useEffect(() => {
    const mo = new MutationObserver(() => setDark(document.documentElement.dataset.theme === 'dark'));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

export default function App() {
  const [backdrop, setBackdrop] = useState('checker');
  const dark = useTheme();
  const active = BACKDROPS.find(b => b.key === backdrop)!;

  return (
    <>
      <header className="topbar">
        <span className="topbar__title">FluidGlass · react-bits</span>
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
          <h1>Everything FluidGlass does, and everything it won't.</h1>
          <p>
            react-bits documents four props. The component forwards <strong>eighteen</strong>, because anything that
            isn't <code>navItems</code> is spread straight into drei's <code>MeshTransmissionMaterial</code> — and it
            hardcodes seven more things you can't reach at all. This page proves each claim against the source.
          </p>
          <div className="hero__meta">
            <span className="pill">1 export</span>
            <span className="pill">4 props</span>
            <span className="pill">{CONTROLS.length} live controls</span>
            <span className="pill">{GALLERY_KEYS.length} presets</span>
            <span className="pill">{Object.keys(DEMO_CONFIGS).length} configs, 1 source of truth</span>
            <span className="pill">{FLUID_GLASS_SOURCE.split('\n').length} lines read</span>
          </div>
        </div>

        <Section
          id="s0"
          num={0}
          title="Backdrop"
          lede={
            <>
              What the glass refracts decides whether you can judge it. These are deliberately achromatic and
              high-frequency: colour in the backdrop is indistinguishable from colour the aberration invented. It
              applies to the page and to the two sections that rebuild the pipeline by hand — FluidGlass itself paints
              over it.
            </>
          }
        >
          <div className="seg" data-testid="backdrop-picker">
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
          <p className="ctl__hint" style={{ marginTop: 8, fontSize: 12 }}>
            {active.note}
          </p>
        </Section>

        <Playground backdrop={backdrop} />
        <Internals backdrop={backdrop} dark={dark} />
        <Gallery />
        <Performance backdrop={backdrop} dark={dark} />
        <Vanilla backdrop={backdrop} dark={dark} />
        <RealUI />
        <Reference />

        <footer className="foot">
          <p>
            Built against the react-bits source at{' '}
            <code>src/ts-default/Components/FluidGlass/FluidGlass.tsx</code>. Component ©{' '}
            <a href="https://github.com/DavidHDev/react-bits">react-bits</a>, MIT + CC BY-NC-4.0.
          </p>
        </footer>
      </main>
    </>
  );
}
