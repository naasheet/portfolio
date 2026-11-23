/*
 * The latest hand landmarks (8.1 sets up the buffer; 8.2's worker fills it). 21 points from
 * MediaPipe's hand model, x and y in 0–1 of the camera frame (not mirrored), written in place.
 * The camera preview draws them; nothing here touches React or the store (they change ~30 times a
 * second, CLAUDE.md §5.3).
 */
export const LANDMARK_COUNT = 21;

export const landmarks = {
  /** x0, y0, x1, y1 … */
  points: new Float32Array(LANDMARK_COUNT * 2),
  /** A hand is in view and `points` is current. */
  visible: false,
  /** Bumped on every write, so a reader can skip a redraw when nothing changed. */
  version: 0,
};

/** MediaPipe's hand skeleton: pairs of landmark indices. */
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
