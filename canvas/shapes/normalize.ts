import { type Box, SHAPE_BOX, type ShapePoints } from "./constants";

/** Translation and uniform scale that centre the points and fit them inside `box`. */
export function fitTransform(
  points: ArrayLike<number>,
  box: Box = SHAPE_BOX,
): { cx: number; cy: number; cz: number; scale: number } {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (let i = 0; i < points.length; i += 3) {
    const x = points[i]!,
      y = points[i + 1]!,
      z = points[i + 2]!;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  // A flat dimension (size 0) doesn't limit the scale.
  const limit = (size: number, room: number) =>
    size > 1e-6 ? room / size : Infinity;
  const scale = Math.min(
    limit(maxX - minX, box.x),
    limit(maxY - minY, box.y),
    limit(maxZ - minZ, box.z),
  );
  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    cz: (minZ + maxZ) / 2,
    scale: Number.isFinite(scale) ? scale : 1,
  };
}

/**
 * Centre a shape, scale it uniformly to fit `box` (world units), and shuffle its points.
 * The canvas draws only a prefix (30k of 40k, 15k on the low tier), so the order must be random
 * for every prefix to cover the whole shape. Works in place and returns the same array.
 */
export function normalize(
  points: ShapePoints,
  rand: () => number,
  box: Box = SHAPE_BOX,
): ShapePoints {
  const { cx, cy, cz, scale } = fitTransform(points, box);
  for (let i = 0; i < points.length; i += 3) {
    points[i] = (points[i]! - cx) * scale;
    points[i + 1] = (points[i + 1]! - cy) * scale;
    points[i + 2] = (points[i + 2]! - cz) * scale;
  }
  // Fisher–Yates over whole points.
  for (let i = points.length / 3 - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = i * 3,
      b = j * 3;
    for (let k = 0; k < 3; k++) {
      const t = points[a + k]!;
      points[a + k] = points[b + k]!;
      points[b + k] = t;
    }
  }
  return points;
}
