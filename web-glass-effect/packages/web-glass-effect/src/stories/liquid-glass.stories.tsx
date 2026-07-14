import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useRef } from 'react';
import { LiquidGlass, useLiquidSurface } from '../index';

const meta: Meta<typeof LiquidGlass> = {
  title: 'Liquid/LiquidGlass',
  component: LiquidGlass,
  tags: ['autodocs'],
  args: {
    glassThickness: 90,
    bezelWidth: 18,
    refractiveIndex: 1.6,
    blur: 0.35,
    specularOpacity: 0.8,
    specularSaturation: 6,
  },
  argTypes: {
    glassThickness: { control: { type: 'range', min: 10, max: 180, step: 1 } },
    bezelWidth: { control: { type: 'range', min: 0, max: 80, step: 1 } },
    refractiveIndex: { control: { type: 'range', min: 1, max: 3, step: 0.05 } },
    blur: { control: { type: 'range', min: 0, max: 8, step: 0.05 } },
    specularOpacity: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    specularSaturation: { control: { type: 'range', min: 0, max: 12, step: 0.5 } },
  },
};

export default meta;
type Story = StoryObj<typeof LiquidGlass>;

const Backdrop = ({ children }: { children: React.ReactNode }) => (
  <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl p-8">
    <img
      src="https://picsum.photos/1400/900?grayscale"
      alt="Backdrop"
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-br from-sky-300/50 via-slate-900/25 to-fuchsia-300/40" />
    <div className="relative z-10">{children}</div>
  </div>
);

export const Basic: Story = {
  render: (args) => (
    <Backdrop>
      <LiquidGlass
        {...args}
        className="w-[420px] rounded-[32px] border border-white/20 bg-white/15 p-8 text-white shadow-2xl"
      >
        <h3 className="text-2xl font-semibold">Liquid Glass</h3>
        <p className="mt-2 text-sm text-white/80">
          Real-time refraction, bevel highlights, and specular bloom over the scene.
        </p>
      </LiquidGlass>
    </Backdrop>
  ),
};

function HookSurfaceCard() {
  const targetRef = useRef<HTMLDivElement>(null);

  const config = useMemo(
    () => ({
      targetRef,
      glassThickness: 100,
      bezelWidth: 24,
      refractiveIndex: 1.75,
      blur: 0.6,
      specularOpacity: 0.9,
      specularSaturation: 8,
    }),
    [],
  );

  const { Filter, filterStyles } = useLiquidSurface(config);

  return (
    <>
      <Filter />
      <div
        ref={targetRef}
        className="rounded-[28px] border border-white/25 bg-white/10 p-8 text-white shadow-2xl"
        style={{ ...filterStyles, width: 420 }}
      >
        <h3 className="text-xl font-semibold">Hook integration</h3>
        <p className="mt-2 text-sm text-white/80">Use `useLiquidSurface` to attach liquid glass to existing elements.</p>
      </div>
    </>
  );
}

export const HookUsage: Story = {
  render: () => (
    <Backdrop>
      <HookSurfaceCard />
    </Backdrop>
  ),
};
