'use client';

import Link from 'next/link';
import { useState } from 'react';
import LiquidGlassDemo from './components/liquid-glass-demo';
import LiquidGlassFormDemo from './components/liquid-glass-form-demo';
import LiquidSliderDemo from './components/liquid-slider-demo';
import LiquidSurfacePlayground from './components/liquid-surface-playground';

type DemoKey = 'glass' | 'form' | 'slider' | 'surface';

const DEMO_META: Record<DemoKey, { title: string }> = {
    glass: { title: 'Liquid Glass Demo' },
    form: { title: 'Liquid Glass Form Demo' },
    slider: { title: 'Liquid Slider Demo' },
    surface: { title: 'Liquid Surface Playground' },
};

export default function HomePage() {
    const [demo, setDemo] = useState<DemoKey>('glass');

    return (
        <main className="min-h-screen p-4 md:p-8">
            <section className="mx-auto mb-4 flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Reference demos</p>
                    <h1 className="text-2xl font-semibold text-zinc-900">{DEMO_META[demo].title}</h1>
                </div>
                <Link
                    href="/stress-panel"
                    className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                >
                    Stress panel
                </Link>
            </section>

            <nav className="mx-auto mb-4 flex w-full max-w-7xl flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setDemo('glass')}
                    className={`rounded-full border px-4 py-1.5 text-sm ${
                        demo === 'glass' ? 'border-zinc-500 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700'
                    }`}
                >
                    Glass
                </button>
                <button
                    type="button"
                    onClick={() => setDemo('form')}
                    className={`rounded-full border px-4 py-1.5 text-sm ${
                        demo === 'form' ? 'border-zinc-500 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700'
                    }`}
                >
                    Form
                </button>
                <button
                    type="button"
                    onClick={() => setDemo('slider')}
                    className={`rounded-full border px-4 py-1.5 text-sm ${
                        demo === 'slider' ? 'border-zinc-500 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700'
                    }`}
                >
                    Slider
                </button>
                <button
                    type="button"
                    onClick={() => setDemo('surface')}
                    className={`rounded-full border px-4 py-1.5 text-sm ${
                        demo === 'surface'
                            ? 'border-zinc-500 bg-zinc-900 text-white'
                            : 'border-zinc-300 bg-white text-zinc-700'
                    }`}
                >
                    Surface Playground
                </button>
            </nav>

            <div className="mx-auto w-full max-w-7xl">
                {demo === 'glass' ? <LiquidGlassDemo className="h-[80vh] min-h-[400px]" /> : null}
                {demo === 'form' ? (
                    <div className="relative min-h-[560px] overflow-hidden rounded-xl border border-white/20 bg-black p-6">
                        <LiquidGlassFormDemo />
                    </div>
                ) : null}
                {demo === 'slider' ? (
                    <div className="relative min-h-[560px] overflow-hidden rounded-xl border border-white/20 bg-black p-6">
                        <LiquidSliderDemo />
                    </div>
                ) : null}
                {demo === 'surface' ? (
                    <div className="relative overflow-hidden rounded-xl border border-zinc-300/80 bg-white">
                        <LiquidSurfacePlayground />
                    </div>
                ) : null}
            </div>
        </main>
    );
}
