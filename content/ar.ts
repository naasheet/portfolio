/*
 * Hand mode's strings (8.1+): the explainer and the camera preview. Kept out of content/copy.ts
 * (which every page loads) because only the lazy AR code reads them; the switch's and the
 * island's few lines are in copy.nav / copy.alerts. From the AR board (Phase 8).
 * TODO(content): review the wording.
 */
export const arCopy = {
  explainer: {
    title: "Steer it with your hand",
    body: "Your webcam turns your hand into the cursor. Point to move, hold still on something to click it, and push the particles around like water.",
    close: "Close",
    gestures: [
      { pose: "point", name: "Point", hint: "moves · hold still to click" },
      { pose: "two", name: "Two fingers", hint: "scroll up and down" },
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
  /** 8.5: still slow after dropping to 320 × 240 (AR board edge state, "Too slow"). */
  slow: {
    text: "Tracking is slow here",
    detail: "Dropped to low resolution. Still slow?",
    action: "Turn off",
  },
  /** 8.4: the legend beside the preview (AR board, "Gestures"). */
  legend: {
    title: "Gestures",
    rows: [
      { pose: "point", name: "Point", hint: "move · hold still to click" },
      { pose: "two", name: "Two fingers", hint: "scroll" },
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
        pose: "dwell",
        title: "Hold still to click",
        body: "Rest the dot on a button or link. The ring around it fills up, and when it's full, it clicks. Try Next.",
      },
      {
        pose: "two",
        title: "Two fingers to scroll",
        body: "Raise your index and middle fingers and move your hand up or down: the page follows, like dragging it. Drop a finger to stop, with a little glide.",
      },
    ],
  },
} as const;

export type HandPose = (typeof arCopy.explainer.gestures)[number]["pose"];
