import { generateDisplacementMap, supportsSVGFilters } from './displacement';
import type { SurfaceProps } from './config';

/**
 * GlassSurface's non-React core is... nothing. There isn't one — but there also isn't a
 * single line of the technique that needs React. It is a <div>, an inline <svg> filter, and
 * a `backdrop-filter: url(#id)`. This builds exactly that on plain DOM, with the component's
 * own filter graph, so the effect can be used from anywhere.
 *
 * The two things this adds that the React version doesn't have: a real teardown (the
 * component leaves its ResizeObservers to the effect cleanup, but registers two of them),
 * and an imperative `update()` that skips the regeneration when no map-prop changed.
 */
export interface VanillaHandle {
  update: (next: Partial<Required<SurfaceProps>>) => void;
  /** Number of times the displacement map has actually been regenerated. */
  regenerations: () => number;
  dispose: () => void;
  supported: boolean;
}

type Opts = Required<Omit<SurfaceProps, 'width' | 'height'>> & { width: number; height: number };

/** Only these feed generateDisplacementMap. Anything else can skip the rebuild entirely. */
const MAP_KEYS = ['width', 'height', 'borderRadius', 'borderWidth', 'brightness', 'opacity', 'blur', 'mixBlendMode'] as const;

const NS = 'http://www.w3.org/2000/svg';

export function mountVanillaGlass(host: HTMLElement, initial: Opts): VanillaHandle {
  const uid = `v-${Math.random().toString(36).slice(2, 8)}`;
  let o: Opts = { ...initial };
  let regens = 0;

  const el = document.createElement('div');
  el.className = 'vglass';

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'vglass__filter');

  const defs = document.createElementNS(NS, 'defs');
  const filter = document.createElementNS(NS, 'filter');
  filter.setAttribute('id', uid);
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  filter.setAttribute('x', '0%');
  filter.setAttribute('y', '0%');
  filter.setAttribute('width', '100%');
  filter.setAttribute('height', '100%');

  const feImage = document.createElementNS(NS, 'feImage');
  feImage.setAttribute('x', '0');
  feImage.setAttribute('y', '0');
  feImage.setAttribute('width', '100%');
  feImage.setAttribute('height', '100%');
  feImage.setAttribute('preserveAspectRatio', 'none');
  feImage.setAttribute('result', 'map');
  filter.appendChild(feImage);

  // One displacement pass per channel, each isolated with a colour matrix, then screened
  // back together — the same six primitives the component declares in JSX.
  const MATRICES: Record<string, string> = {
    R: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
    G: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
    B: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0'
  };

  const displacers: Record<'R' | 'G' | 'B', SVGFEDisplacementMapElement> = {} as never;

  for (const ch of ['R', 'G', 'B'] as const) {
    const disp = document.createElementNS(NS, 'feDisplacementMap');
    disp.setAttribute('in', 'SourceGraphic');
    disp.setAttribute('in2', 'map');
    disp.setAttribute('result', `disp${ch}`);
    filter.appendChild(disp);
    displacers[ch] = disp;

    const cm = document.createElementNS(NS, 'feColorMatrix');
    cm.setAttribute('in', `disp${ch}`);
    cm.setAttribute('type', 'matrix');
    cm.setAttribute('values', MATRICES[ch]);
    cm.setAttribute('result', ch.toLowerCase());
    filter.appendChild(cm);
  }

  const blend1 = document.createElementNS(NS, 'feBlend');
  blend1.setAttribute('in', 'r');
  blend1.setAttribute('in2', 'g');
  blend1.setAttribute('mode', 'screen');
  blend1.setAttribute('result', 'rg');
  filter.appendChild(blend1);

  const blend2 = document.createElementNS(NS, 'feBlend');
  blend2.setAttribute('in', 'rg');
  blend2.setAttribute('in2', 'b');
  blend2.setAttribute('mode', 'screen');
  blend2.setAttribute('result', 'output');
  filter.appendChild(blend2);

  const gauss = document.createElementNS(NS, 'feGaussianBlur');
  gauss.setAttribute('in', 'output');
  filter.appendChild(gauss);

  defs.appendChild(filter);
  svg.appendChild(defs);
  el.appendChild(svg);

  const content = document.createElement('div');
  content.className = 'vglass__content';
  el.appendChild(content);

  const supported = supportsSVGFilters();
  el.classList.add(supported ? 'vglass--svg' : 'vglass--fallback');
  host.appendChild(el);

  const regenerate = () => {
    regens++;
    feImage.setAttribute(
      'href',
      generateDisplacementMap(
        {
          width: o.width,
          height: o.height,
          borderRadius: o.borderRadius,
          borderWidth: o.borderWidth,
          brightness: o.brightness,
          opacity: o.opacity,
          blur: o.blur,
          mixBlendMode: o.mixBlendMode
        },
        uid
      )
    );
  };

  const applyFilterAttrs = () => {
    const offsets = { R: o.redOffset, G: o.greenOffset, B: o.blueOffset };
    for (const ch of ['R', 'G', 'B'] as const) {
      displacers[ch].setAttribute('scale', String(o.distortionScale + offsets[ch]));
      displacers[ch].setAttribute('xChannelSelector', o.xChannel);
      displacers[ch].setAttribute('yChannelSelector', o.yChannel);
    }
    gauss.setAttribute('stdDeviation', String(o.displace));
  };

  const applyStyle = () => {
    el.style.width = `${o.width}px`;
    el.style.height = `${o.height}px`;
    el.style.borderRadius = `${o.borderRadius}px`;
    el.style.setProperty('--glass-frost', String(o.backgroundOpacity));
    el.style.setProperty('--glass-saturation', String(o.saturation));
    el.style.setProperty('--filter-id', `url(#${uid})`);
  };

  applyStyle();
  applyFilterAttrs();
  regenerate();

  // One observer, not two — the component registers the identical effect twice. And it is
  // seeded with the size we just generated at, because a ResizeObserver always delivers an
  // initial observation for the element's *current* size, which is not a resize.
  let lastW = Math.round(o.width);
  let lastH = Math.round(o.height);

  const ro = new ResizeObserver(entries => {
    const r = entries[0].contentRect;
    const w = Math.round(r.width);
    const h = Math.round(r.height);
    if (w === lastW && h === lastH) return;
    lastW = w;
    lastH = h;
    regenerate();
  });
  ro.observe(el);

  return {
    supported,
    regenerations: () => regens,
    update(next) {
      const needsMap = MAP_KEYS.some(k => k in next && next[k] !== o[k]);
      o = { ...o, ...next } as Opts;
      applyStyle();
      applyFilterAttrs();
      // The React component regenerates on *any* prop change, because every prop is in the
      // effect's dependency array. Here the rebuild is skipped when nothing it reads moved.
      if (needsMap) regenerate();
    },
    dispose() {
      ro.disconnect();
      el.remove();
    }
  };
}

export { MAP_KEYS };
