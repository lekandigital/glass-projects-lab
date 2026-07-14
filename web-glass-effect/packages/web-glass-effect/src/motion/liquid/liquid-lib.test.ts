import {
  CONCAVE,
  CONVEX,
  CONVEX_CIRCLE,
  LIP,
  calculateRefractionSpecular,
  getDisplacementData,
} from './liquid-lib';

describe('liquid-lib physics', () => {
  it('generates displacement map dimensions using explicit dpr', () => {
    const { displacementMap } = getDisplacementData({
      canvasWidth: 120,
      canvasHeight: 80,
      objectWidth: 100,
      objectHeight: 60,
      radius: 24,
      dpr: 2,
    });

    expect(displacementMap.width).toBe(240);
    expect(displacementMap.height).toBe(160);
  });

  it('creates non-neutral displacement values around the bezel', () => {
    const { displacementMap } = getDisplacementData({
      canvasWidth: 160,
      canvasHeight: 120,
      objectWidth: 120,
      objectHeight: 80,
      radius: 24,
      bezelWidth: 18,
      dpr: 1,
    });

    let foundDistortion = false;
    for (let i = 0; i < displacementMap.data.length; i += 4) {
      const r = displacementMap.data[i];
      const g = displacementMap.data[i + 1];
      const b = displacementMap.data[i + 2];
      const a = displacementMap.data[i + 3];
      if (!(r === 128 && g === 128 && b === 0 && a === 255)) {
        foundDistortion = true;
        break;
      }
    }

    expect(foundDistortion).toBe(true);
  });

  it('handles tiny dimensions and radii without throwing', () => {
    expect(() =>
      getDisplacementData({
        canvasWidth: 1,
        canvasHeight: 1,
        objectWidth: 1,
        objectHeight: 1,
        radius: 0,
        bezelWidth: 0,
      }),
    ).not.toThrow();
  });

  it('builds a specular layer with visible alpha data', () => {
    const data = calculateRefractionSpecular(120, 72, 24, 12, Math.PI / 4, 1);

    const alphaValues: number[] = [];
    for (let i = 3; i < data.data.length; i += 4) {
      alphaValues.push(data.data[i] ?? 0);
    }

    const maxAlpha = Math.max(...alphaValues);
    const minAlpha = Math.min(...alphaValues);

    expect(maxAlpha).toBeGreaterThan(0);
    expect(minAlpha).toBe(0);
  });

  it('keeps core surface functions in expected bounds and shape', () => {
    const samples = Array.from({ length: 21 }, (_, i) => i / 20);

    const convexValues = samples.map(CONVEX.fn);
    const isNonDecreasing = convexValues.every((value, index) => {
      if (index === 0) {
        return true;
      }
      return value >= (convexValues[index - 1] ?? 0);
    });

    expect(isNonDecreasing).toBe(true);

    for (const fn of [CONVEX_CIRCLE.fn, CONVEX.fn, CONCAVE.fn, LIP.fn]) {
      for (const x of samples) {
        const result = fn(x);
        expect(Number.isFinite(result)).toBe(true);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1.5);
      }
    }
  });
});
