/*
 * Music (5.1): the small, always-loaded side. The engine (lib/audio/engine.ts) and the playlist
 * load only when sound is first turned on, so silent visitors download neither.
 *
 *   startMusic()   call from the gesture that turns sound on (it creates the AudioContext
 *                  synchronously): the first time, track 1 fades in over 2 s; later, it resumes.
 *   getMusic()     the engine, or null before sound was ever on (the player, 5.2; the canvas, 5.4).
 *
 * Turning sound off (ui.soundEnabled false, from any path: M, the nav, the terminal) pauses the
 * music; turning it back on resumes it.
 */
import { ensureAudioContext } from "@/lib/audio/context";
import { useStore } from "@/lib/store";

type EngineModule = typeof import("./audio/engine");
let mod: EngineModule | null = null;
let unsubscribe: (() => void) | null = null;

export async function startMusic(): Promise<void> {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  mod ??= await import("./audio/engine");
  const engine = mod.getEngine(ctx);
  unsubscribe ??= useStore.subscribe(
    (s) => s.ui.soundEnabled,
    (on) => {
      if (!on) engine.pause();
      else if (!engine.isPlaying()) void engine.play();
    },
  );
  if (useStore.getState().ui.soundEnabled && !engine.isPlaying())
    await engine.play();
}

export function getMusic(): ReturnType<EngineModule["getEngine"]> | null {
  return mod?.peekEngine() ?? null;
}
