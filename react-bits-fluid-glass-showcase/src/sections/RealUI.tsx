import { useState } from 'react';
import FluidGlass from '@lib/FluidGlass';
import { Section, Stage } from '../components/ui';
import { DEMO_CONFIGS } from '../lib/config';

/**
 * Bar mode is the only one built for real UI: it locks to the bottom edge, ignores the
 * pointer, and is the only mode that renders navItems. The links are real — they're the
 * section anchors on this page, and clicking one moves it.
 */
const CFG = DEMO_CONFIGS.productNav;

export default function RealUI() {
  const [live, setLive] = useState(false);

  return (
    <Section
      id="s6"
      num={6}
      title="In real UI"
      lede={
        <>
          Bar mode as an actual navigation bar, not a decoration. The <code>navItems</code> below are this page's own
          anchors: activate the hero and click one, and it navigates. This is also where the component's hard limit
          shows up — see the note underneath.
        </>
      }
    >
      <div className="card appshell">
        <Stage
          className="appshell__hero"
          active={live}
          onActivate={() => setLive(true)}
          tag='mode="bar" · navItems → #s1 / #s2 / #s6 / #s7'
        >
          <FluidGlass mode="bar" barProps={CFG.props} />
        </Stage>

        <div className="appshell__copy">
          <div>
            <h3>It owns the viewport</h3>
            <p>
              The bar isn't positioned in CSS. It's a mesh pinned to <code>-viewport.height / 2 + 0.2</code> in world
              space every frame, inside a canvas that must be as tall as the area you want it to sit in.
            </p>
          </div>
          <div>
            <h3>The labels are 3D text</h3>
            <p>
              <code>navItems</code> become drei <code>&lt;Text&gt;</code> meshes at <code>renderOrder=10</code>, spaced
              by a breakpoint table baked into the component. They aren't DOM, so they aren't focusable, aren't in the
              tab order, and screen readers can't see them.
            </p>
          </div>
          <div>
            <h3>Navigation is a location write</h3>
            <p>
              A click sets <code>window.location.hash</code> for <code>#</code> links and{' '}
              <code>window.location.href</code> otherwise. There's no <code>onNavigate</code> callback, so a router will
              not intercept it — you get a full page load unless every link is a hash.
            </p>
          </div>
        </div>
      </div>

      <div className="note">
        <span>⚠</span>
        <span>
          <strong>The default scene is still owned by the component.</strong> Out of the box FluidGlass takes no{' '}
          <code>children</code>: it refracts a "React Bits" wordmark over five <code>/assets/demo/*.webp</code> images.
          This lab fork adds Photograph and Video media modes for exact comparison with web-glass; arbitrary app UI
          would still need a <code>children</code> prop threaded into the <code>createPortal</code> call.
        </span>
      </div>
    </Section>
  );
}
