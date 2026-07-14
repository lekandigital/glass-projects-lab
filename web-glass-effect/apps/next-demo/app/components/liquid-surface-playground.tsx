'use client';

import { LiquidGlass } from '@creatorem/web-glass-effect';
import { motion, useSpring, useTransform } from 'motion/react';

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return <span className={className}>{children}</span>;
}

function SimpleSlider({
    defaultValue,
    onValueChange,
    min,
    max,
    step = 1,
    className,
}: {
    defaultValue: number[];
    onValueChange: (value: number[]) => void;
    min: number;
    max: number;
    step?: number;
    className?: string;
}) {
    return (
        <input
            type="range"
            defaultValue={defaultValue[0]}
            onChange={(event) => onValueChange([Number(event.currentTarget.value)])}
            min={min}
            max={max}
            step={step}
            className={className}
        />
    );
}

export default function LiquidSurfacePlayground() {
    // Create motion values directly with spring transitions
    const glassThickness = useSpring(80, { stiffness: 300, damping: 30 });
    const bezelWidth = useSpring(15, { stiffness: 300, damping: 30 });
    const refractiveIndex = useSpring(1.5, { stiffness: 300, damping: 30 });
    const blur = useSpring(0.4, { stiffness: 300, damping: 30 });
    const specularOpacity = useSpring(0.8, { stiffness: 300, damping: 30 });

    // Dimension and styling motion values
    const width = useSpring(400, { stiffness: 300, damping: 30 });
    const height = useSpring(300, { stiffness: 300, damping: 30 });
    const borderRadius = useSpring(32, { stiffness: 300, damping: 30 });

    // Create display values for the UI labels
    const glassThicknessDisplay = useTransform(glassThickness, (v) => Math.round(v));
    const bezelWidthDisplay = useTransform(bezelWidth, (v) => Math.round(v));
    const refractiveIndexDisplay = useTransform(refractiveIndex, (v) => v.toFixed(1));
    const blurDisplay = useTransform(blur, (v) => v.toFixed(1));
    const specularOpacityDisplay = useTransform(specularOpacity, (v) => v.toFixed(1));
    const widthDisplay = useTransform(width, (v) => Math.round(v));
    const heightDisplay = useTransform(height, (v) => Math.round(v));
    const borderRadiusDisplay = useTransform(borderRadius, (v) => Math.round(v));

    // Create slider value arrays for the UI
    const glassThicknessArray = useTransform(glassThickness, (v) => [v]);
    const bezelWidthArray = useTransform(bezelWidth, (v) => [v]);
    const refractiveIndexArray = useTransform(refractiveIndex, (v) => [v]);
    const blurArray = useTransform(blur, (v) => [v]);
    const specularOpacityArray = useTransform(specularOpacity, (v) => [v]);
    const widthArray = useTransform(width, (v) => [v]);
    const heightArray = useTransform(height, (v) => [v]);
    const borderRadiusArray = useTransform(borderRadius, (v) => [v]);

    return (
        <div className="relative w-full overflow-hidden rounded-lg">
            <div className="relative z-10 flex h-full flex-col">
                {/* Glass Preview Area */}
                <div className="relative flex min-h-[600px] flex-1 items-center justify-center overflow-hidden p-8">
                    {/* Image Grid Background */}
                    {IMAGE_GRID}

                    {/* <motion.div
                        className="bg-white/20 p-12 shadow-2xl backdrop-blur-sm"
                        > */}
                    <LiquidGlass
                        glassThickness={glassThickness as any}
                        bezelWidth={bezelWidth as any}
                        refractiveIndex={refractiveIndex as any}
                        blur={blur as any}
                        dpr={1}
                        specularOpacity={specularOpacity as any}
                        width={width as any}
                        height={height as any}
                        borderRadius={borderRadius as any}
                        className="bg-white/20 p-12 shadow-2xl backdrop-blur-sm"
                        style={{
                            borderRadius: borderRadius,
                            width: width,
                            height: height,
                        }}
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Liquid Glass</h2>
                            <p className="max-w-md text-lg text-gray-600 dark:text-gray-300">
                                Adjust the controls below to see how different properties affect the glass appearance
                                and refraction.
                            </p>
                            <div className="flex items-center justify-center gap-4 pt-4">
                                <div className="h-8 w-8 rounded-full bg-red-400"></div>
                                <div className="h-8 w-8 rounded-full bg-green-400"></div>
                                <div className="h-8 w-8 rounded-full bg-blue-400"></div>
                            </div>
                        </div>
                    </LiquidGlass>
                    {/* </motion.div> */}
                </div>

                {/* Controls Panel */}
                <div className="border-t border-zinc-200 bg-white/95 p-6">
                    <div className="mx-auto flex max-w-6xl flex-col gap-2">
                        {/* Dimensions Section */}
                        <div className="mb-4">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Dimensions</h3>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                {/* Width */}
                                <div className="flex gap-2">
                                    <Label className="text-sm font-medium">Width</Label>
                                    <SimpleSlider
                                        defaultValue={widthArray.get()}
                                        onValueChange={(value) => width.set(value[0]!)}
                                        min={200}
                                        max={600}
                                        className="w-full"
                                    />
                                    <motion.span className="rounded bg-zinc-200/70 px-2 py-0.5 font-mono text-sm">
                                        {widthDisplay}
                                    </motion.span>
                                </div>

                                {/* Height */}
                                <div className="flex gap-2">
                                    <Label className="text-sm font-medium">Height</Label>
                                    <SimpleSlider
                                        defaultValue={heightArray.get()}
                                        onValueChange={(value) => height.set(value[0]!)}
                                        min={200}
                                        max={500}
                                        className="w-full"
                                    />
                                    <motion.span className="rounded bg-zinc-200/70 px-2 py-0.5 font-mono text-sm">
                                        {heightDisplay}
                                    </motion.span>
                                </div>

                                {/* Border Radius */}
                                <div className="flex gap-2">
                                    <Label className="text-sm font-medium">Radius</Label>
                                    <SimpleSlider
                                        defaultValue={borderRadiusArray.get()}
                                        onValueChange={(value) => borderRadius.set(value[0]!)}
                                        min={0}
                                        max={100}
                                        className="w-full"
                                    />
                                    <motion.span className="rounded bg-zinc-200/70 px-2 py-0.5 font-mono text-sm">
                                        {borderRadiusDisplay}
                                    </motion.span>
                                </div>
                            </div>
                        </div>

                        {/* Glass Properties Section */}
                        <div className="flex flex-col gap-2">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Glass Properties
                            </h3>
                            {/* Glass Thickness */}
                            <div className="flex gap-2">
                                <Label className="text-sm font-medium">Thickness</Label>
                                <SimpleSlider
                                    defaultValue={glassThicknessArray.get()}
                                    onValueChange={(value) => glassThickness.set(value[0]!)}
                                    min={10}
                                    max={150}
                                    // step={5}
                                    className="w-full"
                                />
                                <motion.span className="rounded bg-zinc-200/70 px-2 py-0.5 font-mono text-sm">
                                    {glassThicknessDisplay}
                                </motion.span>
                            </div>

                            {/* Bezel Width */}
                            <div className="flex gap-2">
                                <Label className="text-sm font-medium">Bezel</Label>
                                <SimpleSlider
                                    defaultValue={bezelWidthArray.get()}
                                    onValueChange={(value) => bezelWidth.set(value[0]!)}
                                    min={0}
                                    max={120}
                                    className="w-full"
                                />
                                <motion.span className="rounded bg-zinc-200/70 px-2 py-0.5 font-mono text-sm">
                                    {bezelWidthDisplay}
                                </motion.span>
                            </div>

                            {/* Refractive Index */}
                            <div className="flex gap-2">
                                <Label className="text-sm font-medium">Index</Label>
                                <SimpleSlider
                                    defaultValue={refractiveIndexArray.get()}
                                    onValueChange={(value) => refractiveIndex.set(value[0]!)}
                                    min={1.0}
                                    max={3.0}
                                    step={0.1}
                                    className="w-full"
                                />
                                <motion.span className="rounded bg-zinc-200/70 px-2 py-0.5 font-mono text-sm">
                                    {refractiveIndexDisplay}
                                </motion.span>
                            </div>

                            {/* Blur */}
                            <div className="flex gap-2">
                                <Label className="text-sm font-medium">Blur</Label>
                                <SimpleSlider
                                    defaultValue={blurArray.get()}
                                    onValueChange={(value) => blur.set(value[0]!)}
                                    min={0.0}
                                    max={40.0}
                                    step={0.1}
                                    className="w-full"
                                />
                                <motion.span className="rounded bg-zinc-200/70 px-2 py-0.5 font-mono text-sm">
                                    {blurDisplay}
                                </motion.span>
                            </div>

                            {/* Specular Opacity */}
                            <div className="flex gap-2">
                                <Label className="text-sm font-medium">Specular</Label>
                                <SimpleSlider
                                    defaultValue={specularOpacityArray.get()}
                                    onValueChange={(value) => specularOpacity.set(value[0]!)}
                                    min={0.0}
                                    max={1.0}
                                    step={0.1}
                                    className="w-full"
                                />
                                <motion.span className="rounded bg-zinc-200/70 px-2 py-0.5 font-mono text-sm">
                                    {specularOpacityDisplay}
                                </motion.span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const IMAGE_GRID = (
    <div
        className="absolute top-1/2 left-1/2 w-full"
        style={{
            transform: 'translateX(-50%) translateX(-25px) translateY(-50%) rotate(30deg) scale(1.3)',
        }}
    >
        <div className="grid grid-cols-5 gap-2 p-8">
            {/* Row 1 */}
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=1"
                    alt="Background 1"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=2"
                    alt="Background 2"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=3"
                    alt="Background 3"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=4"
                    alt="Background 4"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=5"
                    alt="Background 5"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>

            {/* Row 2 - Translated 50px */}
            <div className="aspect-square overflow-hidden rounded-lg" style={{ transform: 'translateX(50px)' }}>
                <img
                    src="https://picsum.photos/200/300?random=6"
                    alt="Background 6"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg" style={{ transform: 'translateX(50px)' }}>
                <img
                    src="https://picsum.photos/200/300?random=7"
                    alt="Background 7"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg" style={{ transform: 'translateX(50px)' }}>
                <img
                    src="https://picsum.photos/200/300?random=8"
                    alt="Background 8"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg" style={{ transform: 'translateX(50px)' }}>
                <img
                    src="https://picsum.photos/200/300?random=9"
                    alt="Background 9"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg" style={{ transform: 'translateX(50px)' }}>
                <img
                    src="https://picsum.photos/200/300?random=10"
                    alt="Background 10"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>

            {/* Row 3 */}
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=11"
                    alt="Background 11"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=12"
                    alt="Background 12"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=13"
                    alt="Background 13"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=14"
                    alt="Background 14"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=15"
                    alt="Background 15"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>

            {/* Row 4 - Translated 50px */}
            <div className="aspect-square overflow-hidden rounded-lg" style={{ transform: 'translateX(50px)' }}>
                <img
                    src="https://picsum.photos/200/300?random=16"
                    alt="Background 16"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg" style={{ transform: 'translateX(50px)' }}>
                <img
                    src="https://picsum.photos/200/300?random=17"
                    alt="Background 17"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg" style={{ transform: 'translateX(50px)' }}>
                <img
                    src="https://picsum.photos/200/300?random=18"
                    alt="Background 18"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg" style={{ transform: 'translateX(50px)' }}>
                <img
                    src="https://picsum.photos/200/300?random=19"
                    alt="Background 19"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg" style={{ transform: 'translateX(50px)' }}>
                <img
                    src="https://picsum.photos/200/300?random=20"
                    alt="Background 20"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>

            {/* Row 5 */}
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=21"
                    alt="Background 21"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=22"
                    alt="Background 22"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=23"
                    alt="Background 23"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=24"
                    alt="Background 24"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
            <div className="aspect-square overflow-hidden rounded-lg">
                <img
                    src="https://picsum.photos/200/300?random=25"
                    alt="Background 25"
                    className="object-cover"
                    style={{
                        width: 200,
                        height: 300,
                    }}
                />
            </div>
        </div>
    </div>
);
