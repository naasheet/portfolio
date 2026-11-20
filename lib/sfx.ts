/*
 * UI sounds. A tiny stub that every control imports; the engine (lib/audio/sfxEngine.ts) and
 * the sound files load only after the visitor turns sound on, so silent visitors download
 * nothing and first-load JS stays small.
 *
 *   initSfx()          call from the click that enables sound (the entry gate, 2.1)
 *   sfx("hover")       play a sound; does nothing unless ui.soundEnabled is true and init has run
 *   onTypingSound(e)   opt-in keydown handler for text fields: a soft key tick per keystroke
 */
import { useStore } from "@/lib/store";
import { ensureAudioContext } from "./audio/context";

export type SfxName = "hover" | "click" | "toggleOn" | "toggleOff" | "type";

type Engine = typeof import("./audio/sfxEngine");
let engine: Engine | null = null;

/**
 * Create the AudioContext (synchronously, inside the user's gesture), then load the engine and
 * decode every sound once. Call it from the click that turns sound on.
 */
export async function initSfx(): Promise<void> {
  if (!ensureAudioContext()) return;
  engine ??= await import("./audio/sfxEngine");
  await engine.load();
}

/** Play a UI sound. Silent mode (ui.soundEnabled false) makes no sound and loads nothing. */
export function sfx(name: SfxName): void {
  if (!engine || !useStore.getState().ui.soundEnabled) return;
  engine.play(name);
}

/** The parts of a keydown event the typing sound looks at (React or DOM events both fit). */
type KeyLike = {
  key: string;
  repeat: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  nativeEvent?: { isComposing?: boolean };
  isComposing?: boolean;
};

/**
 * Typing sound, opt-in per field: `<input onKeyDown={onTypingSound} />` (or call it from your
 * own handler). Plays for characters, Space, Backspace, Delete and Enter. Skips held-down
 * repeats, shortcuts (Ctrl / Cmd / Alt), lone modifier keys and IME composition. Each tick is
 * one of five sounds at random with ±3% pitch, throttled to one per 30 ms.
 */
export function onTypingSound(e: KeyLike): void {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.isComposing || e.nativeEvent?.isComposing) return;
  const typed =
    e.key.length === 1 ||
    e.key === "Backspace" ||
    e.key === "Delete" ||
    e.key === "Enter";
  if (typed) sfx("type");
}
