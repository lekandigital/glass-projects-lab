import { useEffect, useMemo, useState } from 'react';
import GlassSurface from '@lib/GlassSurface';
import { CodeBlock, CostBadge, Section } from '../components/ui';
import { GLASS_SURFACE_DEFAULTS, INTERNALS, PLAYGROUND_INITIAL, type SurfaceProps } from '../lib/config';
import { channelScales, decodeMap, edgeSize, generateDisplacementMap, splitChannels } from '../lib/displacement';

const W = 320;
const H = 140;

const START = { ...GLASS_SURFACE_DEFAULTS, ...PLAYGROUND_INITIAL.props, width: W, height: H } as Required<SurfaceProps>;

/**
 * The map GlassSurface generates is written straight into an feImage href and never
 * rendered anywhere you can see it — but every visible property of the glass is encoded in
 * its pixels. So this section calls the (private) generator directly and shows the output.
 */
export default function Internals({ backdrop }: { backdrop: string }) {
  const [p, setP] = useState<Required<SurfaceProps>>(START);
  const [planes, setPlanes] = useState<{ r: string; g: string; b: string; composite: string } | null>(null);

  const uri = useMemo(
    () =>
      generateDisplacementMap({
        width: p.width as number,
        height: p.height as number,
        borderRadius: p.borderRadius,
        borderWidth: p.borderWidth,
        brightness: p.brightness,
        opacity: p.opacity,
        blur: p.blur,
        mixBlendMode: p.mixBlendMode
      }),
    [p]
  );

  useEffect(() => {
    let live = true;
    splitChannels(uri, W, H).then(r => live && setPlanes(r));
    return () => {
      live = false;
    };
  }, [uri]);

  const scales = channelScales(p.distortionScale, p.redOffset, p.greenOffset, p.blueOffset);
  const rim = edgeSize(p.width as number, p.height as number, p.borderWidth);

  const set = (k: keyof SurfaceProps, v: number) => setP(s => ({ ...s, [k]: v }));

  return (
    <Section
      id="s2"
      num={2}
      title="Internals"
      lede={
        <>
          GlassSurface exports one component and nothing else, but its whole trick lives in one private function.{' '}
          <code>generateDisplacementMap()</code> builds an SVG, percent-encodes it into a <code>data:</code> URI, and
          writes it into an <code>feImage</code> href where you can never see it. Here it is, called directly, with its
          raw output on screen — and split into the three colour planes the filter actually reads.
        </>
      }
    >
      <div className="two">
        <div className="card">
          <div className={`stage bd bd--${backdrop}`} style={{ height: 260, borderRadius: '16px 16px 0 0', display: 'grid', placeItems: 'center' }}>
            <span className="stage__tag">the surface</span>
            <GlassSurface {...p} className="pg__surface">
              <span className="pg__label">GlassSurface</span>
            </GlassSurface>
          </div>
          <div className="gcard__body">
            <div className="gcard__title">
              <span>What you see</span>
              <CostBadge cost="filter" />
            </div>
            <p className="gcard__note">
              The live component with the props below. Everything it does is the map on the right, run through six
              filter primitives.
            </p>
          </div>
        </div>

        <div className="card">
          <div
            className="stage"
            style={{ height: 260, borderRadius: '16px 16px 0 0', display: 'grid', placeItems: 'center', background: '#111' }}
          >
            <span className="stage__tag">generateDisplacementMap() → data:image/svg+xml</span>
            <img src={uri} width={W} height={H} alt="generated displacement map" data-testid="map-raw" style={{ borderRadius: 8 }} />
          </div>
          <div className="gcard__body">
            <div className="gcard__title">
              <span>What drives it</span>
              <CostBadge cost="map" />
            </div>
            <p className="gcard__note">
              A black field, a red gradient running right→left, a blue gradient running top→bottom blended with{' '}
              <code>mix-blend-mode: {p.mixBlendMode}</code>, and a blurred grey rect inset by{' '}
              <code>edgeSize = {rim.toFixed(1)}px</code>. That inset rect is the rim; the gradients are the lens.
            </p>
          </div>
        </div>
      </div>

      {/* ── the payoff ─────────────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: 16, padding: 16 }}>
        <div className="gcard__title">
          <span>The three planes, and why yChannel defaults to G</span>
        </div>
        <p className="gcard__note">
          <code>feDisplacementMap</code> doesn't read an image — it reads <em>one channel</em> of an image per axis.{' '}
          <code>xChannel</code> defaults to <code>R</code> and <code>yChannel</code> to <code>G</code>. But look at the
          planes: the map paints its horizontal ramp into <strong>red</strong> and its vertical ramp into{' '}
          <strong>blue</strong>. Green is never painted by either gradient — the only thing in it is the blurred inset
          rect. So vertical displacement is driven almost entirely by the <em>rim</em>, not by a full-height ramp, which
          is exactly why the effect concentrates at the edges and leaves the middle of the pane undistorted.
        </p>

        <div className="planes" data-testid="planes">
          {(['composite', 'r', 'g', 'b'] as const).map(k => (
            <figure key={k}>
              {planes ? <img src={planes[k]} alt={`${k} plane`} /> : <div className="planes__skel" />}
              <figcaption>
                {k === 'composite' ? 'composite' : `${k.toUpperCase()} plane`}
                {k === 'r' && ' — drives x'}
                {k === 'g' && ' — drives y (default)'}
                {k === 'b' && ' — unused by default'}
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="ctl__hint" style={{ marginTop: 10 }}>
          Set <code>yChannel</code> to <code>B</code> in the playground and the pane starts displacing vertically across
          its whole height instead of only at the rim. The default is a choice, not a necessity.
        </p>
      </div>

      {/* ── the three passes ───────────────────────────────────────────── */}
      <div className="two" style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="gcard__title">
            <span>The three displacement passes</span>
            <CostBadge cost="filter" />
          </div>
          <p className="gcard__note">
            The same map is displaced three times, once per colour channel, each at{' '}
            <code>scale = distortionScale + offset</code>. The results are isolated with{' '}
            <code>feColorMatrix</code> and screened back together. The spread between these three numbers{' '}
            <em>is</em> the chromatic aberration — there is no other source of it.
          </p>

          <div className="scales" data-testid="scales">
            {scales.map(s => (
              <div className="scales__row" key={s.channel}>
                <span className="scales__ch" style={{ color: s.colour }}>
                  {s.channel}
                </span>
                <span className="scales__eq mono">
                  {p.distortionScale} {s.offset >= 0 ? '+' : '−'} {Math.abs(s.offset)}
                </span>
                <div className="scales__bar">
                  <div
                    className="scales__fill"
                    style={{
                      background: s.colour,
                      width: `${(Math.abs(s.scale) / 350) * 100}%`,
                      marginLeft: s.scale < 0 ? 'auto' : 0
                    }}
                  />
                </div>
                <span className="scales__val mono" data-testid={`scale-${s.channel}`}>
                  {s.scale}
                </span>
              </div>
            ))}
          </div>

          <div className="ctl" style={{ marginTop: 16 }}>
            <div className="ctl__row">
              <label className="ctl__label" htmlFor="i-scale">
                distortionScale
              </label>
              <span className="ctl__val">{p.distortionScale}</span>
            </div>
            <input
              id="i-scale"
              data-testid="i-distortionScale"
              type="range"
              min={-300}
              max={300}
              step={5}
              value={p.distortionScale}
              onChange={e => set('distortionScale', Number(e.target.value))}
            />
          </div>
          <div className="ctl">
            <div className="ctl__row">
              <label className="ctl__label" htmlFor="i-blue">
                blueOffset
              </label>
              <span className="ctl__val">{p.blueOffset}</span>
            </div>
            <input
              id="i-blue"
              data-testid="i-blueOffset"
              type="range"
              min={-50}
              max={50}
              step={1}
              value={p.blueOffset}
              onChange={e => set('blueOffset', Number(e.target.value))}
            />
          </div>
          <div className="ctl">
            <div className="ctl__row">
              <label className="ctl__label" htmlFor="i-bw">
                borderWidth
              </label>
              <span className="ctl__val">
                {p.borderWidth} → rim {rim.toFixed(1)}px
              </span>
            </div>
            <input
              id="i-bw"
              data-testid="i-borderWidth"
              type="range"
              min={0}
              max={0.4}
              step={0.005}
              value={p.borderWidth}
              onChange={e => set('borderWidth', Number(e.target.value))}
            />
          </div>
          <div className="ctl">
            <div className="ctl__row">
              <label className="ctl__label" htmlFor="i-blur">
                blur (of the map, not the output)
              </label>
              <span className="ctl__val">{p.blur}</span>
            </div>
            <input
              id="i-blur"
              data-testid="i-blur"
              type="range"
              min={0}
              max={40}
              step={1}
              value={p.blur}
              onChange={e => set('blur', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="gcard__title">
            <span>The SVG it actually generated</span>
            <CostBadge cost="map" />
          </div>
          <p className="gcard__note">
            Decoded back out of the <code>data:</code> URI, live, for the settings on the left. This string is rebuilt
            and re-encoded on every change to any red-badged prop — which is what section 4 is about.
          </p>
          <CodeBlock code={decodeMap(uri)} label="Copy SVG" />
          <p className="ctl__hint" style={{ marginTop: 10 }}>
            Note <code>filter:blur({p.blur}px)</code> on the inner rect. It blurs the <em>map</em>, softening the
            gradient the rim reads — it is not the blur you see. The only prop that blurs the output is{' '}
            <code>displace</code>, which lands on <code>feGaussianBlur</code> (markup ships{' '}
            <code>stdDeviation={INTERNALS.markupStdDeviation}</code>, overwritten on mount).
          </p>
        </div>
      </div>
    </Section>
  );
}
