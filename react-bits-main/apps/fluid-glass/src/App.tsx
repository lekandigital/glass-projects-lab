import { useState } from 'react';
import FluidGlass from '@lib/FluidGlass';

type Mode = 'lens' | 'bar' | 'cube';

// Mirrors src/demo/Components/FluidGlassDemo.jsx: switching mode remounts the
// component, because ModeWrapper is memoised and caches the GLB geometry.
const MODE_PROPS: Record<Mode, Record<string, unknown>> = {
  lens: { scale: 0.25, ior: 1.15, thickness: 5, chromaticAberration: 0.1, anisotropy: 0.01 },
  cube: { scale: 0.25, ior: 1.15, thickness: 5, chromaticAberration: 0.1, anisotropy: 0.01 },
  bar: {
    scale: 0.15,
    ior: 1.15,
    thickness: 10,
    chromaticAberration: 0.1,
    anisotropy: 0.01,
    transmission: 1,
    roughness: 0,
    color: '#ffffff',
    attenuationColor: '#ffffff',
    attenuationDistance: 0.25,
    navItems: [
      { label: 'Home', link: '' },
      { label: 'About', link: '' },
      { label: 'Contact', link: '' }
    ]
  }
};

const MODES: Mode[] = ['lens', 'bar', 'cube'];

export default function App() {
  const [mode, setMode] = useState<Mode>('lens');

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <FluidGlass
        key={mode}
        mode={mode}
        lensProps={mode === 'lens' ? MODE_PROPS.lens : {}}
        barProps={mode === 'bar' ? MODE_PROPS.bar : {}}
        cubeProps={mode === 'cube' ? MODE_PROPS.cube : {}}
      />

      <nav
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 4,
          padding: 4,
          borderRadius: 999,
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        {MODES.map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: 0,
              cursor: 'pointer',
              fontSize: 13,
              letterSpacing: 0.4,
              textTransform: 'capitalize',
              color: mode === m ? '#111' : '#fff',
              background: mode === m ? '#fff' : 'transparent'
            }}
          >
            {m}
          </button>
        ))}
      </nav>
    </div>
  );
}
