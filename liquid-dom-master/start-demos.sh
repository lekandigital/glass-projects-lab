#!/bin/bash
echo "Killing existing Vite dev servers..."
pkill -f "vite"

echo "Starting demos..."
pnpm -C demo/blending exec vite --host 127.0.0.1 --port 5173 &
pnpm -C demo/minimal exec vite --host 127.0.0.1 --port 5174 &
pnpm -C demo/showcase exec vite --host 127.0.0.1 --port 5180 &
pnpm -C demo/three exec vite --host 127.0.0.1 --port 5176 &
pnpm -C demo/three-layout exec vite --host 127.0.0.1 --port 5177 &
pnpm -C demo/three-react exec vite --host 127.0.0.1 --port 5178 &
pnpm -C demo/three-r3f exec vite --host 127.0.0.1 --port 5179 &

echo "All demos started."
