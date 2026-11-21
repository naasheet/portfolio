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
export const liveMood = {
  size: 1,
  drift: 1,
  spread: 1,
  fade: 0,
  /** The page shape's placement (4.3): offset in world units and scale. */
  placeX: 0,
  placeY: 0,
  placeScale: 1,
};

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

let placeTween: gsap.core.Tween | null = null;

/** Move the shape to a page's placement (4.3), with the morph's timing. */
export function placeTo(
  place: { x: number; y: number; scale: number },
  { instant = false }: { instant?: boolean } = {},
): void {
  placeTween?.kill();
  placeTween = null;
  const target = { placeX: place.x, placeY: place.y, placeScale: place.scale };
  if (instant) {
    Object.assign(liveMood, target);
    requestFrame();
    return;
  }
  placeTween = gsap.to(liveMood, { ...target, duration: MORPH_DURATION, ease: MORPH_EASE });
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
  placeTween?.kill();
  moodTween = fadeTween = placeTween = null;
}

/**
 * The room (R.3), live: `room` 0–1 shows the room's extras (aRoom kinds, warm light, steam,
 * reflection, the 25° tilt), `phone` 0–1 the phone layout's rules (no lamp, no pool), plus the
 * layout's reference points in shape units. Tweened with the morph, so a page change or a
 * desktop / phone switch slides instead of jumping. Particles copies it into the uniforms.
 */
export const liveRoom = {
  room: 0,
  phone: 0,
  deskY: 0,
  poolX: 0,
  poolY: 0,
  poolZ: 0,
  poolR: 0,
  steamX: 0,
  steamY: 0,
  steamZ: 0,
  steamH: 1,
  /** R.6: how much of the screen code has typed in (0–1, by line) and the lamp's bulb (0–1). */
  type: 1,
  bulb: 1,
};

export type RoomState = Partial<typeof liveRoom>;

let roomTween: gsap.core.Tween | null = null;

/** Tween the room state (with the morph's timing), or set it (reduced motion). */
export function roomTo(
  state: RoomState,
  {
    instant = false,
    duration = MORPH_DURATION,
  }: { instant?: boolean; duration?: number } = {},
): void {
  roomTween?.kill();
  roomTween = null;
  if (instant) {
    Object.assign(liveRoom, state);
    requestFrame();
    return;
  }
  roomTween = gsap.to(liveRoom, {
    ...state,
    duration,
    ease: MORPH_EASE,
  });
}

/** Drop the room tween (unmount). */
export function stopRoom(): void {
  roomTween?.kill();
  roomTween = null;
}
