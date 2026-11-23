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
  /** 8.4: the legend beside the preview (AR board, "Gestures"). */
  legend: {
    title: "Gestures",
    rows: [
      { pose: "point", name: "Point", hint: "move" },
      { pose: "pinch", name: "Pinch", hint: "click · drag to scroll" },
      {
        pose: "palm",
        name: "Open palm, hold",
        hint: "music · opens on the desk",
      },
    ],
    drag: "Drag the preview to any corner",
  },
  /** 8.4: the hand left the frame for 3 s (AR board edge state, "Hand lost"). */
  lostHint: "Show me your hand",
  /** 8.4: the island's AR activity (Island board, "AR · live" and "AR · palm hold"). */
  island: {
    label: "Hand mode",
    tracking: (hand: "left" | "right" | null) =>
      hand ? `Tracking · ${hand} hand` : "Tracking",
    noHand: "No hand",
    fps: (n: number) => `${Math.round(n)} fps`,
    holdMusic: (playing: boolean) =>
      playing ? "Hold to pause music" : "Hold to play music",
    holdOpen: (name: string) => `Hold to open ${name}`,
    seconds: (s: number) => `${s.toFixed(1)} s`,
  },
  /** 8.4: the coach, the first time Hand mode turns on (AR board, "Coach"). */
  coach: {
    label: "Hand mode tour",
    step: (n: number, of: number) => `Step ${n} of ${of}`,
    skip: "Skip tour",
    waiting: "Waiting for you…",
    next: "Next",
    done: "Done",
    steps: [
      {
        pose: "point",
        title: "Point",
        body: "Raise one hand and point at the screen. The amber dot follows your index finger. Try touching the laptop.",
      },
      {
        pose: "pinch",
        title: "Pinch to click",
        body: "Tap your thumb and index finger together. The specks snap into one dot, and whatever you're pointing at clicks.",
      },
      {
        pose: "drag",
        title: "Pinch and drag to scroll",
        body: "Hold the pinch and move your hand up or down. Let go to stop, with a little glide.",
      },
    ],
  },
} as const;

export type HandPose = (typeof arCopy.explainer.gestures)[number]["pose"];
