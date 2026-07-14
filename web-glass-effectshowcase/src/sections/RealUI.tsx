import { LiquidGlass, LiquidSlider, LiquidSwitch } from "@creatorem/web-glass-effect";
import { useMotionValue, useSpring } from "motion/react";
import { useRef, useState } from "react";
import { GLASS_EFFECTS } from "../config";
import { Section } from "../ui";

/* ------------------------------------------------------------------ *
 * Ported verbatim from the library's own
 *   apps/next-demo/app/components/liquid-glass-demo.tsx
 * Same markup, same class names, same GLASS_EFFECTS constants (imported from
 * config.ts, the single source of truth). Only the Next <Image>/lucide imports
 * are swapped for <img> and inline SVG — the glass behaviour is untouched.
 * ------------------------------------------------------------------ */

function Icon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
const ARROW_UP = "M12 19V5M5 12l7-7 7 7";
const ARROW_DOWN = "M12 5v14M19 12l-7 7-7-7";
const SEARCH = "M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z";

function ITunesDemo() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isSearchFocused = useMotionValue(false);

  const navTopButtonBlur = useSpring(GLASS_EFFECTS.NAV_BLUR_DEFAULT, GLASS_EFFECTS.SPRING_CONFIG);
  const navTopButtonRefractiveIndex = useSpring(
    GLASS_EFFECTS.NAV_REFRACTIVE_INDEX_DEFAULT,
    GLASS_EFFECTS.SPRING_CONFIG,
  );
  const navBottomButtonBlur = useSpring(GLASS_EFFECTS.NAV_BLUR_DEFAULT, GLASS_EFFECTS.SPRING_CONFIG);
  const navBottomButtonRefractiveIndex = useSpring(
    GLASS_EFFECTS.NAV_REFRACTIVE_INDEX_DEFAULT,
    GLASS_EFFECTS.SPRING_CONFIG,
  );

  const bottomBarBlur = useSpring(GLASS_EFFECTS.BOTTOM_BAR_BLUR_DEFAULT, GLASS_EFFECTS.SPRING_CONFIG);
  const bottomBarRefractiveIndex = useSpring(
    GLASS_EFFECTS.BOTTOM_BAR_REFRACTIVE_INDEX_DEFAULT,
    GLASS_EFFECTS.SPRING_CONFIG,
  );

  const handleTopNavHover = (isHovered: boolean) => {
    navTopButtonBlur.set(isHovered ? GLASS_EFFECTS.NAV_BLUR_HOVER : GLASS_EFFECTS.NAV_BLUR_DEFAULT);
    navTopButtonRefractiveIndex.set(
      isHovered ? GLASS_EFFECTS.NAV_REFRACTIVE_INDEX_HOVER : GLASS_EFFECTS.NAV_REFRACTIVE_INDEX_DEFAULT,
    );
  };

  const handleBottomNavHover = (isHovered: boolean) => {
    navBottomButtonBlur.set(isHovered ? GLASS_EFFECTS.NAV_BLUR_HOVER : GLASS_EFFECTS.NAV_BLUR_DEFAULT);
    navBottomButtonRefractiveIndex.set(
      isHovered ? GLASS_EFFECTS.NAV_REFRACTIVE_INDEX_HOVER : GLASS_EFFECTS.NAV_REFRACTIVE_INDEX_DEFAULT,
    );
  };

  const handleBottomBarHover = (isHovered: boolean) => {
    bottomBarBlur.set(
      isHovered
        ? GLASS_EFFECTS.BOTTOM_BAR_BLUR_HOVER
        : isSearchFocused.get()
          ? GLASS_EFFECTS.BOTTOM_BAR_BLUR_SEARCH_FOCUSED
          : GLASS_EFFECTS.BOTTOM_BAR_BLUR_DEFAULT,
    );
    bottomBarRefractiveIndex.set(
      isHovered
        ? GLASS_EFFECTS.BOTTOM_BAR_REFRACTIVE_INDEX_HOVER
        : isSearchFocused.get()
          ? GLASS_EFFECTS.BOTTOM_BAR_REFRACTIVE_INDEX_SEARCH_FOCUSED
          : GLASS_EFFECTS.BOTTOM_BAR_REFRACTIVE_INDEX_DEFAULT,
    );
  };

  const handleSearchFocus = (isFocused: boolean) => {
    isSearchFocused.set(isFocused);
    bottomBarBlur.set(isFocused ? GLASS_EFFECTS.BOTTOM_BAR_BLUR_SEARCH_FOCUSED : GLASS_EFFECTS.BOTTOM_BAR_BLUR_DEFAULT);
    bottomBarRefractiveIndex.set(
      isFocused
        ? GLASS_EFFECTS.BOTTOM_BAR_REFRACTIVE_INDEX_SEARCH_FOCUSED
        : GLASS_EFFECTS.BOTTOM_BAR_REFRACTIVE_INDEX_DEFAULT,
    );
  };

  const scrollToTop = () => scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: "smooth" });
  };

  const imageIds = [973, 979, 901, 894, 900, 896, 859, 902, 684, 976, 11, 12];

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-lg bg-neutral-50">
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
        <LiquidGlass
          className="flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-[26px] bg-white/20 hover:bg-white/35"
          onClick={scrollToTop}
          onMouseEnter={() => handleTopNavHover(true)}
          onMouseLeave={() => handleTopNavHover(false)}
          glassThickness={110}
          bezelWidth={20}
          refractiveIndex={navTopButtonRefractiveIndex}
          blur={navTopButtonBlur}
          specularOpacity={0.9}
        >
          <span className="text-black/80" data-testid="itunes-scrolltop">
            <Icon d={ARROW_UP} />
          </span>
        </LiquidGlass>

        <LiquidGlass
          className="flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-[26px] bg-white/20 hover:bg-white/35"
          onClick={scrollToBottom}
          onMouseEnter={() => handleBottomNavHover(true)}
          onMouseLeave={() => handleBottomNavHover(false)}
          glassThickness={110}
          bezelWidth={20}
          refractiveIndex={navBottomButtonRefractiveIndex}
          blur={navBottomButtonBlur}
          specularOpacity={0.9}
        >
          <span className="text-black/80">
            <Icon d={ARROW_DOWN} />
          </span>
        </LiquidGlass>
      </div>

      <div ref={scrollContainerRef} className="no-scrollbar h-full w-full overflow-auto">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {imageIds.map((id) => (
            <div key={id} className="relative overflow-hidden rounded-lg shadow-lg">
              <img
                src={`https://picsum.photos/id/${id}/400/600`}
                alt={`Portfolio image ${id}`}
                className="h-auto w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute right-4 bottom-4 left-4 z-10">
        <LiquidGlass
          className="bg-white/20 px-4 py-3 shadow-2xl"
          style={{ borderRadius: 28 }}
          onMouseEnter={() => handleBottomBarHover(true)}
          onMouseLeave={() => handleBottomBarHover(false)}
          glassThickness={110}
          bezelWidth={20}
          refractiveIndex={bottomBarRefractiveIndex}
          blur={bottomBarBlur}
          specularOpacity={0.9}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-black/80">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium">W</span>
                <input
                  type="number"
                  value={400}
                  readOnly
                  className="h-6 w-16 rounded-full border border-black/10 bg-white/20 px-2 text-xs text-black outline-none"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium">H</span>
                <input
                  type="number"
                  value={600}
                  readOnly
                  className="h-6 w-16 rounded-full border border-black/10 bg-white/20 px-2 text-xs text-black outline-none"
                />
              </div>
            </div>

            <div className="relative flex-1">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-black/60">
                <Icon d={SEARCH} size={16} />
              </span>
              <input
                type="text"
                placeholder="Search images..."
                onFocus={() => handleSearchFocus(true)}
                onBlur={() => handleSearchFocus(false)}
                data-testid="itunes-search"
                className="h-8 w-full rounded-full border border-black/10 bg-white/20 pl-10 text-black placeholder:text-black/50 outline-none"
              />
            </div>
          </div>
        </LiquidGlass>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * LiquidSlider + LiquidSwitch — the two packaged controls, interactive, on
 * the animated-grid backdrop the upstream slider demo uses.
 * ------------------------------------------------------------------ */

function AnimatedGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-30"
      style={{
        backgroundImage:
          "linear-gradient(to right, var(--grid-line) 1px, transparent 1px)," +
          "linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />
  );
}

function ControlsDemo() {
  const [slider, setSlider] = useState(30);
  const [checked, setChecked] = useState(true);
  const [checkedForced, setCheckedForced] = useState(false);

  return (
    <div className="relative flex min-h-[280px] flex-col items-center justify-center gap-10 overflow-hidden rounded-lg p-8">
      <AnimatedGrid />

      <div className="relative z-10 flex flex-col items-center gap-3">
        <p className="group-blurb" style={{ margin: 0 }}>
          LiquidSlider — value {slider}
        </p>
        <div data-testid="real-slider">
          <LiquidSlider value={slider} onValueChange={setSlider} min={0} max={100} size="md" />
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-center gap-10">
        <div className="flex flex-col items-center gap-3">
          <p className="group-blurb" style={{ margin: 0 }}>
            LiquidSwitch — {checked ? "on" : "off"}
          </p>
          <div data-testid="real-switch">
            <LiquidSwitch checked={checked} onCheckedChange={setChecked} size="lg" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="group-blurb" style={{ margin: 0 }}>
            forceActive — highlight pinned on
          </p>
          <LiquidSwitch checked={checkedForced} onCheckedChange={setCheckedForced} size="lg" forceActive />
        </div>
      </div>
    </div>
  );
}

export function RealUI() {
  return (
    <Section
      id="real-ui"
      num={6}
      title="In real UI"
      lede={
        <>
          The library as shipping components, not swatches. The panel below is the library's own
          image-browser demo, ported byte-for-byte from{" "}
          <code>apps/next-demo/.../liquid-glass-demo.tsx</code> — same markup, same class names, same{" "}
          <code>GLASS_EFFECTS</code> constants (imported from <code>config.ts</code>). Hover the nav
          buttons and focus the search field: <code>refractiveIndex</code> and <code>blur</code>{" "}
          spring between the exact values the original uses.
        </>
      }
    >
      <div className="panel" style={{ padding: 16 }}>
        <ITunesDemo />
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h4>Packaged controls</h4>
          <span className="badge neutral">LiquidSlider · LiquidSwitch</span>
        </div>
        <ControlsDemo />
      </div>

      <div className="note">
        <strong>Two rough edges you'll hit with these controls.</strong> <code>LiquidSlider</code>{" "}
        logs <code>console.warn("COMPUTE LEFT")</code> on every position recompute — open the
        console and drag. And unlike <code>LiquidSwitch</code>, the slider hardcodes{" "}
        <code>blur</code>/<code>specularOpacity</code>/<code>specularSaturation</code> internally, so
        those aren't props you can pass.
      </div>
    </Section>
  );
}
