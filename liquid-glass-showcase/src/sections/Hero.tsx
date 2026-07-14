import { GripLens } from "../GripLens";
import { DEMO_LENSES } from "../glass";

export function Hero() {
  return (
    <header className="hero" id="top">
      <GripLens
        size={DEMO_LENSES.hero.width}
        initial={{ x: 0.74, y: 0.62 }}
        idleWander
        bleed={{ x: 28, y: 40 }}
        options={DEMO_LENSES.hero}
      >
        <div className="heroInner">
          <div className="chips">
            <span className="chip">
              <i className="dot chrome" /> Chrome
            </span>
            <span className="chip">
              <i className="dot safari" /> Safari
            </span>
            <span className="chip">
              <i className="dot firefox" /> Firefox
            </span>
            <span className="chipNote">no flags · no fallbacks · ~5 kB</span>
          </div>

          <h1>
            liquid&#8209;glass&#8209;web&#8209;react
            <span>every knob, every trick, one page.</span>
          </h1>

          <p className="heroLede">
            A real lens over live DOM: an SVG <code>feDisplacementMap</code> fed a displacement map
            the library computes on the fly. Text underneath stays selectable, buttons stay
            clickable, video keeps playing. Below: all eighteen options, the imperative handle, the
            framework&#8209;free engine, and the raw map itself — pulled apart channel by channel.
          </p>

          <div className="heroCta">
            <code className="install">npm install liquid-glass-web-react</code>
            <a className="ghost" href="#playground">
              Play with it ↓
            </a>
          </div>

          <p className="heroHint">↑ that glass circle is draggable — throw it around the page</p>
        </div>
      </GripLens>
    </header>
  );
}
