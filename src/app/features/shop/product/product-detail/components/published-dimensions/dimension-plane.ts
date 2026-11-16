export interface DimensionPlane {
  x: number;
  y: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

/** Fit both axes into a common coordinate system without changing their ratio. */
export function fitDimensionPlane(horizontal: number, vertical: number): DimensionPlane {
  const scale = Math.min(174 / horizontal, 108 / vertical);
  const width = horizontal * scale;
  const height = vertical * scale;
  const x = 28 + (174 - width) / 2;
  const y = 38 + (108 - height) / 2;
  return {
    x,
    y,
    width,
    height,
    right: x + width,
    bottom: y + height,
    centerX: x + width / 2,
    centerY: y + height / 2,
  };
}
