/*
 * The one store (CLAUDE.md §5). Every input writes here; the canvas and the UI only read.
 *
 * FAST VALUES — audio.levels, audio.beat, ar.hand and scroll.progress change every frame.
 * Read them with useStore.getState() inside useFrame or the gsap ticker, and keep them in refs.
 * NEVER subscribe a component to them (useStore(s => s.audio.levels) re-renders 60 times a
 * second), and never select a whole slice that contains them (useStore(s => s.audio)).
 * Select single slow fields instead: useStore(s => s.audio.playing).
 *
 * Persisted: ui.soundEnabled (key "sound") and theme.mode (key "theme", through lib/theme.ts,
 * which ThemeScript reads before first paint). The store starts with defaults on the server
 * and the client; hydratePersisted() loads the saved values after hydration.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { PageId } from "@/content/chapters";
import type { RoomObjectId } from "@/content/room";
import { storage } from "./browser";
import { getTheme, setTheme, type Theme } from "./theme";

const SOUND_STORAGE_KEY = "sound";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// --- Slice types ---------------------------------------------------------------------------

/** Smoothed analyser levels, each 0–1. */
export type Levels = { bass: number; mid: number; high: number };

export type AudioSlice = {
  /** The audio engine is running (AudioContext created after a user gesture). */
  enabled: boolean;
  playing: boolean;
  /** Index into the playlist in content/music.ts. */
  trackIndex: number;
  /** 0–1. */
  volume: number;
  /** FAST. */
  levels: Levels;
  /** FAST. True on the frame a beat is detected (drives uPulse). */
  beat: boolean;
  setEnabled: (enabled: boolean) => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setTrackIndex: (index: number) => void;
  setVolume: (volume: number) => void;
  /** Called once per frame by the audio engine. */
  setLevels: (levels: Levels, beat: boolean) => void;
};

export type ScrollSlice = {
  /** FAST. 0–1 scroll progress through the current page (RouteWatcher, R.2). */
  progress: number;
  setProgress: (progress: number) => void;
};

/** Which of the six pages is on screen (R.1). Written only by RouteWatcher, from the URL. */
export type PageSlice = {
  /** null on pages outside the six (credits, dev, terminal, 404). */
  id: PageId | null;
  set: (id: PageId | null) => void;
};

export type ArStatus = "off" | "loading" | "ready" | "denied" | "error";

/**
 * The hand cursor (8.3): the filtered index fingertip in viewport space, each axis 0–1 (0,0 = top
 * left); `palm` is the open-palm hold's progress (0–1) for the cursor's ring.
 */
export type Hand = {
  x: number;
  y: number;
  visible: boolean;
  palm: number;
  /** 8.4: what the palm hold will do: open a desk object (Home) or toggle the music; null = none. */
  holdKind: "open" | "music" | null;
  /** The desk object a hold will open (a room object id), else null. */
  holdTarget: string | null;
  /** How far the dwell-to-click is on what the cursor rests on (0–1; 0 = none). */
  dwell: number;
  /** Two-finger scroll mode is on (the cursor holds still). */
  scrolling: boolean;
  /** Counts dwell clicks, so the cursor can flash on each one. */
  clicks: number;
};

/** Whether this device has a camera (8.1, enumerateDevices): the switch hides with "none". */
export type ArCamera = "unknown" | "yes" | "none";

export type ArSlice = {
  /** Hand mode is on: the camera runs (8.1, components/ar/ARLayer.tsx). */
  enabled: boolean;
  status: ArStatus;
  /** The explainer (8.1) asking for the camera is open. */
  explainerOpen: boolean;
  camera: ArCamera;
  /** FAST. */
  hand: Hand;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  setStatus: (status: ArStatus) => void;
  setHand: (hand: Hand) => void;
  setExplainerOpen: (open: boolean) => void;
  setCamera: (camera: ArCamera) => void;
};

export type UiSlice = {
  /** The visitor is past the entry gate. */
  entered: boolean;
  /** The visitor's sound choice (music and UI sounds). Persisted. */
  soundEnabled: boolean;
  terminalOpen: boolean;
  chatOpen: boolean;
  /** The chatbot is streaming an answer (the canvas pulses). */
  chatStreaming: boolean;
  shortcutsOpen: boolean;
  /** The phone menu (2.4). */
  menuOpen: boolean;
  /** The music queue sheet (5.3), opened from the island's player. */
  queueOpen: boolean;
  /** Ask the Contact page to open its message sheet (6.4, `sudo hire-me`); it clears the flag. */
  contactSheetOpen: boolean;
  /**
   * Home's intro (R.6): "pending" until the gate starts leaving, "play" while the name forms and
   * assembles into the room, "done" once it has settled (or was skipped). lib/motion/intro.ts.
   */
  intro: "pending" | "play" | "done";
  setIntro: (intro: "pending" | "play" | "done") => void;
  setEntered: (entered: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  setTerminalOpen: (open: boolean) => void;
  toggleTerminal: () => void;
  setChatOpen: (open: boolean) => void;
  toggleChat: () => void;
  setChatStreaming: (streaming: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  toggleShortcuts: () => void;
  setMenuOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setContactSheetOpen: (open: boolean) => void;
};

export type ThemeSlice = {
  mode: Theme;
  /** Applies the theme to <html> and saves it. */
  setMode: (mode: Theme) => void;
  toggleMode: () => void;
};

/** Objects in the particle room (content/room.ts roomObjects). */
export const ROOM_OBJECT_COUNT = 9;

/**
 * The particle room's interaction (R.4). The canvas projects each object's box to the screen
 * every frame and writes `view` in place (FAST: a fixed object, never replaced, read with
 * getState() in a ticker). The DOM (RoomOverlay, RoomLinks) hit-tests the pointer and writes
 * `hot`, which the canvas highlights and the island and hover card read.
 */
export type RoomSlice = {
  /** The object being pointed at or focused, or null. */
  hot: RoomObjectId | null;
  setHot: (hot: RoomObjectId | null) => void;
  /** The plant has been watered (R.5): its leaf is grown. Saved by lib/secrets.ts. */
  leaf: boolean;
  setLeaf: (leaf: boolean) => void;
  /**
   * FAST, mutated in place by the canvas. `shown` 0–1 (the room is assembled and on screen);
   * `boxes`: per object (roomObjects order) its screen rect in CSS px and depth: x0, y0, x1, y1,
   * depth (smaller = nearer). x0 is NaN when the object isn't shown. `bulb`: the lamp's bulb on
   * screen (x, y; NaN without a lamp), where the theme reveal starts (R.5).
   */
  view: { shown: number; boxes: Float32Array; bulb: Float32Array };
};

/**
 * Terminal control of the canvas (6.5, `particles`). The canvas (RouteMorph) reads it; the DOM
 * never imports canvas/. `shape` is a shape registry id ("about", "name", "scatter" …) shown
 * instead of the page's own while the visitor stays on `path`; any other page ignores it.
 * `explodes` counts `particles --explode`: each new value is one burst + scatter, then back.
 */
export type ParticlesSlice = {
  shape: string | null;
  path: string | null;
  explodes: number;
  /** null = back to the page's own shape (`particles --reset`). */
  setShape: (shape: string | null, path?: string | null) => void;
  explode: () => void;
};

export type StoreState = {
  audio: AudioSlice;
  scroll: ScrollSlice;
  page: PageSlice;
  room: RoomSlice;
  ar: ArSlice;
  ui: UiSlice;
  theme: ThemeSlice;
  particles: ParticlesSlice;
};

// --- Store ---------------------------------------------------------------------------------

export const useStore = create<StoreState>()(
  subscribeWithSelector((set, get) => {
    /** Shallow-merge `partial` into one slice, keeping the other slices untouched. */
    function patch<K extends keyof StoreState>(
      key: K,
      partial: Partial<StoreState[K]>,
    ): void {
      set((state) => {
        const next = { ...state };
        next[key] = { ...state[key], ...partial };
        return next;
      });
    }

    return {
      audio: {
        enabled: false,
        playing: false,
        trackIndex: 0,
        volume: 0.8,
        levels: { bass: 0, mid: 0, high: 0 },
        beat: false,
        setEnabled: (enabled) => patch("audio", { enabled }),
        setPlaying: (playing) => patch("audio", { playing }),
        togglePlaying: () => patch("audio", { playing: !get().audio.playing }),
        setTrackIndex: (trackIndex) =>
          patch("audio", { trackIndex: Math.max(0, trackIndex) }),
        setVolume: (volume) => patch("audio", { volume: clamp01(volume) }),
        setLevels: (levels, beat) => patch("audio", { levels, beat }),
      },

      scroll: {
        progress: 0,
        setProgress: (progress) =>
          patch("scroll", { progress: clamp01(progress) }),
      },

      page: {
        id: null,
        set: (id) => {
          if (get().page.id !== id) patch("page", { id });
        },
      },

      room: {
        hot: null,
        setHot: (hot) => {
          if (get().room.hot !== hot) patch("room", { hot });
        },
        leaf: false,
        setLeaf: (leaf) => {
          if (get().room.leaf !== leaf) patch("room", { leaf });
        },
        view: {
          shown: 0,
          boxes: new Float32Array(ROOM_OBJECT_COUNT * 5).fill(NaN),
          bulb: new Float32Array(2).fill(NaN),
        },
      },

      ar: {
        enabled: false,
        status: "off",
        explainerOpen: false,
        camera: "unknown",
        hand: {
          x: 0.5,
          y: 0.5,
          visible: false,
          palm: 0,
          holdKind: null,
          holdTarget: null,
          dwell: 0,
          scrolling: false,
          clicks: 0,
        },
        setEnabled: (enabled) => patch("ar", { enabled }),
        toggle: () => patch("ar", { enabled: !get().ar.enabled }),
        setStatus: (status) => patch("ar", { status }),
        setHand: (hand) => patch("ar", { hand }),
        setExplainerOpen: (explainerOpen) => {
          if (get().ar.explainerOpen !== explainerOpen)
            patch("ar", { explainerOpen });
        },
        setCamera: (camera) => {
          if (get().ar.camera !== camera) patch("ar", { camera });
        },
      },

      ui: {
        entered: false,
        soundEnabled: false,
        terminalOpen: false,
        chatOpen: false,
        chatStreaming: false,
        shortcutsOpen: false,
        menuOpen: false,
        queueOpen: false,
        contactSheetOpen: false,
        intro: "pending",
        setIntro: (intro) => {
          if (get().ui.intro !== intro) patch("ui", { intro });
        },
        setEntered: (entered) => patch("ui", { entered }),
        setSoundEnabled: (soundEnabled) => {
          patch("ui", { soundEnabled });
          storage.set(SOUND_STORAGE_KEY, soundEnabled ? "1" : "0");
        },
        toggleSound: () => get().ui.setSoundEnabled(!get().ui.soundEnabled),
        setTerminalOpen: (terminalOpen) => patch("ui", { terminalOpen }),
        toggleTerminal: () =>
          patch("ui", { terminalOpen: !get().ui.terminalOpen }),
        setChatOpen: (chatOpen) => patch("ui", { chatOpen }),
        toggleChat: () => patch("ui", { chatOpen: !get().ui.chatOpen }),
        setChatStreaming: (chatStreaming) => patch("ui", { chatStreaming }),
        setShortcutsOpen: (shortcutsOpen) => patch("ui", { shortcutsOpen }),
        toggleShortcuts: () =>
          patch("ui", { shortcutsOpen: !get().ui.shortcutsOpen }),
        setMenuOpen: (menuOpen) => patch("ui", { menuOpen }),
        setQueueOpen: (queueOpen) => patch("ui", { queueOpen }),
        setContactSheetOpen: (contactSheetOpen) =>
          patch("ui", { contactSheetOpen }),
      },

      particles: {
        shape: null,
        path: null,
        explodes: 0,
        setShape: (shape, path = null) =>
          patch("particles", { shape, path: shape ? path : null }),
        explode: () =>
          patch("particles", { explodes: get().particles.explodes + 1 }),
      },

      theme: {
        mode: "dark",
        setMode: (mode) => {
          setTheme(mode);
          patch("theme", { mode });
        },
        toggleMode: () =>
          get().theme.setMode(get().theme.mode === "dark" ? "light" : "dark"),
      },
    };
  }),
);

/**
 * Load the persisted values into the store. Call once on the client after hydration
 * (components/providers/StoreHydrator.tsx does). The theme comes from <html data-theme>,
 * which ThemeScript already set from storage or the OS preference.
 */
export function hydratePersisted(): void {
  const { ui, theme } = useStore.getState();
  useStore.setState({
    ui: { ...ui, soundEnabled: storage.get(SOUND_STORAGE_KEY) === "1" },
    theme: { ...theme, mode: getTheme() },
  });
}
