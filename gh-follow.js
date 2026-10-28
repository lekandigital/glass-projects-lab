// "Follow on GitHub" tab, docked to the right edge of every glass-projects-lab page.
// The root catalog tags its own pages with it at build time (scripts/tag-pages.mjs) and every
// sub-project loads https://cdn.jsdelivr.net/gh/lekandigital/glass-projects-lab@main/gh-follow.js
// (scripts/tag-subprojects.py), so editing this file and pushing main updates it everywhere;
// purge jsDelivr after the push (command in tag-subprojects.py) to skip its 12 h branch cache.
//
// Behaviour: the tab is always visible and is itself a one-click link to the profile. Once
// per session, after real engagement (12 s with an interaction, 30 s without, or the mouse
// heading for the tab bar) it opens into a card with the pitch, then folds back into the tab.
// Shadow DOM keeps it out of the demo's styles, and it mounts after `load` so it never races a
// framework's hydration. Top-level pages only: framed demos don't get one per frame.
(() => {
  if (window.top !== window.self || window.__ghFollow) return;
  window.__ghFollow = {};

  const USER = 'lekandigital';
  const PROFILE = `https://github.com/${USER}`;
  const REPO = `https://github.com/${USER}/glass-projects-lab`;
  const AVATAR = 'https://avatars.githubusercontent.com/u/12865911?v=4&s=96';
  const CATALOG = location.hostname === 'glass-projects-lab.vercel.app' && /^\/(index\.html)?$/.test(location.pathname);
  const PITCH = CATALOG
    ? 'I curate this lab: 60+ liquid-glass, Aero and refraction demos, each traced back to its source. Follow to catch the next ones.'
    : 'This demo is one of 60+ in my glass lab, and I keep adding more. Follow on GitHub to catch the next ones.';
  const MARK = '<svg class="mark" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>';

  const CSS = `
.w {
  position: fixed; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;
  font: 500 13px/1.3 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #fff; -webkit-font-smoothing: antialiased;
}
.tab, .card { pointer-events: auto; }
.glass {
  background: linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,.02)), rgba(17,17,24,.74);
  -webkit-backdrop-filter: blur(18px) saturate(170%); backdrop-filter: blur(18px) saturate(170%);
  border: 1px solid rgba(255,255,255,.22);
  box-shadow: 0 12px 32px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.28), inset 0 -1px 0 rgba(0,0,0,.25);
}
.tab {
  position: absolute; right: 0; top: 50%; transform: translateY(-50%);
  display: flex; align-items: center; gap: 10px; overflow: hidden;
  padding: 8px 14px 8px 8px; border-right: 0; border-radius: 18px 0 0 18px;
  color: inherit; text-decoration: none; cursor: pointer;
  animation: slide-in .6s cubic-bezier(.2,.9,.2,1) both;
  transition: padding .25s ease;
}
.tab:hover, .tab:focus-visible { padding-right: 20px; }
.tab::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; transform: translateX(-120%);
  background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.42) 50%, transparent 65%);
}
.tab.shine::after { animation: shine 1.1s ease-in-out; }
.av { width: 36px; height: 36px; border-radius: 50%; flex: none; background: #30363d; box-shadow: 0 0 0 2px rgba(255,255,255,.55); }
.tx { display: grid; gap: 1px; }
.tx b { font-size: 13.5px; font-weight: 650; white-space: nowrap; }
.tx span, .who span { font-size: 12px; opacity: .72; }
.short { display: none; }
.mark { width: 18px; height: 18px; flex: none; fill: currentColor; }
.card {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  box-sizing: border-box; width: 290px; padding: 16px; border-radius: 22px;
  animation: pop .45s cubic-bezier(.2,.9,.2,1) both;
}
.tab[hidden], .card[hidden] { display: none; }
.who { display: flex; align-items: center; gap: 10px; margin-right: 28px; }
.who .av { width: 42px; height: 42px; }
.who b { display: block; font-size: 15px; font-weight: 650; }
.card h2 { margin: 14px 0 4px; font-size: 17px; font-weight: 700; line-height: 1.25; letter-spacing: -.01em; }
.card p { margin: 0 0 14px; font-size: 13px; font-weight: 450; line-height: 1.45; opacity: .84; }
.cta {
  display: flex; align-items: center; justify-content: center; gap: 8px; height: 40px; border-radius: 12px;
  background: #fff; color: #0d1117; font-size: 14px; font-weight: 650; text-decoration: none;
  box-shadow: 0 6px 18px rgba(0,0,0,.25); transition: transform .15s ease, box-shadow .15s ease;
}
.cta:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(0,0,0,.3); }
.star { display: block; margin-top: 10px; color: inherit; font-size: 12.5px; text-align: center; text-decoration: none; opacity: .75; }
.star:hover { opacity: 1; text-decoration: underline; }
.x {
  position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%;
  background: rgba(255,255,255,.12); color: inherit; font: inherit; font-size: 17px; line-height: 28px; cursor: pointer;
}
.x:hover { background: rgba(255,255,255,.22); }
:focus-visible { outline: 2px solid #58a6ff; outline-offset: 2px; }
@keyframes slide-in { from { transform: translate(110%, -50%); } }
@keyframes pop { from { opacity: 0; transform: translate(24px, -50%) scale(.97); } }
@keyframes pop-up { from { opacity: 0; transform: translateY(16px); } }
@keyframes shine { to { transform: translateX(120%); } }
@media (max-width: 640px) {
  .tab { gap: 7px; padding: 6px 10px 6px 6px; border-radius: 16px 0 0 16px; }
  .tab .av { width: 30px; height: 30px; }
  .tab .mark { width: 16px; height: 16px; }
  .long, .tx span { display: none; }
  .short { display: inline; }
  .card { left: 12px; right: 12px; top: auto; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); width: auto; transform: none; animation-name: pop-up; }
}
@media (prefers-reduced-motion: reduce) {
  .tab, .card, .tab.shine::after { animation: none; }
  .tab, .cta { transition: none; }
}
@media print { .w { display: none; } }`;

  const get = (store, key) => { try { return window[store].getItem(key); } catch { return null; } };
  const set = (store, key) => { try { window[store].setItem(key, '1'); } catch {} };
  const track = (event, props) => { try { window.posthog?.capture(event, { widget: 'gh-follow', ...props }); } catch {} };

  let tab, card, autoClose, shown = false, touched = false, visible = 0;

  function shine() {
    tab.classList.remove('shine');
    void tab.offsetWidth;
    tab.classList.add('shine');
  }

  function open(trigger) {
    if (!card || shown) return;
    shown = true;
    if (trigger !== 'manual' && (get('sessionStorage', 'ghf:shown') || get('localStorage', 'ghf:clicked'))) return;
    set('sessionStorage', 'ghf:shown');
    tab.hidden = true;
    card.hidden = false;
    track('gh_follow_card_shown', { trigger });
    autoClose = setTimeout(() => close('timeout'), 15000);
  }

  function close(reason) {
    if (card.hidden) return;
    clearTimeout(autoClose);
    card.hidden = true;
    tab.hidden = false;
    shine();
    track('gh_follow_card_closed', { reason });
  }

  function follow(from) {
    set('localStorage', 'ghf:clicked');
    track('gh_follow_click', { from });
  }

  function mount() {
    const host = document.createElement('gh-follow');
    host.style.cssText = 'all:initial!important;display:block!important;position:fixed!important;top:0!important;right:0!important;width:0!important;height:0!important;z-index:2147483646!important';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style><div class="w">
  <a class="tab glass" href="${PROFILE}" target="_blank" rel="noopener" aria-label="Follow Lekan (@${USER}) on GitHub">
    <img class="av" src="${AVATAR}" alt="" width="36" height="36">
    <span class="tx"><b class="long">Follow on GitHub</b><b class="short">Follow</b><span translate="no">@${USER}</span></span>
    ${MARK}
  </a>
  <aside class="card glass" aria-label="Follow Lekan on GitHub" hidden>
    <button class="x" type="button" aria-label="Minimize">×</button>
    <div class="who"><img class="av" src="${AVATAR}" alt="" width="42" height="42"><div><b>Lekan</b><span translate="no">@${USER}</span></div></div>
    <h2>Enjoying the glass?</h2>
    <p>${PITCH}</p>
    <a class="cta" href="${PROFILE}" target="_blank" rel="noopener">${MARK}Follow on GitHub</a>
    <a class="star" href="${REPO}" target="_blank" rel="noopener">★ Star the lab on GitHub</a>
  </aside>
</div>`;
    tab = root.querySelector('.tab');
    card = root.querySelector('.card');

    // A page wider than the phone (or pinch zoom) makes the layout viewport bigger than the
    // screen, which pushes `position: fixed` off the visible edge. Track the visual viewport then.
    const w = root.querySelector('.w');
    const vv = window.visualViewport;
    const fit = () => {
      w.style.cssText = '';
      if (vv.scale > 1.01 || Math.abs(w.getBoundingClientRect().width - vv.width) > 1) {
        w.style.cssText = `left:${vv.offsetLeft}px;top:${vv.offsetTop}px;width:${vv.width}px;height:${vv.height}px`;
      }
    };
    if (vv) {
      fit();
      vv.addEventListener('resize', fit);
      vv.addEventListener('scroll', fit);
    }
    tab.addEventListener('click', () => follow('tab'));
    root.querySelector('.cta').addEventListener('click', () => { follow('card'); setTimeout(() => close('followed'), 400); });
    root.querySelector('.star').addEventListener('click', () => track('gh_star_click'));
    root.querySelector('.x').addEventListener('click', () => close('dismissed'));
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape') close('dismissed'); });
    card.addEventListener('pointerenter', () => clearTimeout(autoClose));
    card.addEventListener('pointerleave', () => { autoClose = setTimeout(() => close('timeout'), 5000); });

    // Some apps render straight into <body> and wipe it; put the tab back if that happens.
    const attach = () => { if (!host.isConnected) (document.body || document.documentElement).appendChild(host); };
    attach();
    setInterval(attach, 2000);
    setTimeout(shine, 2500);
    setInterval(() => { if (!document.hidden && card.hidden) shine(); }, 20000);

    const timer = setInterval(() => {
      if (shown) return clearInterval(timer);
      if (document.visibilityState !== 'visible') return;
      visible++;
      if (visible >= 30 || (touched && visible >= 12)) open('engaged');
    }, 1000);
    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget && e.clientY <= 0 && visible >= 4) open('exit-intent');
    });
    window.__ghFollow.open = () => { shown = false; open('manual'); };
  }

  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll']) {
    addEventListener(type, () => { touched = true; }, { capture: true, passive: true });
  }
  const later = () => ('requestIdleCallback' in window ? requestIdleCallback(mount, { timeout: 1500 }) : setTimeout(mount, 300));
  if (document.readyState === 'complete') later();
  else addEventListener('load', later, { once: true });
})();
