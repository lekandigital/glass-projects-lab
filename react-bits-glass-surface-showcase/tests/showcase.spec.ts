import { test, expect, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs';

const SHOTS = 'test-results/shots';
fs.mkdirSync(SHOTS, { recursive: true });

/**
 * A backdrop-filter that silently fell back to a plain blur still passes every DOM
 * assertion you can write about it, so "is the effect real" is checked as a picture:
 * two shots that must differ, not a class name that must exist.
 */
async function shot(target: Locator, name: string) {
  return target.screenshot({ path: `${SHOTS}/${name}.png` });
}

async function settle(page: Page, ms = 600) {
  await page.waitForTimeout(ms);
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', e => {
    throw new Error(`uncaught page error: ${e.message}`);
  });
  await page.goto('/');
  await page.waitForSelector('.pg__surface');
});

test('01 the browser actually gets the SVG filter path, not the fallback', async ({ page }) => {
  // Everything else on this page is meaningless if this is false.
  await expect(page.getByTestId('browser-gate')).toHaveClass(/browser--ok/);
  await expect(page.locator('#s1 .glass-surface')).toHaveClass(/glass-surface--svg/);
  await expect(page.locator('#s1 .glass-surface')).not.toHaveClass(/glass-surface--fallback/);
});

test('02 playground renders and the surface sits inside its stage', async ({ page }) => {
  await settle(page);

  const stage = (await page.getByTestId('pg-stage').boundingBox())!;
  const surf = (await page.locator('#s1 .glass-surface').boundingBox())!;

  expect(surf.width).toBeGreaterThan(100);
  expect(surf.x).toBeGreaterThanOrEqual(stage.x - 1);
  expect(surf.x + surf.width).toBeLessThanOrEqual(stage.x + stage.width + 1);
  expect(surf.y + surf.height).toBeLessThanOrEqual(stage.y + stage.height + 1);

  await shot(page.getByTestId('pg-stage'), '02-playground');
});

test('03 distortionScale visibly bends the backdrop', async ({ page }) => {
  await settle(page);
  const stage = page.getByTestId('pg-stage');

  await page.getByTestId('c-distortionScale').fill('0');
  await settle(page);
  const flat = await shot(stage, '03a-scale-0');

  await page.getByTestId('c-distortionScale').fill('-300');
  await settle(page);
  const bent = await shot(stage, '03b-scale-minus300');

  expect(Buffer.compare(flat, bent), 'distortionScale changed nothing on screen').not.toBe(0);
  await expect(page.locator('#s1').getByTestId('generated-code')).toContainText('distortionScale={-300}');
});

test('04 presets come from the single config object', async ({ page }) => {
  await page.getByTestId('preset-prism').click();
  await settle(page);

  const code = page.locator('#s1').getByTestId('generated-code');
  await expect(code).toContainText('redOffset={-40}');
  await expect(code).toContainText('blueOffset={45}');
  await shot(page.getByTestId('pg-stage'), '04-preset-prism');
});

test('05 the generated code omits props left at their defaults', async ({ page }) => {
  await page.getByTestId('preset-componentDefault').click();
  const code = page.locator('#s1').getByTestId('generated-code');
  // componentDefault is the component's own defaults, so only width/height should survive.
  await expect(code).toContainText('width={320}');
  await expect(code).not.toContainText('brightness=');
  await expect(code).not.toContainText('xChannel=');
});

test('06 internals renders the real displacement map and its three planes', async ({ page }) => {
  await page.locator('#s2').scrollIntoViewIfNeeded();
  await settle(page, 1200);

  // The map is a data: URI produced by the ported generator, not a static asset.
  const src = await page.getByTestId('map-raw').getAttribute('src');
  expect(src).toMatch(/^data:image\/svg\+xml,/);
  expect(decodeURIComponent(src!)).toContain('feDisplacementMap' === '' ? '' : 'linearGradient');

  const planes = page.getByTestId('planes').locator('img');
  await expect(planes).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    expect(await planes.nth(i).getAttribute('src')).toMatch(/^data:image\/png/);
  }

  await shot(page.locator('#s2'), '06-internals');
});

test('07 the three channel scales are distortionScale + offset', async ({ page }) => {
  await page.locator('#s2').scrollIntoViewIfNeeded();
  await page.getByTestId('i-distortionScale').fill('-200');
  await page.getByTestId('i-blueOffset').fill('30');
  await settle(page);

  // redOffset 0, greenOffset 10 come from the upstream preset this section boots with.
  await expect(page.getByTestId('scale-R')).toHaveText('-200');
  await expect(page.getByTestId('scale-G')).toHaveText('-190');
  await expect(page.getByTestId('scale-B')).toHaveText('-170');
});

test('08 the map regenerates when a map-prop changes', async ({ page }) => {
  await page.locator('#s2').scrollIntoViewIfNeeded();
  await settle(page);

  const before = await page.getByTestId('map-raw').getAttribute('src');
  await page.getByTestId('i-blur').fill('35');
  await settle(page);
  const after = await page.getByTestId('map-raw').getAttribute('src');

  expect(after).not.toBe(before);
  expect(decodeURIComponent(after!)).toContain('blur(35px)');
});

test('09 gallery renders every preset side by side', async ({ page }) => {
  await page.locator('#s3').scrollIntoViewIfNeeded();
  await settle(page, 800);

  await expect(page.locator('#s3 .glass-surface')).toHaveCount(7);
  await shot(page.locator('#s3'), '09-gallery');
});

test('10 the benchmark proves the filter path pays the map cost, and the core does not', async ({ page }) => {
  test.setTimeout(90_000);

  await page.locator('#s4').scrollIntoViewIfNeeded();
  await settle(page, 800);

  await page.getByTestId('run-bench').click();
  await expect(page.getByTestId('run-bench')).toHaveText('Run', { timeout: 60_000 });

  const fps = async (id: string) => Number((await page.getByTestId(`fps-${id}`).innerText()).replace(/\D/g, ''));

  const css = await fps('css');
  const filter = await fps('filter');
  const map = await fps('map');
  const vanilla = await fps('vanilla');

  // Every path must actually have run.
  for (const [k, v] of Object.entries({ css, filter, map, vanilla })) {
    expect(v, `${k} produced no measurement`).toBeGreaterThan(0);
  }

  // The finding, asserted rather than described. distortionScale ought to cost what
  // saturation costs — it is three setAttribute calls. Instead the effect regenerates the
  // map, and the frame rate collapses toward the map path. The proof that the rebuild is
  // the cause, and not the animation itself: the plain-DOM core runs the identical
  // animation, skips the rebuild, and stays with the cheap paths.
  expect(filter, 'animating distortionScale should be measurably slower than a css var').toBeLessThan(css * 0.85);
  expect(map, 'animating blur should be slower still — that work is real').toBeLessThanOrEqual(filter);

  expect(vanilla, 'the vanilla core runs the same animation without the rebuild').toBeGreaterThan(filter * 1.2);
  expect(vanilla, 'and should land near the cheap path, not the expensive one').toBeGreaterThan(css * 0.85);

  await shot(page.locator('#s4'), '10-performance');
});

test('11 the vanilla core skips the rebuild for distortionScale and takes it for blur', async ({ page }) => {
  await page.locator('#s5').scrollIntoViewIfNeeded();
  await settle(page, 800);

  await expect(page.getByTestId('vanilla-stage').locator('.vglass')).toHaveCount(1);
  const start = Number(await page.getByTestId('vanilla-regens').innerText());

  // distortionScale is not a map input: dragging it must not rebuild anything.
  for (const v of ['-260', '-120', '40', '180']) {
    await page.getByTestId('v-distortionScale').fill(v);
  }
  await settle(page, 300);
  expect(Number(await page.getByTestId('vanilla-regens').innerText())).toBe(start);

  // blur is a map input: it has to.
  await page.getByTestId('v-blur').fill('30');
  await settle(page, 300);
  expect(Number(await page.getByTestId('vanilla-regens').innerText())).toBeGreaterThan(start);

  await shot(page.getByTestId('vanilla-stage'), '11a-vanilla');

  // And teardown really removes it.
  await page.getByTestId('vanilla-toggle').click();
  await settle(page, 300);
  await expect(page.getByTestId('vanilla-stage').locator('.vglass')).toHaveCount(0);

  await page.getByTestId('vanilla-toggle').click();
  await settle(page, 500);
  await expect(page.getByTestId('vanilla-stage').locator('.vglass')).toHaveCount(1);
});

test('12 real UI: the glass holds live, interactive controls', async ({ page }) => {
  await page.locator('#s6').scrollIntoViewIfNeeded();
  await settle(page, 800);

  // The tabs and the player are children of a .glass-surface, on top of a live SVG filter.
  await expect(page.locator('#s6 .glass-surface').first()).toBeVisible();
  await page.getByTestId('tab-Radio').click();
  await expect(page.getByTestId('tab-Radio')).toHaveClass(/on/);

  await page.getByTestId('track-2').click();
  await expect(page.getByTestId('track-2')).toHaveClass(/on/);

  const before = await page.getByTestId('volume').innerText();
  const slider = page.getByTestId('volume-slider');
  await slider.fill('15');
  expect(await page.getByTestId('volume').innerText()).not.toBe(before);
  expect(await page.getByTestId('volume').innerText()).toBe('15');

  await shot(page.locator('#s6'), '12-realui');
});

test('13 reference defaults are parsed from the source, not typed in', async ({ page }) => {
  await page.locator('#s7').scrollIntoViewIfNeeded();

  await expect(page.getByTestId('default-width')).toHaveText('200');
  await expect(page.getByTestId('default-height')).toHaveText('80');
  await expect(page.getByTestId('default-borderRadius')).toHaveText('20');
  await expect(page.getByTestId('default-brightness')).toHaveText('50');
  await expect(page.getByTestId('default-distortionScale')).toHaveText('-180');
  await expect(page.getByTestId('default-xChannel')).toHaveText("'R'");
  await expect(page.getByTestId('default-yChannel')).toHaveText("'G'");
  await expect(page.getByTestId('default-mixBlendMode')).toHaveText("'difference'");

  await page.getByTestId('toggle-source').click();
  await expect(page.getByTestId('source-dump')).toContainText('feDisplacementMap');

  await shot(page.locator('#s7'), '13-reference');
});

test('14 backdrop picker reaches every surface', async ({ page }) => {
  await page.getByTestId('backdrop-grid').click();
  await expect(page.getByTestId('pg-stage')).toHaveClass(/bd--grid/);
  await settle(page);
  const grid = await shot(page.getByTestId('pg-stage'), '14a-grid');

  await page.getByTestId('backdrop-noise').click();
  await settle(page);
  const noise = await shot(page.getByTestId('pg-stage'), '14b-noise');

  expect(Buffer.compare(grid, noise), 'the backdrop change did not reach the surface').not.toBe(0);
});

test('15 theme is persisted and applied before first paint', async ({ page }) => {
  const html = page.locator('html');
  const start = await html.getAttribute('data-theme');

  await page.getByTestId('theme-toggle').click();
  const flipped = start === 'dark' ? 'light' : 'dark';
  await expect(html).toHaveAttribute('data-theme', flipped);

  // GlassSurface's own CSS uses light-dark(), which reads color-scheme — not data-theme.
  expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe(flipped);

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', flipped);
  expect(await page.evaluate(() => localStorage.getItem('gs-theme'))).toBe(flipped);

  await settle(page);
  await shot(page.getByTestId('pg-stage'), `15-theme-${flipped}`);
});
