import { useState } from 'react';
import FluidGlass from '@lib/FluidGlass';
import { Section, Stage } from '../components/ui';
import { DEMO_CONFIGS, GALLERY_KEYS } from '../lib/config';

/**
 * Every card is a DEMO_CONFIGS entry, rendered live and side by side. The playground's
 * presets are the same objects — pick "Amber" there and you get this card exactly.
 */
export default function Gallery() {
  const [live, setLive] = useState<string | null>(null);

  return (
    <Section
      id="s3"
      num={3}
      title="Variants gallery"
      lede={
        <>
          The three modes plus four presets that only exist because of the undocumented pass-through, all rendered at
          once. Judging <code>ior</code> or <code>attenuationDistance</code> in isolation is nearly impossible; against
          each other it's obvious. Each card is a live WebGL context, so they mount as they scroll into view and stay
          inert until clicked.
        </>
      }
    >
      <div className="grid">
        {GALLERY_KEYS.map(key => {
          const c = DEMO_CONFIGS[key];
          const active = live === key;
          const shown = Object.entries(c.props).filter(([k]) => k !== 'navItems');

          return (
            <div className="card gcard" key={key} data-testid={`gallery-${key}`}>
              <Stage
                className="bd bd--flat"
                height={240}
                active={active}
                onActivate={() => setLive(key)}
                tag={`mode="${c.mode}"`}
              >
                <FluidGlass
                  mode={c.mode}
                  lensProps={c.mode === 'lens' ? c.props : {}}
                  barProps={c.mode === 'bar' ? c.props : {}}
                  cubeProps={c.mode === 'cube' ? c.props : {}}
                />
              </Stage>
              <div className="gcard__body">
                <div className="gcard__title">
                  <span>{c.label}</span>
                </div>
                <p className="gcard__note">{c.note}</p>
                <p className="gcard__props">
                  {shown.map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v}'` : v}`).join('  ·  ')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="note">
        <span>◆</span>
        <span>
          <strong>Only one card is interactive at a time.</strong> Each FluidGlass builds its own{' '}
          <code>&lt;Canvas&gt;</code> <em>and</em> its own <code>ScrollControls</code>, and seven live scroll containers
          would fight the page for the wheel. That's a real consequence of the component owning its renderer: you cannot
          put two of these on a page and have them share anything.
        </span>
      </div>
    </Section>
  );
}
