import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { LiquidSwitch } from '../index';

const meta: Meta<typeof LiquidSwitch> = {
  title: 'Liquid/LiquidSwitch',
  component: LiquidSwitch,
  tags: ['autodocs'],
  args: {
    size: 'md',
    glassThickness: 28,
    bezelWidth: 10,
    refractiveIndex: 1.5,
    blur: 0.3,
    specularOpacity: 0.55,
    specularSaturation: 6,
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg', 'xl'] },
    glassThickness: { control: { type: 'range', min: 10, max: 80, step: 1 } },
    bezelWidth: { control: { type: 'range', min: 2, max: 30, step: 1 } },
    refractiveIndex: { control: { type: 'range', min: 1, max: 3, step: 0.05 } },
    blur: { control: { type: 'range', min: 0, max: 3, step: 0.05 } },
  },
};

export default meta;
type Story = StoryObj<typeof LiquidSwitch>;

export const Controlled: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false);

    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-2xl bg-slate-950/80 p-8 text-white">
        <LiquidSwitch {...args} checked={checked} onCheckedChange={setChecked} />
        <span className="font-mono text-sm text-white/80">Checked: {checked ? 'true' : 'false'}</span>
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
  render: (args) => (
    <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-slate-950/80 p-8 text-white">
      <LiquidSwitch {...args} />
    </div>
  ),
};
