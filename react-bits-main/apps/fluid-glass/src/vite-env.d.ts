/// <reference types="vite/client" />

declare module '@lib/FluidGlass' {
  import type { ComponentType } from 'react';
  interface FluidGlassProps {
    mode?: 'lens' | 'bar' | 'cube';
    lensProps?: Record<string, unknown>;
    barProps?: Record<string, unknown>;
    cubeProps?: Record<string, unknown>;
  }
  const FluidGlass: ComponentType<FluidGlassProps>;
  export default FluidGlass;
}
