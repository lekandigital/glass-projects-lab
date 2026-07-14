import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const local = (pkg: string) => path.resolve(__dirname, 'node_modules', pkg);

// The component is imported from the react-bits checkout two levels up, so the
// deployed page always renders the upstream source rather than a copy of it.
// Node would resolve that file's bare imports against react-bits' own (absent)
// node_modules, so the packages FluidGlass.tsx pulls in are pinned here.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@react-bits': path.resolve(__dirname, '../../src/ts-default'),
      three: local('three'),
      '@react-three/fiber': local('@react-three/fiber'),
      '@react-three/drei': local('@react-three/drei'),
      maath: local('maath'),
      react: local('react'),
      'react-dom': local('react-dom')
    }
  }
});
