# Web Glass Effect

`web-glass-effect` is a pnpm workspace with:

- `@creatorem/web-glass-effect`: publishable React package
- `@creatorem/next-demo`: Next.js demo app

Published package: `@creatorem/web-glass-effect`

## Exports

- `LiquidGlass`
- `useLiquidSurface`
- `LiquidFilter`
- `LiquidSlider`
- `LiquidSwitch`
- `BUBBLE`, `CONCAVE`, `CONVEX`, `CONVEX_CIRCLE`, `ELASTIC`, `LIP`, `STEPPED`, `WAVE`
- `calculateRefractionSpecular`, `getDisplacementData`, `getValueOrMotion`, `fns`
- Types: `LiquidGlassProps`, `LiquidFilterProps`, `LiquidSliderProps`, `LiquidSwitchProps`, `SurfaceFnDef`

## Install

In this workspace:

```bash
pnpm install
```

In another app:

```bash
pnpm add @creatorem/web-glass-effect motion
```

Then import styles once:

```tsx
import '@creatorem/web-glass-effect/styles.css';
```

## API Overview

`LiquidGlass` key props:
- `glassThickness`
- `bezelWidth`
- `blur`
- `bezelHeightFn`
- `refractiveIndex`
- `specularOpacity`
- `specularSaturation`
- `dpr`
- `targetRef`, `width`, `height`, `borderRadius` (advanced/hook-driven control)

`LiquidSlider` key props:
- `size`, `min`, `max`, `step`
- `defaultValue`, `value`, `onValueChange`
- `disabled`, `forceActive`
- `thumb`, `slider`
- `glassThickness`, `bezelWidth`, `refractiveIndex`

`LiquidSwitch` key props:
- `size`
- `defaultChecked`, `checked`, `onCheckedChange`
- `disabled`, `forceActive`
- `thumb`, `slider`
- `glassThickness`, `bezelWidth`, `refractiveIndex`
- `blur`, `specularOpacity`, `specularSaturation`, `refractionBase`

## Usage Examples

Basic `LiquidGlass` card:

```tsx
import { LiquidGlass } from '@creatorem/web-glass-effect';

export function BasicGlass() {
  return (
    <LiquidGlass
      className="rounded-[28px] bg-white/20 p-6 shadow-2xl"
      style={{ borderRadius: 28 }}
      glassThickness={110}
      bezelWidth={20}
      refractiveIndex={1.8}
      blur={0.4}
      specularOpacity={0.9}
    >
      <h3 className="text-lg font-semibold">Now Playing</h3>
      <p className="text-sm opacity-80">A liquid glass surface with refraction.</p>
    </LiquidGlass>
  );
}
```

Form integration (from demo):

```tsx
import { LiquidGlass } from '@creatorem/web-glass-effect';

function Field() {
  return (
    <div className="relative" style={{ borderRadius: 20 }}>
      <input
        placeholder="John"
        className="relative z-10 h-10 w-full rounded-[inherit] border border-white/20 bg-transparent px-3 text-sm text-white/80"
      />
      <LiquidGlass
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-transparent"
        glassThickness={110}
        bezelWidth={20}
        refractiveIndex={1.8}
        blur={0.4}
      />
    </div>
  );
}
```

Slider (controlled):

```tsx
import { LiquidSlider } from '@creatorem/web-glass-effect';
import { useState } from 'react';

export function SliderExample() {
  const [value, setValue] = useState(30);
  return (
    <LiquidSlider
      value={value}
      onValueChange={setValue}
      min={0}
      max={100}
      step={1}
      size="md"
    />
  );
}
```

Switch (controlled):

```tsx
import { LiquidSwitch } from '@creatorem/web-glass-effect';
import { useState } from 'react';

export function SwitchExample() {
  const [checked, setChecked] = useState(false);
  return (
    <LiquidSwitch
      checked={checked}
      onCheckedChange={setChecked}
      size="md"
      glassThickness={28}
      bezelWidth={10}
      refractiveIndex={1.5}
      blur={0.3}
      specularOpacity={0.55}
      specularSaturation={6}
    />
  );
}
```

Hook API (`useLiquidSurface`) with existing element:

```tsx
import { useLiquidSurface } from '@creatorem/web-glass-effect';

export function HookExample() {
  const { Filter, filterStyles, ref } = useLiquidSurface({
    glassThickness: 80,
    bezelWidth: 16,
    refractiveIndex: 1.6,
    blur: 0.3,
  });

  return (
    <>
      <Filter />
      <div
        ref={ref}
        style={{ ...filterStyles, borderRadius: 24 }}
        className="rounded-[24px] bg-white/15 p-6"
      >
        Existing component with liquid refraction.
      </div>
    </>
  );
}
```

## Browser Compatibility

The `backdrop-filter: url(#svgFilter)` pipeline is Chromium-first. On Safari/Firefox, the component degrades to blur fallback styles.

## Local Commands

Run demo:

```bash
pnpm dev:demo
```

Then open [http://localhost:4100](http://localhost:4100).

Run Storybook:

```bash
pnpm storybook
```

Run tests:

```bash
pnpm test
```

Verify:

```bash
pnpm verify
```

Build:

```bash
pnpm build
```

## Publish Package

Local publish (without provenance):

```bash
cd packages/web-glass-effect
pnpm run publish:local
```

CI publish (GitHub Actions with provenance):

```bash
cd packages/web-glass-effect
pnpm run publish:ci
```

## Credits

The implementation is extracted/adapted from Creatorem liquid motion components (`liquid-lib`, `filter`, `glass`, `slider`, `switch`) and docs examples.

Original inspiration: Chris from kube.io on liquid glass CSS/SVG techniques.
