import type {
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
} from "three";
import { gsap } from "@/lib/motion/gsap";
import { requestFrame } from "../frame";
import type { ShapePoints } from "../shapes/constants";

export type ParticleMesh = Points<BufferGeometry, ShaderMaterial>;

/** Must match particles.vert.glsl: delay = aRandom.x * DELAY_SPAN, progress over 1 - DELAY_SPAN. */
const DELAY_SPAN = 0.4;
/** A chapter morph's length and easing; mood.ts tweens the chapter mood with the same. */
export const MORPH_DURATION = 1.2;
export const MORPH_EASE = "power3.inOut";

let tween: gsap.core.Tween | null = null;
let target: ShapePoints | null = null;
let pending: {
  mesh: ParticleMesh;
  shape: ShapePoints;
  instant: boolean;
  duration: number;
} | null = null;

/**
 * Morph the particles into `shape` (CLAUDE.md §9.2). Safe at any scroll speed: calls in the same
 * task are coalesced (only the last one runs, on a microtask), and a morph that's already
 * running is frozen where it is, on the CPU, before the new one starts, so nothing pops.
 * `instant` (reduced motion) swaps without a morph and asks for one frame. `duration` (s) slows
 * it down, e.g. the calm move to the scatter off the homepage.
 */
export function morphTo(
  mesh: ParticleMesh,
  shape: ShapePoints,
  {
    instant = false,
    duration = MORPH_DURATION,
  }: { instant?: boolean; duration?: number } = {},
): void {
  const queued = pending !== null;
  pending = { mesh, shape, instant, duration };
  if (!queued) queueMicrotask(flush);
}

/** Drop any running morph (unmount). */
export function stopMorph(): void {
  tween?.kill();
  tween = null;
  target = null;
  pending = null;
}

function flush(): void {
  const job = pending;
  pending = null;
  if (!job || job.shape === target) return;
  const { mesh, shape, instant, duration } = job;
  const morph = mesh.material.uniforms.uMorph;
  const fromAttr = mesh.geometry.getAttribute("aFrom") as BufferAttribute;
  const toAttr = mesh.geometry.getAttribute("aTo") as BufferAttribute;
  const randAttr = mesh.geometry.getAttribute("aRandom") as BufferAttribute;
  if (!morph) return;
  const from = fromAttr.array as Float32Array;
  const to = toAttr.array as Float32Array;
  const rand = randAttr.array as Float32Array;

  tween?.kill();
  tween = null;
  target = shape;

  if (instant) {
    from.set(shape);
    to.set(shape);
    morph.value = 1;
  } else {
    // Freeze the current blend into aFrom, with exactly the shader's per-particle maths.
    const u = morph.value as number;
    if (u >= 1) {
      from.set(to);
    } else if (u > 0) {
      const span = 1 - DELAY_SPAN;
      for (let i = 0, n = from.length / 3; i < n; i++) {
        let p = (u - rand[i * 4]! * DELAY_SPAN) / span;
        if (p <= 0) continue; // still at aFrom
        if (p > 1) p = 1;
        p = p * p * (3 - 2 * p);
        const o = i * 3;
        from[o] = from[o]! + (to[o]! - from[o]!) * p;
        from[o + 1] = from[o + 1]! + (to[o + 1]! - from[o + 1]!) * p;
        from[o + 2] = from[o + 2]! + (to[o + 2]! - from[o + 2]!) * p;
      }
    }
    // u === 0: nothing has moved yet, aFrom is already where the particles are.
    to.set(shape);
    morph.value = 0;
    tween = gsap.to(morph, {
      value: 1,
      duration,
      ease: MORPH_EASE,
      onComplete: () => {
        tween = null;
      },
    });
  }

  fromAttr.needsUpdate = true;
  toAttr.needsUpdate = true;
  if (instant) requestFrame();
}
