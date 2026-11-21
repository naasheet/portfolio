import { MAX_PARTICLES, createShape, type ShapePoints } from "./constants";

const WIDTH = 1024;
const HEIGHT = 256;
const MAX_FONT_PX = 200;

/** The SF Pro Display stack from next/font (CLAUDE.md §7); never a hardcoded family. */
function displayFamily(): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-sf-display")
    .trim();
  return value || "system-ui, sans-serif";
}

const fontAt = (px: number) => `700 ${px}px ${displayFamily()}`;

/**
 * SF Pro Display isn't preloaded (it loads on first use), so wait for the Bold face before
 * drawing. Network time: the registry awaits this outside the timed part.
 */
export async function loadTextFont(text: string): Promise<void> {
  try {
    await document.fonts.load(fontAt(MAX_FONT_PX), text);
  } catch {
    // Draw with the fallback rather than not at all.
  }
}

/**
 * Text as points: draw it in SF Pro Display Bold on an offscreen 1024 × 256 canvas, collect the
 * filled pixels, and sample them at random (repeating as needed), with a little Z jitter for
 * depth. Units are pixels, y up; registry.ts normalizes. Call loadTextFont() first.
 */
export function fromText(text: string, rand: () => number): ShapePoints {
  const canvas: OffscreenCanvas | HTMLCanvasElement =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(WIDTH, HEIGHT)
      : Object.assign(document.createElement("canvas"), {
          width: WIDTH,
          height: HEIGHT,
        });
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as
    OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  const out = createShape();
  if (!ctx) return out;

  // Largest size that fits 94% of the width and 80% of the height.
  ctx.font = fontAt(MAX_FONT_PX);
  const measured = ctx.measureText(text).width;
  const px = Math.min(
    MAX_FONT_PX,
    (MAX_FONT_PX * WIDTH * 0.94) / Math.max(measured, 1),
  );
  ctx.font = fontAt(Math.floor(Math.min(px, HEIGHT * 0.8)));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.fillText(text, WIDTH / 2, HEIGHT / 2);

  const { data } = ctx.getImageData(0, 0, WIDTH, HEIGHT);
  const filled = new Uint32Array(WIDTH * HEIGHT);
  let count = 0;
  for (let p = 0; p < WIDTH * HEIGHT; p++) {
    if (data[p * 4 + 3]! > 128) filled[count++] = p;
  }
  if (count === 0) return out;

  for (let i = 0; i < MAX_PARTICLES; i++) {
    const p = filled[Math.floor(rand() * count)]!;
    out[i * 3] = (p % WIDTH) + rand();
    out[i * 3 + 1] = -(Math.floor(p / WIDTH) + rand());
    out[i * 3 + 2] = (rand() - 0.5) * 12; // about 0.05 world units once fitted
  }
  return out;
}
