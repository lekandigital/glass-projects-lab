'use client';

import { LiquidSlider } from '@creatorem/web-glass-effect';
import { useState } from 'react';

export default function LiquidSliderDemo() {
    const [value, setValue] = useState(30);

    return (
        <div className="relative flex flex-col items-center overflow-hidden rounded-lg p-8">
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, color-mix(in oklab,var(--muted-foreground) 50%, var(--background) 100%) 1px, transparent 1px),' +
                        'linear-gradient(to bottom, color-mix(in oklab,var(--muted-foreground) 50%, var(--background) 100%) 1px, transparent 1px)',
                    backgroundSize: '24px 24px, 24px 24px, 100% 100%',
                    backgroundPosition: '12px 12px, 12px 12px, 0 0',
                    animation: 'moveBackground 10s linear infinite',
                }}
            />

            <div className="relative z-10">
                <LiquidSlider defaultValue={value} onValueChange={setValue} min={0} max={100} size="md" />
            </div>

            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-center">
                <p className="text-sm text-zinc-600">Value: {value}</p>
            </div>

            <style jsx>{`
                @keyframes moveBackground {
                    0% {
                        background-position: 0px 0px;
                    }
                    100% {
                        background-position: 100px 100px;
                    }
                }
            `}</style>
        </div>
    );
}
