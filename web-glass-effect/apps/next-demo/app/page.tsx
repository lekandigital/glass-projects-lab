'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import LiquidGlassDemo from './components/liquid-glass-demo';
import LiquidGlassFormDemo from './components/liquid-glass-form-demo';
import LiquidSliderDemo from './components/liquid-slider-demo';
import LiquidSurfacePlayground from './components/liquid-surface-playground';
import { SHARED_BACKDROPS, SharedMediaLayer, type SharedBackdrop } from './components/shared-media';

type DemoKey = 'glass' | 'form' | 'slider' | 'surface';

const DEMO_META: Record<DemoKey, { title: string }> = {
    glass: { title: 'Liquid Glass Demo' },
    form: { title: 'Liquid Glass Form Demo' },
    slider: { title: 'Liquid Slider Demo' },
    surface: { title: 'Liquid Surface Playground' },
};

export default function HomePage() {
    const [demo, setDemo] = useState<DemoKey>('glass');
    const [backdrop, setBackdrop] = useState<SharedBackdrop>('default');

    const pillClass = (active: boolean) =>
        `rounded-full border px-4 py-1.5 text-sm ${
            active ? 'border-zinc-500 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700'
        }`;

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
                    className={pillClass(demo === 'glass')}
                >
                    Glass
                </button>
                <button
                    type="button"
                    onClick={() => setDemo('form')}
                    className={pillClass(demo === 'form')}
                >
                    Form
                </button>
                <button
                    type="button"
                    onClick={() => setDemo('slider')}
                    className={pillClass(demo === 'slider')}
                >
                    Slider
                </button>
                <button
                    type="button"
                    onClick={() => setDemo('surface')}
                    className={pillClass(demo === 'surface')}
                >
                    Surface Playground
                </button>
                <span className="mx-1 min-h-8 w-px self-stretch bg-zinc-300" aria-hidden />
                {SHARED_BACKDROPS.map((b) => (
                    <button
                        key={b.key}
                        type="button"
                        onClick={() => setBackdrop(b.key)}
                        className={pillClass(backdrop === b.key)}
                    >
                        {b.label}
                    </button>
                ))}
            </nav>

            <div className="mx-auto w-full max-w-7xl">
                {demo === 'glass' ? <LiquidGlassDemo className="h-[80vh] min-h-[400px]" backdrop={backdrop} /> : null}
                {demo === 'form' ? (
                    <DemoFrame className="min-h-[560px] rounded-xl border border-white/20 bg-black p-6" backdrop={backdrop}>
                        <LiquidGlassFormDemo />
                    </DemoFrame>
                ) : null}
                {demo === 'slider' ? (
                    <DemoFrame className="min-h-[560px] rounded-xl border border-white/20 bg-black p-6" backdrop={backdrop}>
                        <LiquidSliderDemo />
                    </DemoFrame>
                ) : null}
                {demo === 'surface' ? (
                    <DemoFrame className="rounded-xl border border-zinc-300/80 bg-white" backdrop={backdrop}>
                        <LiquidSurfacePlayground backdrop={backdrop} />
                    </DemoFrame>
                ) : null}
            </div>
        </main>
    );
}

function DemoFrame({
    backdrop,
    className,
    children,
}: {
    backdrop: SharedBackdrop;
    className: string;
    children: ReactNode;
}) {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            <SharedMediaLayer backdrop={backdrop} />
            <div className="relative z-10">{children}</div>
        </div>
    );
}
