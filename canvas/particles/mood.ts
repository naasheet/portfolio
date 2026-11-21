import type { Mood } from "@/content/chapters";
import { gsap } from "@/lib/motion/gsap";
import { requestFrame } from "../frame";
import { MORPH_DURATION, MORPH_EASE } from "./morph";

/**
 * The live mood (3.5): the page mood's size / drift / spread, plus `fade` (uFade, R.2: 0 full
 * strength, 1 all the way to the background; the scatter routes use SCATTER_FADE). One object for the one Points mesh;
 * Particles copies it into the uniforms every frame (drift speed is integrated there, so a
 * speed change never jumps the drift).
 */
export const liveMood = { size: 1, drift: 1, spread: 1, fade: 0 };

let moodTween: gsap.core.Tween | null = null;
let fadeTween: gsap.core.Tween | null = null;

/** Tween to `mood` with the morph's duration and easing (or set it, for reduced motion). */
export function moodTo(
  mood: Mood,
  {
    duration = MORPH_DURATION,
    instant = false,
  }: { duration?: number; instant?: boolean } = {},
): void {
  moodTween?.kill();
  moodTween = null;
  if (instant) {
    Object.assign(liveMood, mood);
    requestFrame();
    return;
  }
  moodTween = gsap.to(liveMood, {
    size: mood.size,
    drift: mood.drift,
    spread: mood.spread,
    duration,
    ease: MORPH_EASE,
  });
}

/** Fade the particles toward the background (1) or back to full (0), with the morph's timing. */
export function fadeTo(
  fade: number,
  {
    duration = MORPH_DURATION,
    instant = false,
  }: { duration?: number; instant?: boolean } = {},
): void {
  fadeTween?.kill();
  fadeTween = null;
  if (instant) {
    liveMood.fade = fade;
    requestFrame();
    return;
  }
  fadeTween = gsap.to(liveMood, { fade, duration, ease: MORPH_EASE });
}

/** Drop running tweens (unmount). */
export function stopMood(): void {
  moodTween?.kill();
  fadeTween?.kill();
  moodTween = fadeTween = null;
}
