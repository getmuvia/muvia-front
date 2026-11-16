import { fitDimensionPlane } from './dimension-plane';

describe('Published dimension diagram proportions', () => {
  it.each([
    [140, 75],
    [60, 200],
    [0.6, 0.075],
  ])('preserves the ratio of %s by %s within the drawing', (width, height) => {
    const plane = fitDimensionPlane(width, height);
    expect(plane.width / plane.height).toBeCloseTo(width / height);
    expect(plane.x).toBeGreaterThanOrEqual(0);
    expect(plane.y).toBeGreaterThanOrEqual(0);
    expect(plane.right).toBeLessThan(240);
    expect(plane.bottom + 43).toBeLessThan(220);
  });
});
