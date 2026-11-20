/*
 * UI sounds. A tiny stub that every control imports; the engine (lib/audio/sfxEngine.ts) and
 * the sound files load only after the visitor turns sound on, so silent visitors download
 * nothing and first-load JS stays small.
 *
 *   initSfx()     call from the click that enables sound (the entry gate, 2.1)
 *   sfx("hover")  play a sound; does nothing unless ui.soundEnabled is true and init has run
 */
import { useStore } from "@/lib/store";
import { ensureAudioContext } from "./audio/context";

export type SfxName = "hover" | "click" | "toggleOn" | "toggleOff";

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
