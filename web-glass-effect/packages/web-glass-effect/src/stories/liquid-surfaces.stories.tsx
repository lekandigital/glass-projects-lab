import type { Meta, StoryObj } from '@storybook/react';
import {
  BUBBLE,
  CONCAVE,
  CONVEX,
  CONVEX_CIRCLE,
  ELASTIC,
  LIP,
  LiquidGlass,
  STEPPED,
  WAVE,
} from '../index';

const SURFACES = {
  convex_circle: CONVEX_CIRCLE.fn,
  convex: CONVEX.fn,
  concave: CONCAVE.fn,
  lip: LIP.fn,
  wave: WAVE.fn,
  stepped: STEPPED.fn,
  elastic: ELASTIC.fn,
  bubble: BUBBLE.fn,
} as const;

type SurfaceName = keyof typeof SURFACES;

const meta: Meta = {
  title: 'Liquid/Surface Profiles',
  tags: ['autodocs'],
  args: {
    surface: 'convex' as SurfaceName,
  },
  argTypes: {
    surface: {
      control: 'radio',
      options: Object.keys(SURFACES),
    },
  },
};

export default meta;

type Story = StoryObj<{ surface: SurfaceName }>;

export const Playground: Story = {
  render: ({ surface }) => (
    <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl bg-zinc-900 p-8">
      <img
        src="https://picsum.photos/1200/900"
        alt="Surface backdrop"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <LiquidGlass
        className="relative z-10 w-[420px] rounded-[30px] border border-white/25 bg-white/10 p-8 text-white"
        style={{ borderRadius: 30 }}
        glassThickness={100}
        bezelWidth={22}
        blur={0.6}
        refractiveIndex={1.75}
        specularOpacity={0.95}
        specularSaturation={8}
        bezelHeightFn={SURFACES[surface]}
      >
        <h3 className="text-2xl font-semibold capitalize">{surface.replace('_', ' ')}</h3>
        <p className="mt-2 text-sm text-white/80">Switch surface functions to compare edge curvature and highlight behavior.</p>
      </LiquidGlass>
    </div>
  ),
};
