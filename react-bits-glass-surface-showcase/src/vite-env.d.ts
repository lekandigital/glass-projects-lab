/// <reference types="vite/client" />

declare module '@lib/GlassSurface' {
  export { default } from './vendor/GlassSurface';
  export * from './vendor/GlassSurface';
}

declare module '@lib/GlassSurface?raw' {
  const src: string;
  export default src;
}

declare module '@lib/GlassSurface.css?raw' {
  const src: string;
  export default src;
}
