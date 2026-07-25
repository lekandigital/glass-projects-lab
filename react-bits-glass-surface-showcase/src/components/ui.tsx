import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Cost } from '../lib/config';

export const SHARED_VIDEO_URL = 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4';

export function CostBadge({ cost }: { cost: Cost }) {
  const text: Record<Cost, string> = {
    map: 'regenerates map',
    filter: 'filter attr',
    css: 'css var'
  };
  const title: Record<Cost, string> = {
    map: 'Rebuilds the SVG, re-encodes it, and makes the browser decode a fresh image.',
    filter: 'Should only be a setAttribute — but the effect regenerates the map anyway. See §4.',
    css: 'A CSS custom property. Not in the effect deps, so nothing else runs.'
  };
  return (
    <span className={`badge badge--${cost}`} title={title[cost]}>
      {text[cost]}
    </span>
  );
}

export function Section({
  id,
  num,
  title,
  lede,
  children
}: {
  id: string;
  num: number;
  title: string;
  lede: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="section" id={id} data-section={num}>
      <div className="section__head">
        <span className="section__num">{String(num).padStart(2, '0')}</span>
        <h2>{title}</h2>
      </div>
      <p className="section__lede">{lede}</p>
      {children}
    </section>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (document.documentElement.dataset.theme as 'light' | 'dark') ?? 'dark'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    // GlassSurface's stylesheet resolves its frost and inner shadows through light-dark(),
    // which reads color-scheme — not our data-theme attribute.
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('gs-theme', theme);
  }, [theme]);

  return (
    <button
      className="btn"
      data-testid="theme-toggle"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
    >
      {theme === 'dark' ? '☾ Dark' : '☀ Light'}
    </button>
  );
}

export function CodeBlock({ code, label = 'Copy' }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard is origin-gated; the code is selectable either way.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="code">
      <button className="code__copy" onClick={copy} data-testid="copy-button">
        {copied ? '✓ Copied' : label}
      </button>
      <pre data-testid="generated-code">{code}</pre>
    </div>
  );
}

/**
 * Wraps a FluidGlass canvas. Two jobs, both forced by the component's design:
 * it mounts a WebGL context per instance (so we defer until scrolled into view),
 * and it mounts its own ScrollControls (so an inert veil keeps a page full of them
 * from hijacking the page scroll until you ask one to).
 */
export function Stage({
  className = '',
  tag,
  active,
  onActivate,
  height,
  children,
  eager = false
}: {
  className?: string;
  tag?: string;
  active: boolean;
  onActivate?: () => void;
  height?: number | string;
  children: ReactNode;
  eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (eager || !ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [eager]);

  return (
    <div
      ref={ref}
      className={`stage ${className}`}
      style={{ height, pointerEvents: active ? 'auto' : 'none' }}
      data-active={active}
    >
      {tag && <span className="stage__tag">{tag}</span>}
      {visible ? children : null}
      {!active && onActivate && (
        <button
          className="stage__veil"
          style={{ pointerEvents: 'auto' }}
          onClick={onActivate}
          data-testid="stage-activate"
        >
          <span>Click to interact</span>
        </button>
      )}
    </div>
  );
}

export function BackdropVideo() {
  return (
    <video className="bd__video" src={SHARED_VIDEO_URL} autoPlay muted loop playsInline aria-hidden />
  );
}
