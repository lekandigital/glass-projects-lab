import { LiquidFilter } from "@creatorem/web-glass-effect";
import { motion, useMotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  COST_BLURB,
  COST_LABEL,
  LIBRARY_DEFAULTS,
  OPTIONS,
  PRESETS,
  PRESET_GROUP,
  PRESET_GROUP_LABEL,
  PRESET_KEYS,
  SURFACES,
  type BackdropKey,
  type Cost,
  type GlassConfig,
  type PresetGroup,
  type PresetKey,
} from "../config";
import {
  Backdrop,
  BackdropPicker,
  CodeBlock,
  CostBadge,
  Section,
  Slider,
  SurfacePicker,
  generateCode,
} from "../ui";

const GROUPS: Cost[] = ["attribute", "displacement", "both"];
const PRESET_GROUPS: PresetGroup[] = ["look", "upstream"];

export function Playground() {
  const [cfg, setCfg] = useState<GlassConfig>(PRESETS.stressPanel.config);
  const [active, setActive] = useState<PresetKey | null>("stressPanel");
  const [backdrop, setBackdrop] = useState<BackdropKey>("grid");

  // scaleRatio is typed MotionValue<number> only — there is no plain-number path.
  const scaleRatio = useMotionValue(cfg.scaleRatio);
  useEffect(() => {
    scaleRatio.set(cfg.scaleRatio);
  }, [cfg.scaleRatio, scaleRatio]);

  const applyPreset = (key: PresetKey) => {
    setCfg(PRESETS[key].config);
    setActive(key);
  };

  const set = <K extends keyof GlassConfig>(k: K, v: GlassConfig[K]) => {
    setCfg((c) => ({ ...c, [k]: v }));
    setActive(null); // a hand-tuned config is no longer "wearing" a preset
  };

  const code = useMemo(() => generateCode(cfg, LIBRARY_DEFAULTS), [cfg]);

  const canvasW = cfg.width + cfg.canvasPad * 2;
  const canvasH = cfg.height + cfg.canvasPad * 2;

  const clampedBezel = Math.max(Math.min(cfg.bezelWidth, 2 * cfg.radius - 1), 0);
  const bezelClamped = clampedBezel !== cfg.bezelWidth;

  const stageRef = useRef<HTMLDivElement>(null);

  return (
    <Section
      id="playground"
      num={1}
      title="Playground"
      lede={
        <>
          Every option <code>LiquidFilter</code> accepts, live. <strong>Drag the glass</strong>{" "}
          anywhere over the backdrop. Controls are grouped by what a change actually costs — read off{" "}
          <code>filter.tsx</code>, not guessed. This drives <code>LiquidFilter</code> rather than{" "}
          <code>LiquidGlass</code>, because <code>scaleRatio</code>, <code>canvasWidth</code> and{" "}
          <code>canvasHeight</code> are not forwarded by <code>LiquidGlass</code> and would otherwise
          be unreachable.
        </>
      }
    >
      <div className="split">
        <div>
          <div className="stage" style={{ minHeight: 480 }} ref={stageRef}>
            <Backdrop kind={backdrop} />
            <span className="drag-hint">drag me</span>
            <LiquidFilter
              id="playground-filter"
              width={cfg.width}
              height={cfg.height}
              radius={cfg.radius}
              canvasWidth={canvasW}
              canvasHeight={canvasH}
              glassThickness={cfg.glassThickness}
              bezelWidth={cfg.bezelWidth}
              refractiveIndex={cfg.refractiveIndex}
              blur={cfg.blur}
              specularOpacity={cfg.specularOpacity}
              specularSaturation={cfg.specularSaturation}
              bezelHeightFn={SURFACES[cfg.surface].fn}
              scaleRatio={scaleRatio}
              dpr={cfg.dpr}
            />
            <motion.div
              className="draggable stage-content"
              drag
              dragConstraints={stageRef}
              dragElastic={0.04}
              dragMomentum={false}
              data-testid="playground-surface"
              style={{
                width: cfg.width,
                height: cfg.height,
                borderRadius: cfg.radius,
                backdropFilter: "url(#playground-filter)",
                WebkitBackdropFilter: "url(#playground-filter)",
                boxShadow: "0 3px 14px rgba(0,0,0,0.1)",
              }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <BackdropPicker value={backdrop} onChange={setBackdrop} />
          </div>

          {bezelClamped && (
            <div className="note">
              <strong>bezelWidth silently clamped to {clampedBezel}.</strong> LiquidFilter caps it
              at <code>2·radius − 1</code> = {2 * cfg.radius - 1}. Your {cfg.bezelWidth} is being
              discarded — raise the radius to get it back.
            </div>
          )}

          <h4 style={{ margin: "28px 0 8px", fontSize: "var(--step--1)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-2)" }}>
            Generated code
          </h4>
          <CodeBlock code={code} />
        </div>

        <div className="panel pad">
          {PRESET_GROUPS.map((group) => (
            <div className="preset-group" key={group}>
              <h4>{PRESET_GROUP_LABEL[group]}</h4>
              <div className="presets">
                {PRESET_KEYS.filter((k) => PRESET_GROUP[k] === group).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`preset${group === "upstream" ? " demo" : ""}${active === k ? " on" : ""}`}
                    aria-pressed={active === k}
                    title={PRESETS[k].blurb}
                    onClick={() => applyPreset(k)}
                  >
                    {PRESETS[k].label.replace("Upstream: ", "")}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {GROUPS.map((cost) => {
            const opts = OPTIONS.filter((o) => o.cost === cost);
            if (!opts.length) return null;
            return (
              <div key={cost}>
                <div className="group-head">
                  <h4>{COST_LABEL[cost]}</h4>
                  <CostBadge cost={cost} />
                </div>
                <p className="group-blurb">{COST_BLURB[cost]}</p>
                {opts.map((spec) =>
                  spec.key === "surface" ? (
                    <SurfacePicker
                      key={spec.key}
                      spec={spec}
                      value={cfg.surface}
                      onChange={(v) => set("surface", v)}
                    />
                  ) : (
                    <Slider
                      key={spec.key}
                      spec={spec}
                      value={cfg[spec.key] as number}
                      onChange={(v) => set(spec.key, v as never)}
                    />
                  ),
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
