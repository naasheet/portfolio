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
/** A page morph's length and easing (R.2); mood.ts tweens the mood and the fade with the same. */
export const MORPH_DURATION = 0.9;
export const MORPH_EASE = "power3.inOut";

/**
 * Focus (R.4): when a morph leaves or returns to the room through one of its objects, that
 * object's particles start almost at once (delay x FOCUS_EARLY), so it visibly grows into the
 * new shape, while the rest start later (FOCUS_LATE + delay x (1 - FOCUS_LATE)) and burst
 * outward first (uBurst). Must match particles.vert.glsl.
 */
const FOCUS_EARLY = 0.15;
const FOCUS_LATE = 0.3;
/** The burst: out over BURST_OUT s, back over the rest of the morph. */
const BURST_OUT = 0.3;

let tween: gsap.core.Tween | null = null;
let burst: gsap.core.Timeline | null = null;
let target: ShapePoints | null = null;
/** The running morph's focus object (content/room.ts index), or -1. */
let focus = -1;
let pending: {
  mesh: ParticleMesh;
  shape: ShapePoints;
  instant: boolean;
  duration: number;
  focus: number;
  ease: string;
} | null = null;

/**
 * Morph the particles into `shape` (CLAUDE.md §9.2). Safe at any scroll speed: calls in the same
 * task are coalesced (only the last one runs, on a microtask), and a morph that's already
 * running is frozen where it is, on the CPU, before the new one starts, so nothing pops.
 * `instant` (reduced motion) swaps without a morph and asks for one frame. `duration` (s) slows
 * it down.
 */
export function morphTo(
  mesh: ParticleMesh,
  shape: ShapePoints,
  {
    instant = false,
    duration = MORPH_DURATION,
    focus: nextFocus = -1,
    ease = MORPH_EASE,
  }: {
    instant?: boolean;
    /** GSAP ease (R.6's intro bursts with power2.out); default MORPH_EASE. */
    ease?: string;
    duration?: number;
    /** R.4: the room object to grow first and burst the rest around (-1: none). */
    focus?: number;
  } = {},
): void {
  const queued = pending !== null;
  pending = { mesh, shape, instant, duration, focus: nextFocus, ease };
  if (!queued) queueMicrotask(flush);
}

/** Drop any running morph (unmount). */
export function stopMorph(): void {
  tween?.kill();
  tween = null;
  burst?.kill();
  burst = null;
  target = null;
  pending = null;
  focus = -1;
}

function flush(): void {
  const job = pending;
  pending = null;
  if (!job || job.shape === target) return;
  const { mesh, shape, instant, duration, ease } = job;
  const uniforms = mesh.material.uniforms;
  const morph = uniforms.uMorph;
  const roomAttr = mesh.geometry.getAttribute("aRoom") as
    | BufferAttribute
    | undefined;
  const room = roomAttr?.array as Float32Array | undefined;
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
    burst?.kill();
    burst = null;
    focus = -1;
    if (uniforms.uFocus) uniforms.uFocus.value = -1;
    if (uniforms.uBurst) uniforms.uBurst.value = 0;
  } else {
    // Freeze the current blend into aFrom, with exactly the shader's per-particle maths.
    const u = morph.value as number;
    if (u >= 1) {
      from.set(to);
    } else if (u > 0) {
      const span = 1 - DELAY_SPAN;
      for (let i = 0, n = from.length / 3; i < n; i++) {
        let d = rand[i * 4]!;
        if (focus >= 0 && room) {
          d =
            Math.abs(room[i * 4]! - focus) < 0.5
              ? d * FOCUS_EARLY
              : FOCUS_LATE + d * (1 - FOCUS_LATE);
        }
        let p = (u - d * DELAY_SPAN) / span;
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
    // The new morph's focus (the freeze above used the old one).
    focus = job.focus;
    if (uniforms.uFocus) uniforms.uFocus.value = focus;
    const uBurst = uniforms.uBurst;
    burst?.kill();
    burst = null;
    if (uBurst && focus >= 0) {
      burst = gsap
        .timeline()
        .to(uBurst, { value: 1, duration: BURST_OUT, ease: "power2.out" })
        .to(uBurst, {
          value: 0,
          duration: Math.max(duration - BURST_OUT, 0.1),
          ease: "power2.inOut",
        });
    } else if (uBurst && (uBurst.value as number) > 0) {
      // A morph without focus retargets mid-burst: ease the burst away instead of cutting it.
      burst = gsap.timeline().to(uBurst, { value: 0, duration: 0.3, ease: "power2.out" });
    }
    tween = gsap.to(morph, {
      value: 1,
      duration,
      ease,
      onComplete: () => {
        tween = null;
      },
    });
  }

  fromAttr.needsUpdate = true;
  toAttr.needsUpdate = true;
  if (instant) requestFrame();
}
