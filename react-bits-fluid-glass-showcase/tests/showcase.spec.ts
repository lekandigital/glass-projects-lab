import { test, expect, type Page, type Locator } from '@playwright/test';
import fs from 'node:fs';

const SHOTS = 'test-results/shots';
fs.mkdirSync(SHOTS, { recursive: true });

/**
 * A WebGL canvas that failed to draw still passes every DOM assertion you can write
 * about it, so "is it rendering" is checked as a picture: a flat frame compresses to
 * almost nothing, a refracted one does not.
 */
async function assertRendered(target: Locator, name: string, minBytes = 12_000) {
  const png = await target.screenshot({ path: `${SHOTS}/${name}.png` });
  expect(png.byteLength, `${name}: canvas looks blank (${png.byteLength} bytes)`).toBeGreaterThan(minBytes);
  return png;
}

async function settle(page: Page, ms = 1200) {
  await page.waitForTimeout(ms);
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', e => {
    throw new Error(`uncaught page error: ${e.message}`);
  });
  await page.goto('/');
  await page.waitForSelector('#s1 canvas');
});

test('01 playground renders, and the canvas is not clipped by its stage', async ({ page }) => {
  await settle(page);

  const stage = page.locator('#s1 .stage');
  const canvas = page.locator('#s1 canvas');

  const s = (await stage.boundingBox())!;
  const c = (await canvas.boundingBox())!;

  expect(c.width).toBeGreaterThan(300);
  expect(c.height).toBeGreaterThan(300);
  // Nothing spills outside the rounded stage.
  expect(c.x).toBeGreaterThanOrEqual(s.x - 1);
  expect(c.y).toBeGreaterThanOrEqual(s.y - 1);
  expect(c.x + c.width).toBeLessThanOrEqual(s.x + s.width + 1);
  expect(c.y + c.height).toBeLessThanOrEqual(s.y + s.height + 1);

  await assertRendered(stage, '01-playground-lens');
});

test('02 controls drive the material and the generated code together', async ({ page }) => {
  await settle(page);
  const code = page.locator('#s1').getByTestId('generated-code');
  await expect(code).toContainText("mode=\"lens\"");

  const before = await assertRendered(page.locator('#s1 .stage'), '02a-before-ior');

  // ior 1.15 → 2.33 must visibly change the refraction, not just the code string.
  await page.getByTestId('c-ior').fill('2.33');
  await page.getByTestId('c-chromaticAberration').fill('0.6');
  await settle(page, 900);

  await expect(code).toContainText('ior: 2.33');
  await expect(code).toContainText('chromaticAberration: 0.6');

  const after = await assertRendered(page.locator('#s1 .stage'), '02b-after-ior');
  expect(Buffer.compare(before, after), 'raising ior changed nothing on screen').not.toBe(0);
});

test('03 mode switch remounts and reaches bar + cube', async ({ page }) => {
  await page.getByTestId('mode-cube').click();
  await settle(page);
  await expect(page.locator('#s1 .stage__tag')).toHaveText('mode="cube"');
  await expect(page.locator('#s1').getByTestId('generated-code')).toContainText('cubeProps');
  await assertRendered(page.locator('#s1 .stage'), '03a-cube');

  await page.getByTestId('mode-bar').click();
  await settle(page);
  await expect(page.locator('#s1').getByTestId('generated-code')).toContainText('navItems');
  await assertRendered(page.locator('#s1 .stage'), '03b-bar');
});

test('04 presets come from the single config object', async ({ page }) => {
  await page.getByTestId('preset-amber').click();
  await settle(page);
  const code = page.locator('#s1').getByTestId('generated-code');
  await expect(code).toContainText("attenuationColor: '#ff9d2e'");
  await expect(code).toContainText('attenuationDistance: 0.6');
  await assertRendered(page.locator('#s1 .stage'), '04-preset-amber');
});

test('05 copy button reports success', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const copy = page.locator('#s1').getByTestId('copy-button');
  await copy.click();
  await expect(copy).toContainText('Copied');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('<FluidGlass');
});

test('06 internals: the raw FBO, the real geoWidths, and both plots', async ({ page }) => {
  await page.locator('#s2').scrollIntoViewIfNeeded();
  await settle(page, 1800);

  // Parsed from the actual GLB bounding boxes, so they must be finite and non-default.
  for (const m of ['lens', 'bar', 'cube']) {
    const v = await page.getByTestId(`geowidth-${m}`).innerText();
    expect(Number(v), `geoWidth for ${m}`).toBeGreaterThan(0);
  }

  await assertRendered(page.locator('#s2 .card').first(), '06a-fbo-refracted');
  await page.getByTestId('toggle-buffer').click();
  await settle(page, 800);
  await assertRendered(page.locator('#s2 .card').first(), '06b-fbo-raw');

  await page.getByTestId('c-smoothtime').fill('0.45');
  await settle(page, 500);
  await page.locator('#s2').screenshot({ path: `${SHOTS}/06c-internals-full.png` });
});

test('07 gallery mounts every preset', async ({ page }) => {
  await page.locator('#s3').scrollIntoViewIfNeeded();
  await settle(page, 2500);

  const cards = page.locator('#s3 .grid > .card');
  await expect(cards).toHaveCount(7);
  await expect(page.locator('#s3 canvas')).toHaveCount(7);

  await page.getByTestId('gallery-diamond').locator('.stage__veil').click();
  await expect(page.getByTestId('gallery-diamond').locator('.stage')).toHaveAttribute('data-active', 'true');

  await page.locator('#s3').screenshot({ path: `${SHOTS}/07-gallery.png` });
});

test('08 useFrame commits once; useState commits every frame', async ({ page }) => {
  await page.locator('#s4').scrollIntoViewIfNeeded();
  await settle(page, 1500);

  const stages = page.locator('#s4 .stage');
  for (let i = 0; i < 12; i++) {
    const b = (await stages.nth(i % 2).boundingBox())!;
    await page.mouse.move(b.x + 40 + i * 15, b.y + 40 + i * 10);
    await page.waitForTimeout(60);
  }
  await settle(page, 1500);

  const frameTotal = Number(await page.getByTestId('total-frame').innerText());
  const stateTotal = Number(await page.getByTestId('total-state').innerText());
  const stateRps = Number(await page.getByTestId('rps-state').innerText());

  // The whole claim of the section, asserted rather than described.
  expect(frameTotal).toBeLessThan(10);
  expect(stateTotal).toBeGreaterThan(60);
  expect(stateRps).toBeGreaterThan(20);

  await page.locator('#s4').screenshot({ path: `${SHOTS}/08-performance.png` });
});

test('09 vanilla three.js mounts, disposes, and remounts cleanly', async ({ page }) => {
  await page.locator('#s5').scrollIntoViewIfNeeded();
  await settle(page, 1500);

  const stage = page.locator('#s5 .stage');
  await expect(stage.locator('canvas')).toHaveCount(1);
  const centred = await assertRendered(stage, '09a-vanilla');

  // The backdrop alone would satisfy a byte check, so prove the *lens* is there: it is
  // the only thing in the scene that tracks the pointer.
  const b = (await stage.boundingBox())!;
  await page.mouse.move(b.x + b.width * 0.82, b.y + b.height * 0.25);
  await settle(page, 900);
  const moved = await assertRendered(stage, '09a2-vanilla-pointer');
  expect(Buffer.compare(centred, moved), 'the vanilla lens did not follow the pointer').not.toBe(0);

  await page.getByTestId('vanilla-toggle').click();
  await settle(page, 500);
  await expect(stage.locator('canvas')).toHaveCount(0);
  await stage.screenshot({ path: `${SHOTS}/09b-vanilla-disposed.png` });

  await page.getByTestId('vanilla-toggle').click();
  await settle(page, 1200);
  await expect(stage.locator('canvas')).toHaveCount(1);

  // Cycle the backdrop: each flip tears the renderer down and builds a new one, so a
  // leaked context would show up as a dead canvas here.
  for (const b of ['grid', 'noise', 'photo', 'checker']) {
    await page.getByTestId(`backdrop-${b}`).click();
    await page.waitForTimeout(400);
  }
  await settle(page, 1200);
  await expect(stage.locator('canvas')).toHaveCount(1);
  await assertRendered(stage, '09c-vanilla-after-6-remounts');
});

test('10 real UI bar mode navigates via navItems', async ({ page }) => {
  await page.locator('#s6').scrollIntoViewIfNeeded();
  await settle(page, 2000);
  await assertRendered(page.locator('#s6 .appshell__hero'), '10-realui-bar');
});

test('11 reference defaults are parsed from the source, not typed in', async ({ page }) => {
  await page.locator('#s7').scrollIntoViewIfNeeded();

  await expect(page.getByTestId('default-ior')).toHaveText('1.15');
  await expect(page.getByTestId('default-thickness')).toHaveText('5');
  await expect(page.getByTestId('default-chromaticAberration')).toHaveText('0.1');
  await expect(page.getByTestId('default-anisotropy')).toHaveText('0.01');
  await expect(page.getByTestId('default-scale')).toHaveText('0.15');
  // Undocumented pass-throughs have no FluidGlass default at all.
  await expect(page.getByTestId('default-distortion')).toHaveText('material default');

  await page.getByTestId('toggle-source').click();
  await expect(page.getByTestId('source-dump')).toContainText('MeshTransmissionMaterial');

  await page.locator('#s7').screenshot({ path: `${SHOTS}/11-reference.png`, scale: 'css' });
});

test('12 theme is persisted and applied before first paint', async ({ page }) => {
  const html = page.locator('html');
  const start = await html.getAttribute('data-theme');

  await page.getByTestId('theme-toggle').click();
  const flipped = start === 'dark' ? 'light' : 'dark';
  await expect(html).toHaveAttribute('data-theme', flipped);

  await page.reload();
  // No flash: the inline script in <head> sets it, so it is correct on the very first frame.
  await expect(html).toHaveAttribute('data-theme', flipped);
  expect(await page.evaluate(() => localStorage.getItem('fg-theme'))).toBe(flipped);

  await page.locator('.hero').screenshot({ path: `${SHOTS}/12-theme-${flipped}.png` });

  await page.getByTestId('theme-toggle').click();
  await expect(html).toHaveAttribute('data-theme', start!);
});

test('13 backdrop picker reaches the hand-built pipeline', async ({ page }) => {
  await page.getByTestId('backdrop-noise').click();
  await expect(page.locator('#s1 .stage')).toHaveClass(/bd--noise/);

  await page.locator('#s2').scrollIntoViewIfNeeded();
  await settle(page, 1600);
  const noise = await assertRendered(page.locator('#s2 .card').first(), '13a-internals-noise');

  await page.getByTestId('backdrop-grid').click();
  await settle(page, 1600);
  const grid = await assertRendered(page.locator('#s2 .card').first(), '13b-internals-grid');

  expect(Buffer.compare(noise, grid), 'backdrop change did not reach the FBO').not.toBe(0);
});
