import { useState } from 'react';
import FluidGlass from '@lib/FluidGlass';

type Mode = 'lens' | 'bar' | 'cube';
type BackdropMode = 'default' | 'photograph' | 'video';

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
const BACKDROPS: Array<{ key: BackdropMode; label: string }> = [
  { key: 'default', label: 'Default scene' },
  { key: 'photograph', label: 'Photograph' },
  { key: 'video', label: 'Video' }
];

export default function App() {
  const [mode, setMode] = useState<Mode>('lens');
  const [backdrop, setBackdrop] = useState<BackdropMode>('default');

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <FluidGlass
        key={mode}
        mode={mode}
        backdrop={backdrop}
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
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 4,
          padding: 4,
          borderRadius: 18,
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          fontFamily: 'system-ui, sans-serif',
          maxWidth: 'min(720px, calc(100vw - 24px))'
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
        <span
          aria-hidden
          style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.22)', margin: '4px 6px' }}
        />
        {BACKDROPS.map(b => (
          <button
            key={b.key}
            onClick={() => setBackdrop(b.key)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: 0,
              cursor: 'pointer',
              fontSize: 13,
              letterSpacing: 0.4,
              color: backdrop === b.key ? '#111' : '#fff',
              background: backdrop === b.key ? '#fff' : 'transparent'
            }}
          >
            {b.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
