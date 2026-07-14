# @creatorem/web-glass-effect

Liquid glass components for React web apps.

## Install

```bash
pnpm add @creatorem/web-glass-effect motion
```

## Usage

```tsx
import { LiquidGlass, LiquidSlider, LiquidSwitch } from '@creatorem/web-glass-effect';

export function Demo() {
  return (
    <LiquidGlass className="rounded-[28px] p-6" style={{ borderRadius: 28 }}>
      <LiquidSlider defaultValue={42} />
      <LiquidSwitch defaultChecked />
    </LiquidGlass>
  );
}
```

## Notes

- Chromium-first SVG filter support with graceful fallback blur on unsupported browsers.
- Built from extracted liquid effects and controls from the Creatorem UI kit.
