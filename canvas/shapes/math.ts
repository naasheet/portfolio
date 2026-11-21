import { MAX_PARTICLES, createShape, type ShapePoints } from "./constants";

/*
 * Maths shapes. Each returns MAX_PARTICLES points in its own units; registry.ts normalizes
 * (centres, fits, shuffles) them like every other shape.
 */

/** Fibonacci sphere: evenly spread over the surface, with a thin shell for depth. */
export function sphere(rand: () => number): ShapePoints {
  const out = createShape();
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const y = 1 - (2 * (i + 0.5)) / MAX_PARTICLES;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const shell = 1 + (rand() - 0.5) * 0.03;
    out[i * 3] = Math.cos(theta) * r * shell;
    out[i * 3 + 1] = y * shell;
    out[i * 3 + 2] = Math.sin(theta) * r * shell;
  }
  return out;
}

/** A flat grid of lines (12 × 7 cells), points spread along the lines. */
export function grid(rand: () => number, cols = 12, rows = 7): ShapePoints {
  const out = createShape();
  const w = cols,
    h = rows;
  const vertical = (cols + 1) * h; // total length of the vertical lines
  const horizontal = (rows + 1) * w;
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const pick = rand() * (vertical + horizontal);
    let x: number, y: number;
    if (pick < vertical) {
      x = Math.floor(rand() * (cols + 1));
      y = rand() * h;
    } else {
      x = rand() * w;
      y = Math.floor(rand() * (rows + 1));
    }
    out[i * 3] = x + (rand() - 0.5) * 0.04;
    out[i * 3 + 1] = y + (rand() - 0.5) * 0.04;
    out[i * 3 + 2] = (rand() - 0.5) * 0.08;
  }
  return out;
}

/** A ring facing the camera: a thin torus with a soft, slightly fuzzy tube. */
export function ring(rand: () => number, radius = 1, tube = 0.09): ShapePoints {
  const out = createShape();
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const a = rand() * Math.PI * 2;
    const b = rand() * Math.PI * 2;
    // Bias towards the tube's centre line so the ring reads as one crisp band.
    const t = tube * Math.sqrt(rand());
    const r = radius + Math.cos(b) * t;
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = Math.sin(a) * r;
    out[i * 3 + 2] = Math.sin(b) * t;
  }
  return out;
}

/** A random box: the idle state (other routes, before the first chapter shape). */
export function scatter(rand: () => number): ShapePoints {
  const out = createShape();
  for (let i = 0; i < out.length; i++) out[i] = rand() * 2 - 1;
  return out;
}
