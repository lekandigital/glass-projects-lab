/**
 * src/vendor/FluidGlass.tsx is what Vercel builds against (only this folder uploads).
 * This asserts it is byte-identical to the react-bits checkout above, so the deployed
 * page and the local page can never be running different components.
 * A no-op when the checkout isn't present, which is the case on Vercel.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const upstream = path.resolve(root, '../../src/ts-default/Components/FluidGlass/FluidGlass.tsx');
const vendored = path.resolve(root, 'src/vendor/FluidGlass.tsx');

if (!fs.existsSync(upstream)) {
  console.log('check:vendor — no react-bits checkout, using the vendored copy as-is.');
  process.exit(0);
}

if (fs.readFileSync(upstream, 'utf8') === fs.readFileSync(vendored, 'utf8')) {
  console.log('check:vendor — vendored copy matches react-bits.');
  process.exit(0);
}

console.error('check:vendor — src/vendor/FluidGlass.tsx has drifted from react-bits.');
console.error(`  cp "${upstream}" "${vendored}"`);
process.exit(1);
