/*
 * The latest hand landmarks (8.1 set up the buffer; 8.2's worker fills it through
 * features/ar/tracker.ts). Only the nine points the gestures use come back from the worker
 * (CLAUDE.md §9.6): the wrist, every fingertip, and the index, middle and little knuckles, in the
 * TRACKED order. x and y in 0–1 of the camera frame (not mirrored), written in place. Nothing
 * here touches React or the store (they change ~30 times a second, CLAUDE.md §5.3).
 */

/** MediaPipe's indices of the points the worker sends, in buffer order (the slots below). */
export const TRACKED = [0, 4, 5, 8, 9, 12, 16, 17, 20] as const;
export const TRACKED_COUNT = TRACKED.length;

/** Slot of each tracked point in `points` (slot × 2 = x, + 1 = y). */
export const SLOT = {
  wrist: 0,
  thumbTip: 1,
  indexKnuckle: 2,
  indexTip: 3,
  middleKnuckle: 4,
  middleTip: 5,
  ringTip: 6,
  littleKnuckle: 7,
  littleTip: 8,
} as const;

export const landmarks = {
  /** x, y per slot. */
  points: new Float32Array(TRACKED_COUNT * 2),
  /** A hand is in view and `points` is current. */
  visible: false,
  /** Bumped on every write, so a reader can skip a redraw when nothing changed. */
  version: 0,
  /** Detection results a second, measured by the tracker (0 when it isn't running). */
  fps: 0,
  /** The tracker: not running, loading the model, or detecting (the preview's status row). */
  phase: "off" as TrackerPhase,
  /** The camera frame's width ÷ height (points are 0–1 per axis), for distances (8.3). */
  aspect: 4 / 3,
  /** 8.5: the camera frame's size as sent (the slow fallback drops it to 320 × 240). */
  frameWidth: 0,
  frameHeight: 0,
  /** 8.4: which hand (the subject's own), for the island's "Tracking · right hand". */
  hand: null as "left" | "right" | null,
  /** Where the model runs, once loaded (the GPU delegate, or the CPU fallback). */
  delegate: null as "GPU" | "CPU" | null,
};

export type TrackerPhase = "off" | "loading" | "ready";

/**
 * The preview's simplified skeleton over the nine slots: the palm outline and a bone from each
 * knuckle (the wrist for the thumb) to its fingertip. The ring finger has no knuckle in the set;
 * the preview draws it from halfway between the middle and little knuckles.
 */
export const TRACKED_BONES: readonly (readonly [number, number])[] = [
  [SLOT.wrist, SLOT.indexKnuckle],
  [SLOT.indexKnuckle, SLOT.middleKnuckle],
  [SLOT.middleKnuckle, SLOT.littleKnuckle],
  [SLOT.littleKnuckle, SLOT.wrist],
  [SLOT.wrist, SLOT.thumbTip],
  [SLOT.indexKnuckle, SLOT.indexTip],
  [SLOT.middleKnuckle, SLOT.middleTip],
  [SLOT.littleKnuckle, SLOT.littleTip],
];

/** Fingertip slots, drawn amber. */
export const TRACKED_TIPS: readonly number[] = [
  SLOT.thumbTip,
  SLOT.indexTip,
  SLOT.middleTip,
  SLOT.ringTip,
  SLOT.littleTip,
];

/**
 * Copies one worker result into the buffer: `packed` holds x, y per slot (or is null when no
 * hand is in view).
 */
export function writeLandmarks(
  packed: Float32Array | null,
  hand: "left" | "right" | null = null,
): void {
  landmarks.hand = packed ? hand : null;
  if (packed && packed.length === landmarks.points.length) {
    landmarks.points.set(packed);
    landmarks.visible = true;
  } else {
    landmarks.visible = false;
  }
  landmarks.version++;
}

/*
 * MediaPipe's full 21-point hand, used by the explainer's gesture drawings (HandSkeleton); the
 * live buffer above only has the nine tracked points. Pairs of landmark indices.
 */
export const HAND_CONNECTIONS: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // index
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12], // middle
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16], // ring
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20], // little
];

/** Fingertips, drawn amber (the boards' drawing). */
export const FINGERTIPS: readonly number[] = [4, 8, 12, 16, 20];
