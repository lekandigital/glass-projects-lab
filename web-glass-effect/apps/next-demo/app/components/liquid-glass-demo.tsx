'use client';

import { LiquidGlass } from '@creatorem/web-glass-effect';
import { ArrowDown, ArrowUp, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { useMotionValue, useSpring } from 'motion/react';
import { useRef } from 'react';

const GLASS_EFFECTS = {
    NAV_BLUR_DEFAULT: 0,
    NAV_BLUR_HOVER: 1.5,
    NAV_REFRACTIVE_INDEX_DEFAULT: 1.4,
    NAV_REFRACTIVE_INDEX_HOVER: 3,
    BOTTOM_BAR_BLUR_DEFAULT: 0,
    BOTTOM_BAR_BLUR_HOVER: 0.8,
    BOTTOM_BAR_BLUR_SEARCH_FOCUSED: 3.5,
    BOTTOM_BAR_REFRACTIVE_INDEX_DEFAULT: 1.4,
    BOTTOM_BAR_REFRACTIVE_INDEX_HOVER: 2,
    BOTTOM_BAR_REFRACTIVE_INDEX_SEARCH_FOCUSED: 3,
    SPRING_CONFIG: { stiffness: 300, damping: 30 },
} as const;

function cn(...classes: Array<string | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function Input(props: React.ComponentProps<'input'>) {
    const { className, ...rest } = props;
    return (
        <input
            {...rest}
            className={cn(
                'h-9 w-full rounded-full border border-black/10 bg-white/40 px-3 py-1 text-sm text-black placeholder:text-black/50 outline-none transition',
                className,
            )}
        />
    );
}

function IconButton(props: React.ComponentProps<'button'>) {
    const { className, ...rest } = props;
    return (
        <button
            type="button"
            {...rest}
            className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-black/80 bg-muted transition hover:bg-white/20 hover:text-black',
                className,
            )}
        />
    );
}

export default function LiquidGlassDemo({ className }: { className?: string }) {
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
        bottomBarBlur.set(
            isFocused ? GLASS_EFFECTS.BOTTOM_BAR_BLUR_SEARCH_FOCUSED : GLASS_EFFECTS.BOTTOM_BAR_BLUR_DEFAULT,
        );
        bottomBarRefractiveIndex.set(
            isFocused
                ? GLASS_EFFECTS.BOTTOM_BAR_REFRACTIVE_INDEX_SEARCH_FOCUSED
                : GLASS_EFFECTS.BOTTOM_BAR_REFRACTIVE_INDEX_DEFAULT,
        );
    };

    const scrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToBottom = () => {
        if (!scrollContainerRef.current) return;
        scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth',
        });
    };

    const imageIds = [973, 979, 901, 894, 900, 896, 859, 902, 684, 976, 11, 12];

    return (
        <div className={cn('relative h-[500px] w-full overflow-hidden rounded-lg bg-neutral-50', className)}>
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
                    <ArrowUp className="h-5 w-5 text-black/80" />
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
                    <ArrowDown className="h-5 w-5 text-black/80" />
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
                                <Input
                                    type="number"
                                    value={400}
                                    readOnly
                                    className="h-6 w-16 rounded-full border-black/10 bg-white/20 px-2 text-xs"
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-medium">H</span>
                                <Input
                                    type="number"
                                    value={600}
                                    readOnly
                                    className="h-6 w-16 rounded-full border-black/10 bg-white/20 px-2 text-xs"
                                />
                            </div>
                        </div>

                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-black/60" />
                            <Input
                                type="text"
                                placeholder="Search images..."
                                onFocus={() => handleSearchFocus(true)}
                                onBlur={() => handleSearchFocus(false)}
                                className="h-8 w-full rounded-full border-black/10 bg-white/20 pl-10 text-black placeholder:text-black/50"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <IconButton aria-label="Zoom out" disabled>
                                <ZoomOut className="h-4 w-4" />
                            </IconButton>
                            <IconButton aria-label="Zoom in" disabled>
                                <ZoomIn className="h-4 w-4" />
                            </IconButton>
                        </div>
                    </div>
                </LiquidGlass>

            </div>
        </div>
    );
}

