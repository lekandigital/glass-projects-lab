import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { LiquidSlider } from '../index';

const meta: Meta<typeof LiquidSlider> = {
  title: 'Liquid/LiquidSlider',
  component: LiquidSlider,
  tags: ['autodocs'],
  args: {
    min: 0,
    max: 100,
    step: 1,
    size: 'md',
    glassThickness: 90,
    bezelWidth: 18,
    refractiveIndex: 1.6,
  },
  argTypes: {
    size: { control: 'radio', options: ['xs', 'sm', 'md', 'lg'] },
    glassThickness: { control: { type: 'range', min: 20, max: 180, step: 1 } },
    bezelWidth: { control: { type: 'range', min: 2, max: 40, step: 1 } },
    refractiveIndex: { control: { type: 'range', min: 1, max: 3, step: 0.05 } },
  },
};

export default meta;
type Story = StoryObj<typeof LiquidSlider>;

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState(42);

    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-5 rounded-2xl bg-slate-950/80 p-8 text-white">
        <LiquidSlider {...args} value={value} onValueChange={setValue} />
        <span className="font-mono text-sm text-white/80">Value: {value}</span>
      </div>
    );
  },
};

export const Uncontrolled: Story = {
  render: (args) => (
    <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-slate-950/80 p-8">
      <LiquidSlider {...args} defaultValue={30} />
    </div>
  ),
};
