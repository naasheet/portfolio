/*
 * Visitor-facing UI strings (CLAUDE.md §8: copy lives in content/, never in components).
 * Chunk 4.1 extends this into the full copy model.
 */
export const copy = {
  ui: {
    /** Screen-reader text for a button that is busy. */
    loading: "Loading",
    /** Accessible name of a toast's close button. */
    dismiss: "Dismiss",
  },
  /** The nav row, the island and the phone menu (2.4). */
  nav: {
    label: "Main",
    wordmark: "nasheet.",
    home: "Home",
    /** The island's button; the chapter follows, e.g. "Navigation, 03 Work". */
    island: "Navigation",
    menu: "Open the menu",
    menuTitle: "Menu",
    close: "Close",
    mode: "Pointer",
    mouse: "Mouse",
    hand: "Hand",
    terminal: "Terminal",
    theme: "Theme",
    soundOff: "Sound is off",
    soundOn: "Sound is on",
    tapForSound: "Tap for sound",
    getInTouch: "Get in touch",
    /** Accessible name of the second activity's circle in the split shape. */
    collapse: "Close",
  },
  /** Island alerts for quiet actions (Island board: "Light theme · T to switch back"). */
  alerts: {
    lightTheme: "Light theme",
    darkTheme: "Dark theme",
    soundOn: "Sound on",
    soundOff: "Sound off",
    handMode: "Hand mode",
    mouseMode: "Mouse mode",
    switchBack: (key: string) => `${key} to switch back`,
  },
  /** The ? overlay (Navigation board). */
  shortcuts: {
    title: "Keyboard",
    description:
      "Lit keys do something. They work anywhere except while you're typing.",
    close: "Close",
    terminal: "Terminal",
    chat: "Ask about my work",
    sound: "Sound",
    theme: "Theme",
    ar: "Mouse / Hand mode",
    shortcuts: "Shortcuts (⇧ + /)",
    escape: "Close what's open",
  },
  /** Placeholder pill in the persistent layer (2.3); 7.4 replaces it with the Ask bubble. */
  layer: {
    ask: "Ask",
  },
} as const;
