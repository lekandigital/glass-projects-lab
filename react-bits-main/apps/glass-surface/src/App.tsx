import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { TbBackground, TbMenu } from 'react-icons/tb';
import GlassSurface from '@lib/GlassSurface';
import LiquidEther from '@lib/LiquidEther';
import './app.css';

type Example = 'scroll' | 'landingPage';

// Ported from src/demo/Components/GlassSurfaceDemo.jsx — same values, so this page shows
// the component exactly as react-bits' own docs page does, just full-bleed.
const DEFAULT_PROPS = {
  borderRadius: 50,
  borderWidth: 0.07,
  brightness: 50,
  opacity: 0.93,
  blur: 11,
  displace: 0.5,
  backgroundOpacity: 0.1,
  saturation: 1,
  distortionScale: -180,
  redOffset: 0,
  greenOffset: 10,
  blueOffset: 20
};

const CARDS = [
  {
    src: 'https://images.unsplash.com/photo-1500673587002-1d2548cfba1b?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    text: 'The Summer Of Glass'
  },
  {
    src: 'https://images.unsplash.com/photo-1594576547505-1be67997401e?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    text: 'Can Hold Any Content'
  },
  {
    src: 'https://images.unsplash.com/photo-1543127172-4b33cb699e35?q=80&w=1674&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    text: 'Has Built-In Fallback'
  }
];

export default function App() {
  const [example, setExample] = useState<Example>('scroll');
  const scrollRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Lenis config copied verbatim from the upstream demo: the scroll feel is part of the
  // effect, because the displacement only reads as glass while content moves under it.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    lenisRef.current?.destroy();
    lenisRef.current = null;

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || isReducedMotion) {
      el.style.overflowY = 'auto';
      return;
    }
    el.style.overflowY = 'hidden';

    if (example !== 'scroll') return;

    let rafId = 0;
    const lenis = new Lenis({
      wrapper: el,
      content: el.firstElementChild as HTMLElement,
      duration: 2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
      lerp: 0.1
    });
    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [example]);

  return (
    <div className="root">
      <nav className="switcher">
        {(['scroll', 'landingPage'] as Example[]).map(e => (
          <button key={e} className={example === e ? 'on' : ''} onClick={() => setExample(e)} data-testid={`ex-${e}`}>
            {e === 'scroll' ? 'Scroll' : 'Landing Page'}
          </button>
        ))}
      </nav>

      {/* .demo-container mirrors react-bits' own preview wrapper (flex-centred, overflow
          hidden), so the sticky pane and the absolute flow lay out exactly as they do
          upstream — same class names, same constants. */}
      <div className="demo-container" ref={scrollRef}>
        {example === 'scroll' ? (
          <>
            <GlassSurface
              width={360}
              height={100}
              {...DEFAULT_PROPS}
              style={{ position: 'sticky', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
            />

            <div className="scroll__flow">
              <h1 className="scroll__hint">Try scrolling.</h1>
              <div className="spacer" />
              {CARDS.map(c => (
                <figure className="card" key={c.text}>
                  <img src={c.src} alt="" />
                  <figcaption>{c.text}</figcaption>
                </figure>
              ))}
              <div className="spacer" />
            </div>
          </>
        ) : (
          <div className="landing">
            <div className="landing__bg">
              <LiquidEther isBounce />
            </div>

            <div className="landing__nav">
              <GlassSurface className="custom-glass-surface" width="90%" height={60} {...DEFAULT_PROPS}>
                <img src="/logo.svg" alt="React Bits" style={{ height: 24, borderRadius: 50 }} />
                <div className="landing__links">
                  <span>Home</span>
                  <span>Docs</span>
                </div>
                <div className="landing__burger">
                  <TbMenu size={20} />
                </div>
              </GlassSurface>
            </div>

            <div className="landing__hero">
              <GlassSurface height={40} width={160} {...DEFAULT_PROPS}>
                <TbBackground />
                <span style={{ marginLeft: 4 }}>Super Shiny</span>
              </GlassSurface>

              <h1>The summer of glass, thanks a lot Apple!</h1>

              <div className="landing__cta">
                <button className="solid">Get Started</button>
                <GlassSurface height={44.98} width={154.31} {...DEFAULT_PROPS} borderRadius={100}>
                  Learn More
                </GlassSurface>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
