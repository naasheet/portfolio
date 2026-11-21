/** Attributes are sized for the maximum (CLAUDE.md §6: 20k–40k); setDrawRange picks the count. */
export const MAX_PARTICLES = 40_000;
export const DEFAULT_PARTICLES = 30_000;

/** A shape: exactly MAX_PARTICLES × 3 floats (x, y, z), shuffled, so any prefix covers it all. */
export type ShapePoints = Float32Array;

/** World-unit box every chapter shape is fitted into (the view at z = 0 is ~6.7 × 3.8 at 16:9). */
export const SHAPE_BOX = { x: 4, y: 2.4, z: 2.4 } as const;

/** The idle scatter fills more of the view than a chapter shape. */
export const SCATTER_BOX = { x: 7, y: 4.2, z: 3 } as const;

export type Box = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
};

export function createShape(): ShapePoints {
  return new Float32Array(MAX_PARTICLES * 3);
}
