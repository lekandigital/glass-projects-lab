/// <reference types="vite/client" />

declare module '@lib/FluidGlass' {
  import type { ComponentType } from 'react';
  type Mode = 'lens' | 'bar' | 'cube';
  type BackdropMode = 'default' | 'photograph' | 'video';
  interface FluidGlassProps {
    mode?: Mode;
    backdrop?: BackdropMode;
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
