import { calculateRefractionSpecular, getDisplacementData } from "@creatorem/web-glass-effect";
import { SURFACES, type GlassConfig } from "./config";

/**
 * There is no vanilla component in the library — but `liquid-lib.ts` is genuinely
 * framework-free: it imports nothing but `MotionValue` (for one type guard) and
 * returns plain `ImageData`.
 *
 * So the whole effect is reproducible on bare DOM. This file is the proof: it
 * imports only the two pure functions, and rebuilds the exact filter graph that
 * `filter.tsx` renders — same primitives, same order, same `result` names.
 *
 * No React, no motion, no JSX.
 */

const SVG = "http://www.w3.org/2000/svg";

function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function imageDataToUrl(data: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  canvas.getContext("2d")!.putImageData(data, 0, 0);
  return canvas.toDataURL();
}

export interface VanillaHandle {
  setConfig(next: GlassConfig): void;
  destroy(): void;
}

export function mountLiquidGlass(
  container: HTMLElement,
  initial: GlassConfig,
  filterId: string,
): VanillaHandle {
  let config = initial;
  let destroyed = false;

  const svg = el("svg", { "color-interpolation-filters": "sRGB" });
  svg.style.display = "none";
  const defs = el("defs", {});
  const filter = el("filter", { id: filterId });

  const blur = el("feGaussianBlur", { in: "SourceGraphic", stdDeviation: 0, result: "blurred_source" });
  const displacementImage = el("feImage", { x: 0, y: 0, result: "displacement_map" });
  const displace = el("feDisplacementMap", {
    in: "blurred_source",
    in2: "displacement_map",
    scale: 0,
    xChannelSelector: "R",
    yChannelSelector: "G",
    result: "displaced",
  });
  const saturate = el("feColorMatrix", {
    in: "displaced",
    type: "saturate",
    values: 1,
    result: "displaced_saturated",
  });
  const specularImage = el("feImage", { x: 0, y: 0, result: "specular_layer" });
  const composite = el("feComposite", {
    in: "displaced_saturated",
    in2: "specular_layer",
    operator: "in",
    result: "specular_saturated",
  });
  const transfer = el("feComponentTransfer", { in: "specular_layer", result: "specular_faded" });
  const funcA = el("feFuncA", { type: "linear", slope: 1 });
  transfer.appendChild(funcA);
  const blend1 = el("feBlend", {
    in: "specular_saturated",
    in2: "displaced",
    mode: "normal",
    result: "withSaturation",
  });
  const blend2 = el("feBlend", { in: "specular_faded", in2: "withSaturation", mode: "normal" });

  filter.append(blur, displacementImage, displace, saturate, specularImage, composite, transfer, blend1, blend2);
  defs.appendChild(filter);
  svg.appendChild(defs);

  const surface = document.createElement("div");
  surface.dataset.testid = "vanilla-surface";
  surface.style.boxShadow = "0 3px 14px rgba(0,0,0,0.1)";
  surface.style.backdropFilter = `url(#${filterId})`;
  surface.style.setProperty("-webkit-backdrop-filter", `url(#${filterId})`);

  container.append(svg, surface);

  function paint() {
    const canvasW = config.width + config.canvasPad * 2;
    const canvasH = config.height + config.canvasPad * 2;

    const { displacementMap, maximumDisplacement } = getDisplacementData({
      glassThickness: config.glassThickness,
      // LiquidFilter clamps here; a hand-rolled version has to remember to.
      bezelWidth: Math.max(Math.min(config.bezelWidth, 2 * config.radius - 1), 0),
      bezelHeightFn: SURFACES[config.surface].fn,
      refractiveIndex: config.refractiveIndex,
      canvasWidth: canvasW,
      canvasHeight: canvasH,
      objectWidth: config.width,
      objectHeight: config.height,
      radius: config.radius,
      dpr: config.dpr,
    });

    // Matches LiquidFilter exactly: bezel is hardcoded to 50 and the angle is left default.
    const specular = calculateRefractionSpecular(
      config.width,
      config.height,
      config.radius,
      50,
      undefined,
      config.dpr,
    );

    blur.setAttribute("stdDeviation", String(config.blur));
    displacementImage.setAttribute("href", imageDataToUrl(displacementMap));
    displacementImage.setAttribute("width", String(canvasW));
    displacementImage.setAttribute("height", String(canvasH));
    displace.setAttribute("scale", String(maximumDisplacement * config.scaleRatio));
    saturate.setAttribute("values", String(config.specularSaturation));
    specularImage.setAttribute("href", imageDataToUrl(specular));
    specularImage.setAttribute("width", String(config.width));
    specularImage.setAttribute("height", String(config.height));
    funcA.setAttribute("slope", String(config.specularOpacity));

    surface.style.width = `${config.width}px`;
    surface.style.height = `${config.height}px`;
    surface.style.borderRadius = `${config.radius}px`;
  }

  paint();

  return {
    setConfig(next) {
      if (destroyed) return;
      config = next;
      paint();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      svg.remove();
      surface.remove();
    },
  };
}
