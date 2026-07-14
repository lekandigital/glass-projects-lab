/**
 * src/vendor/* is what Vercel builds against (only this folder uploads). This asserts each
 * file is byte-identical to the react-bits checkout above, so the deployed page and the
 * local page can never be running different components.
 * A no-op when the checkout isn't present, which is the case on Vercel.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PAIRS = [
  ['../../src/ts-default/Components/GlassSurface/GlassSurface.tsx', 'src/vendor/GlassSurface.tsx'],
  ['../../src/ts-default/Components/GlassSurface/GlassSurface.css', 'src/vendor/GlassSurface.css'],
  ['../../src/ts-default/Backgrounds/LiquidEther/LiquidEther.tsx', 'src/vendor/LiquidEther.tsx'],
  ['../../src/ts-default/Backgrounds/LiquidEther/LiquidEther.css', 'src/vendor/LiquidEther.css']
];

let drifted = 0;
for (const [up, ven] of PAIRS) {
  const upstream = path.resolve(root, up);
  const vendored = path.resolve(root, ven);

  if (!fs.existsSync(upstream)) {
    console.log('check:vendor — no react-bits checkout, using the vendored copies as-is.');
    process.exit(0);
  }
  if (fs.readFileSync(upstream, 'utf8') !== fs.readFileSync(vendored, 'utf8')) {
    console.error(`check:vendor — ${ven} has drifted.\n  cp "${upstream}" "${vendored}"`);
    drifted++;
  }
}

if (drifted) process.exit(1);
console.log(`check:vendor — all ${PAIRS.length} vendored files match react-bits.`);
