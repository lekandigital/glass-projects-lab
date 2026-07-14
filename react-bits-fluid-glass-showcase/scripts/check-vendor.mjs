/**
 * src/vendor/FluidGlass.tsx is what Vercel builds against (only this folder is
 * uploaded). This asserts it is byte-identical to the react-bits checkout, so the
 * deployed page and the local page can never be running different components.
 * A no-op when the sibling isn't present, which is the case on Vercel.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const upstream = path.resolve(root, '../react-bits-main/src/ts-default/Components/FluidGlass/FluidGlass.tsx');
const vendored = path.resolve(root, 'src/vendor/FluidGlass.tsx');

if (!fs.existsSync(upstream)) {
  console.log('check:vendor — no react-bits sibling, using the vendored copy as-is.');
  process.exit(0);
}

const a = fs.readFileSync(upstream, 'utf8');
const b = fs.readFileSync(vendored, 'utf8');

if (a === b) {
  console.log('check:vendor — vendored copy matches react-bits.');
  process.exit(0);
}

console.error('check:vendor — src/vendor/FluidGlass.tsx has drifted from react-bits.');
console.error(`  upstream: ${upstream}`);
console.error(`  vendored: ${vendored}`);
console.error('  Run: cp "$upstream" "$vendored"');
process.exit(1);
