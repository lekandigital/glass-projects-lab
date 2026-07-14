/**
 * src/vendor/* is what Vercel builds against (only this folder uploads). This asserts each
 * file is byte-identical to the react-bits checkout, so the deployed page and the local
 * page can never be running different components.
 * A no-op when the sibling isn't present, which is the case on Vercel.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const upDir = path.resolve(root, '../react-bits-main/src/ts-default/Components/GlassSurface');

if (!fs.existsSync(upDir)) {
  console.log('check:vendor — no react-bits sibling, using the vendored copies as-is.');
  process.exit(0);
}

let drifted = 0;
for (const f of ['GlassSurface.tsx', 'GlassSurface.css']) {
  const upstream = path.join(upDir, f);
  const vendored = path.join(root, 'src/vendor', f);
  if (fs.readFileSync(upstream, 'utf8') !== fs.readFileSync(vendored, 'utf8')) {
    console.error(`check:vendor — src/vendor/${f} has drifted.\n  cp "${upstream}" "${vendored}"`);
    drifted++;
  }
}

if (drifted) process.exit(1);
console.log('check:vendor — vendored copies match react-bits.');
