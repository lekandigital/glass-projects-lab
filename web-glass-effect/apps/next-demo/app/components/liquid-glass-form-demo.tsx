'use client';

import { LiquidGlass } from '@creatorem/web-glass-effect';

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
    return (
        <label htmlFor={htmlFor} className="text-sm font-medium text-white/85">
            {children}
        </label>
    );
}

export default function LiquidGlassFormDemo() {
    return (
        <>
            <div
                className="pointer-events-none absolute inset-0 z-0 opacity-45"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, rgba(255,255,255,0.24) 1px, transparent 1px),' +
                        'linear-gradient(to bottom, rgba(255,255,255,0.24) 1px, transparent 1px),' +
                        'radial-gradient(circle at 20% 20%, rgba(56,189,248,0.12), transparent 45%)',
                    backgroundSize: '24px 24px, 24px 24px, 100% 100%',
                    backgroundPosition: '12px 12px, 12px 12px, 0 0',
                    animation: 'moveBackground 8s linear infinite',
                }}
            />

            <style jsx>{`
                @keyframes moveBackground {
                    0% {
                        background-position: 0px 0px;
                    }
                    100% {
                        background-position: 120px 120px;
                    }
                }
            `}</style>

            <form className="relative max-w-96 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative" style={{ borderRadius: 20 }}>
                            <input
                                id="firstName"
                                type="text"
                                placeholder="John"
                                className="relative z-10 h-10 w-full rounded-[inherit] border border-white/20 bg-transparent px-3 text-sm text-white/80 placeholder:text-white/55"
                            />
                            <LiquidGlass
                                className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-transparent"
                                glassThickness={110}
                                bezelWidth={20}
                                refractiveIndex={1.8}
                                blur={0.4}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <div className="relative" style={{ borderRadius: 20 }}>
                            <input
                                id="lastName"
                                type="text"
                                placeholder="Doe"
                                className="relative z-10 h-10 w-full rounded-[inherit] border border-white/20 bg-transparent px-3 text-sm text-white/80 placeholder:text-white/55"
                            />
                            <LiquidGlass
                                className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-transparent"
                                glassThickness={110}
                                bezelWidth={10}
                                refractiveIndex={1.8}
                                blur={0.4}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <div className="relative rounded-2xl">
                        <textarea
                            id="message"
                            placeholder="Tell us about yourself..."
                            rows={4}
                            className="relative z-10 w-full rounded-[inherit] border border-white/20 bg-transparent px-3 py-2 text-sm text-white/80 placeholder:text-white/55"
                        />
                        <LiquidGlass
                            className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-transparent"
                            glassThickness={110}
                            bezelWidth={20}
                            refractiveIndex={1.8}
                            blur={0.4}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <div className="relative rounded-xl">
                        <select
                            id="gender"
                            defaultValue=""
                            className="relative z-10 h-10 w-full appearance-none rounded-[inherit] border border-white/20 bg-transparent px-3 text-sm text-white/80"
                        >
                            <option value="" disabled>
                                Select your gender
                            </option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                        <LiquidGlass
                            className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-transparent"
                            glassThickness={110}
                            bezelWidth={10}
                            refractiveIndex={1.8}
                            blur={0.4}
                        />
                    </div>
                </div>

                <div className="relative">
                    <button
                        aria-label="Submit"
                        type="submit"
                        className="relative w-full rounded-[18px] border border-amber-400/30 bg-amber-500/20 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/30"
                    >
                        <span className="relative z-10">Submit Form</span>
                        <LiquidGlass
                            className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-transparent"
                            glassThickness={110}
                            bezelWidth={10}
                            refractiveIndex={1.8}
                            blur={0.4}
                        />
                    </button>
                </div>
            </form>
        </>
    );
}
