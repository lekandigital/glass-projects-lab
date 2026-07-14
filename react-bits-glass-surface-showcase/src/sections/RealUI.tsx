import { useState } from 'react';
import GlassSurface from '@lib/GlassSurface';
import { Section } from '../components/ui';
import { DEMO_CONFIGS, GLASS_SURFACE_DEFAULTS, type SurfaceProps } from '../lib/config';

/**
 * The one thing GlassSurface has that FluidGlass doesn't: `children`. It is a real DOM
 * container, so the glass can hold actual interactive UI rather than sit behind it — which
 * is the only way to find out that the SVG filter does not clip the content it wraps.
 */
const CHROME = DEMO_CONFIGS.appChrome.props;
const g = (extra: SurfaceProps) => ({ ...GLASS_SURFACE_DEFAULTS, ...CHROME, ...extra }) as Required<SurfaceProps>;

const TRACKS = [
  { title: 'Nocturne in E♭', artist: 'Chopin', len: '4:31' },
  { title: 'Gymnopédie No.1', artist: 'Satie', len: '3:22' },
  { title: 'Clair de Lune', artist: 'Debussy', len: '5:07' },
  { title: 'Für Elise', artist: 'Beethoven', len: '2:58' }
];

export default function RealUI() {
  const [playing, setPlaying] = useState(1);
  const [volume, setVolume] = useState(60);
  const [tab, setTab] = useState('Library');

  return (
    <Section
      id="s6"
      num={6}
      title="In real UI"
      lede={
        <>
          GlassSurface takes <code>children</code>, so it is a container, not a backdrop — the buttons, the slider and
          the tabs below are inside the glass and fully interactive. Everything here uses the same{' '}
          <code>DEMO_CONFIGS.appChrome</code> object. Drag the volume slider: it sits on top of a live SVG filter and
          still behaves like a slider.
        </>
      }
    >
      <div className="app">
        <div className="app__wall" />

        <div className="app__chrome">
          <GlassSurface {...g({ width: '100%', height: 56, borderRadius: 18 })} className="app__bar">
            <div className="app__tabs">
              {['Library', 'Radio', 'Search'].map(t => (
                <button
                  key={t}
                  className={`app__tab ${tab === t ? 'on' : ''}`}
                  onClick={() => setTab(t)}
                  data-testid={`tab-${t}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <span className="app__brand">{tab}</span>
          </GlassSurface>

          <div className="app__list">
            {TRACKS.map((t, i) => (
              <button
                key={t.title}
                className={`app__row ${playing === i ? 'on' : ''}`}
                onClick={() => setPlaying(i)}
                data-testid={`track-${i}`}
              >
                <span className="app__idx">{playing === i ? '▶' : i + 1}</span>
                <span>
                  <strong>{t.title}</strong>
                  <em>{t.artist}</em>
                </span>
                <span className="app__len mono">{t.len}</span>
              </button>
            ))}
          </div>

          <GlassSurface {...g({ width: '100%', height: 84, borderRadius: 22 })} className="app__player">
            <div className="app__now">
              <strong>{TRACKS[playing].title}</strong>
              <em>{TRACKS[playing].artist}</em>
            </div>

            <div className="app__ctrls">
              <button onClick={() => setPlaying(p => (p + TRACKS.length - 1) % TRACKS.length)} aria-label="Previous">
                ⏮
              </button>
              <button className="app__play" aria-label="Play">
                ⏸
              </button>
              <button onClick={() => setPlaying(p => (p + 1) % TRACKS.length)} aria-label="Next" data-testid="next">
                ⏭
              </button>
            </div>

            <label className="app__vol">
              <span className="mono" data-testid="volume">
                {volume}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                data-testid="volume-slider"
                aria-label="Volume"
              />
            </label>
          </GlassSurface>
        </div>
      </div>

      <div className="note">
        <span>⚠</span>
        <span>
          <strong>The rim eats your padding.</strong> The displacement is strongest exactly at the edges, so content
          placed near them gets visibly bent — the component's own{' '}
          <code>.glass-surface__content</code> only applies <code>0.5rem</code>, which is not enough at{' '}
          <code>distortionScale: -140</code>. Every surface here overrides the padding via <code>className</code>. That
          is a layout constraint the props don't express and the README doesn't mention.
        </span>
      </div>
    </Section>
  );
}
