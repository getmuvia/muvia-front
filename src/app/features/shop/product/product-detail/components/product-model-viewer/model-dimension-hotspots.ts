import type { ProductDimensions } from '@core/models/product/product';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ModelViewerElement extends HTMLElement {
  activateAR?: () => Promise<void> | void;
  getDimensions?: () => Vector3;
  getBoundingBoxCenter?: () => Vector3;
  updateHotspot?: (hotspot: { name: string; position: string }) => void;
  queryHotspot?: (name: string) => { canvasPosition: Vector3 } | null;
}

/** Imported models may place the declared product width on either horizontal axis. */
export function modelDimensionHotspots(
  modelSize: Vector3,
  center: Vector3,
  productSize: ProductDimensions,
): ReadonlyArray<{ name: string; position: string }> {
  const widthIsXAxis = modelSize.x >= modelSize.z === productSize.width >= productSize.depth;
  const halfWidth = (widthIsXAxis ? modelSize.x : modelSize.z) / 2;
  const halfHeight = modelSize.y / 2;
  const halfDepth = (widthIsXAxis ? modelSize.z : modelSize.x) / 2;
  const point = (width: number, height: number, depth: number): Vector3 => ({
    x: center.x + (widthIsXAxis ? width : depth),
    y: center.y + height,
    z: center.z + (widthIsXAxis ? depth : width),
  });
  const positions = {
    'hotspot-width-start': point(halfWidth, halfHeight, -halfDepth),
    'hotspot-width-end': point(-halfWidth, halfHeight, -halfDepth),
    'hotspot-width-label': point(0, halfHeight * 1.16, -halfDepth * 1.08),
    'hotspot-height-start': point(halfWidth, -halfHeight, -halfDepth),
    'hotspot-height-end': point(halfWidth, halfHeight, -halfDepth),
    'hotspot-height-label': point(halfWidth * 1.16, 0, -halfDepth * 1.08),
    'hotspot-depth-start': point(halfWidth, -halfHeight, halfDepth),
    'hotspot-depth-end': point(halfWidth, -halfHeight, -halfDepth),
    'hotspot-depth-label': point(halfWidth * 1.16, -halfHeight * 1.12, 0),
  };
  return Object.entries(positions).map(([name, position]) => ({
    name,
    position: `${position.x} ${position.y} ${position.z}`,
  }));
}
