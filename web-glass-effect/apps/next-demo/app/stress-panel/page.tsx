'use client';

import {
  CONCAVE,
  CONVEX,
  ELASTIC,
  LIP,
  LiquidGlass,
  LiquidSlider,
  LiquidSwitch,
  STEPPED,
} from '@creatorem/web-glass-effect';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type SurfaceName = 'convex' | 'concave' | 'lip' | 'stepped' | 'elastic';

const SURFACES = {
  convex: CONVEX.fn,
  concave: CONCAVE.fn,
  lip: LIP.fn,
  stepped: STEPPED.fn,
  elastic: ELASTIC.fn,
} as const;

export default function StressPanelPage() {
  const [glassThickness, setGlassThickness] = useState(92);
  const [bezelWidth, setBezelWidth] = useState(18);
  const [blur, setBlur] = useState(0.45);
  const [refractiveIndex, setRefractiveIndex] = useState(1.72);
  const [specularOpacity, setSpecularOpacity] = useState(0.85);
  const [specularSaturation, setSpecularSaturation] = useState(6);
  const [surface, setSurface] = useState<SurfaceName>('convex');
  const [switchChecked, setSwitchChecked] = useState(true);
  const [sliderValue, setSliderValue] = useState(58);

  const surfaceFn = useMemo(() => SURFACES[surface], [surface]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white lg:p-10">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Liquid Component Stress Panel</h1>
          <Link href="/" className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
            Back to iTunes Demo
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <LiquidGlass
            className="rounded-[28px] border border-white/20 bg-white/8 p-6"
            style={{ borderRadius: 28 }}
            glassThickness={glassThickness}
            bezelWidth={bezelWidth}
            blur={blur}
            refractiveIndex={refractiveIndex}
            specularOpacity={specularOpacity}
            specularSaturation={specularSaturation}
            bezelHeightFn={surfaceFn}
          >
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold capitalize">Surface: {surface}</h2>
                <p className="text-sm text-white/75">Tune every prop and visually validate refraction and highlights.</p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
                  <p className="mb-2 text-xs text-white/70">Demo slider ({sliderValue})</p>
                  <LiquidSlider value={sliderValue} onValueChange={setSliderValue} size="md" />
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
                  <p className="mb-2 text-xs text-white/70">Demo switch</p>
                  <LiquidSwitch checked={switchChecked} onCheckedChange={setSwitchChecked} size="md" />
                </div>
              </div>
            </div>
          </LiquidGlass>

          <section className="rounded-[28px] border border-white/20 bg-slate-900/80 p-5">
            <h2 className="mb-4 text-lg font-semibold">Controls</h2>
            <div className="space-y-4 text-sm">
              {[
                {
                  label: 'Glass Thickness',
                  value: glassThickness,
                  min: 10,
                  max: 150,
                  step: 1,
                  onChange: (value: number) => setGlassThickness(value),
                },
                {
                  label: 'Bezel Width',
                  value: bezelWidth,
                  min: 2,
                  max: 50,
                  step: 1,
                  onChange: (value: number) => setBezelWidth(value),
                },
                {
                  label: 'Blur',
                  value: blur,
                  min: 0,
                  max: 2,
                  step: 0.05,
                  onChange: (value: number) => setBlur(value),
                },
                {
                  label: 'Refractive Index',
                  value: refractiveIndex,
                  min: 1,
                  max: 3,
                  step: 0.01,
                  onChange: (value: number) => setRefractiveIndex(value),
                },
                {
                  label: 'Specular Opacity',
                  value: specularOpacity,
                  min: 0,
                  max: 1,
                  step: 0.01,
                  onChange: (value: number) => setSpecularOpacity(value),
                },
                {
                  label: 'Specular Saturation',
                  value: specularSaturation,
                  min: 0,
                  max: 10,
                  step: 0.1,
                  onChange: (value: number) => setSpecularSaturation(value),
                },
              ].map((control) => (
                <label key={control.label} className="block space-y-1">
                  <div className="flex items-center justify-between text-white/80">
                    <span>{control.label}</span>
                    <span className="font-mono text-xs text-white/60">{Number(control.value).toFixed(2)}</span>
                  </div>
                  <input
                    className="w-full"
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={control.value}
                    onChange={(event) => control.onChange(Number(event.currentTarget.value))}
                  />
                </label>
              ))}

              <label className="block space-y-1">
                <span className="text-white/80">Surface Function</span>
                <select
                  className="w-full rounded-xl border border-white/20 bg-slate-900 px-3 py-2"
                  value={surface}
                  onChange={(event) => setSurface(event.currentTarget.value as SurfaceName)}
                >
                  <option value="convex">Convex</option>
                  <option value="concave">Concave</option>
                  <option value="lip">Lip</option>
                  <option value="stepped">Stepped</option>
                  <option value="elastic">Elastic</option>
                </select>
              </label>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
