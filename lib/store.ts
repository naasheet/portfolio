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
  /** Index of the homepage chapter in view. */
  chapter: number;
  /** FAST. 0–1 progress through the current chapter. */
  progress: number;
  setChapter: (chapter: number) => void;
  setProgress: (progress: number) => void;
};

export type ArStatus = "off" | "loading" | "ready" | "denied" | "error";

/** Fingertip position in viewport space, each axis 0–1 (0,0 = top left). */
export type Hand = { x: number; y: number; visible: boolean };

export type ArSlice = {
  enabled: boolean;
  status: ArStatus;
  /** FAST. */
  hand: Hand;
  pinching: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  setStatus: (status: ArStatus) => void;
  setHand: (hand: Hand) => void;
  setPinching: (pinching: boolean) => void;
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
};

export type ThemeSlice = {
  mode: Theme;
  /** Applies the theme to <html> and saves it. */
  setMode: (mode: Theme) => void;
  toggleMode: () => void;
};

export type StoreState = {
  audio: AudioSlice;
  scroll: ScrollSlice;
  ar: ArSlice;
  ui: UiSlice;
  theme: ThemeSlice;
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
        chapter: 0,
        progress: 0,
        setChapter: (chapter) => patch("scroll", { chapter }),
        setProgress: (progress) =>
          patch("scroll", { progress: clamp01(progress) }),
      },

      ar: {
        enabled: false,
        status: "off",
        hand: { x: 0.5, y: 0.5, visible: false },
        pinching: false,
        setEnabled: (enabled) => patch("ar", { enabled }),
        toggle: () => patch("ar", { enabled: !get().ar.enabled }),
        setStatus: (status) => patch("ar", { status }),
        setHand: (hand) => patch("ar", { hand }),
        setPinching: (pinching) => patch("ar", { pinching }),
      },

      ui: {
        entered: false,
        soundEnabled: false,
        terminalOpen: false,
        chatOpen: false,
        chatStreaming: false,
        shortcutsOpen: false,
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
