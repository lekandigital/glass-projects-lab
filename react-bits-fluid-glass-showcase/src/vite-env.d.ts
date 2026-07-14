/// <reference types="vite/client" />

declare module '@lib/FluidGlass' {
  import type { ComponentType } from 'react';
  type Mode = 'lens' | 'bar' | 'cube';
  interface FluidGlassProps {
    mode?: Mode;
    lensProps?: Record<string, unknown>;
    barProps?: Record<string, unknown>;
    cubeProps?: Record<string, unknown>;
  }
  const FluidGlass: ComponentType<FluidGlassProps>;
  export default FluidGlass;
}

declare module '@lib/FluidGlass?raw' {
  const src: string;
  export default src;
}
