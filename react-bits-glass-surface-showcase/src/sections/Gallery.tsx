import GlassSurface from '@lib/GlassSurface';
import { Section } from '../components/ui';
import { DEMO_CONFIGS, GALLERY_KEYS, GLASS_SURFACE_DEFAULTS, type SurfaceProps } from '../lib/config';

/**
 * Every card is a DEMO_CONFIGS entry. The playground's presets are the same objects — pick
 * "Prism" there and you get this card exactly.
 */
export default function Gallery({ backdrop }: { backdrop: string }) {
  return (
    <Section
      id="s3"
      num={3}
      title="Variants gallery"
      lede={
        <>
          Seven configurations over the same backdrop. Two of them are worth staring at: <strong>Achromatic</strong>{' '}
          sets all three channel offsets equal and the colour fringing disappears completely, proving the offsets are
          the only thing producing it. <strong>Frost only</strong> sets <code>distortionScale: 0</code> and what's left
          is ordinary glassmorphism — a good reminder of how much of this effect is the displacement and how little is
          the blur.
        </>
      }
    >
      <div className="grid">
        {GALLERY_KEYS.map(key => {
          const c = DEMO_CONFIGS[key];
          const props = { ...GLASS_SURFACE_DEFAULTS, ...c.props } as Required<SurfaceProps>;
          const shown = Object.entries(c.props);

          return (
            <div className="card gcard" key={key} data-testid={`gallery-${key}`}>
              <div
                className={`stage bd bd--${backdrop}`}
                style={{ height: 200, borderRadius: '16px 16px 0 0', display: 'grid', placeItems: 'center' }}
              >
                <GlassSurface {...props} className="pg__surface">
                  <span className="pg__label">{c.label}</span>
                </GlassSurface>
              </div>
              <div className="gcard__body">
                <div className="gcard__title">
                  <span>{c.label}</span>
                </div>
                <p className="gcard__note">{c.note}</p>
                <p className="gcard__props">{shown.map(([k, v]) => `${k}: ${v}`).join('  ·  ')}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="note">
        <span>◆</span>
        <span>
          <strong>These are seven live filter graphs on one page,</strong> and unlike a WebGL component they cost
          nothing to co-exist — no contexts, no renderers, no scroll capture. That is the real argument for GlassSurface
          over FluidGlass: it's a DOM element you can put anywhere, as many times as you like.
        </span>
      </div>
    </Section>
  );
}
