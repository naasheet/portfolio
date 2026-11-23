/*
 * Hand mode's strings (8.1+): the explainer and the camera preview. Kept out of content/copy.ts
 * (which every page loads) because only the lazy AR code reads them; the switch's and the
 * island's few lines are in copy.nav / copy.alerts. From the AR board (Phase 8).
 * TODO(content): review the wording.
 */
export const arCopy = {
  explainer: {
    title: "Steer it with your hand",
    body: "Your webcam turns your hand into the cursor. Point to move, pinch to click, and push the particles around like water.",
    close: "Close",
    gestures: [
      { pose: "point", name: "Point", hint: "moves the cursor" },
      { pose: "pinch", name: "Pinch", hint: "clicks · pinch and drag scrolls" },
      { pose: "palm", name: "Open palm", hint: "hold 1 s: music" },
    ],
    privacy:
      "Video never leaves your device. It's processed right here in your browser, and the camera turns off the moment you switch back to Mouse.",
    toggleHint: "Toggle any time with",
    notNow: "Not now",
    allow: "Allow camera",
    starting: "Starting camera…",
  },
  preview: {
    /** The card's accessible name. */
    label: "Camera preview",
    mirrored: "mirrored",
    /** The status row: the camera alone (no tracker, e.g. /dev's test pattern), then 8.2's states. */
    live: "Camera on",
    loadingModel: "Loading hand model…",
    tracking: "Tracking",
    searching: "Looking for your hand",
    starting: "Starting…",
    off: "Turn Hand mode off",
    dragHint: "Drag to any corner",
  },
  /** 8.2: the hand tracker failed (an error toast; Hand switches back to Mouse). */
  tracker: {
    error: "Hand tracking didn't start, so I switched back to Mouse.",
  },
} as const;

export type HandPose = (typeof arCopy.explainer.gestures)[number]["pose"];
