import { LiquidFilter } from "@creatorem/web-glass-effect";
import { useMotionValue } from "motion/react";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { SURFACES, type GlassConfig } from "./config";

/**
 * A GlassConfig rendered exactly as the config says, with no props dropped.
 *
 * LiquidGlass is the ergonomic entry point but it forwards only 8 of LiquidFilter's
 * options — scaleRatio, canvasWidth and canvasHeight never reach it. Sections that
 * need those (and the gallery, which must render every preset faithfully) go one
 * level down to LiquidFilter + a backdrop-filtered div, which is all LiquidGlass
 * does anyway.
 */
export function GlassSurface({
  id,
  config,
  style,
  children,
}: {
  id: string;
  config: GlassConfig;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const scaleRatio = useMotionValue(config.scaleRatio);
  useEffect(() => {
    scaleRatio.set(config.scaleRatio);
  }, [config.scaleRatio, scaleRatio]);

  return (
    <>
      <LiquidFilter
        id={id}
        width={config.width}
        height={config.height}
        radius={config.radius}
        canvasWidth={config.width + config.canvasPad * 2}
        canvasHeight={config.height + config.canvasPad * 2}
        glassThickness={config.glassThickness}
        bezelWidth={config.bezelWidth}
        refractiveIndex={config.refractiveIndex}
        blur={config.blur}
        specularOpacity={config.specularOpacity}
        specularSaturation={config.specularSaturation}
        bezelHeightFn={SURFACES[config.surface].fn}
        scaleRatio={scaleRatio}
        dpr={config.dpr}
      />
      <div
        style={{
          width: config.width,
          height: config.height,
          borderRadius: config.radius,
          backdropFilter: `url(#${id})`,
          WebkitBackdropFilter: `url(#${id})`,
          boxShadow: "0 3px 14px rgba(0,0,0,0.1)",
          ...style,
        }}
      >
        {children}
      </div>
    </>
  );
}
