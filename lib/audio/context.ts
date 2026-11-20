/*
 * The one AudioContext for the whole site (UI sounds now, the music engine in 5.1).
 * Browsers only allow audio after a user gesture, so ensureAudioContext() must be called
 * inside a click / key handler (the entry gate, 2.1). Nothing is created before that.
 */

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;

/** The shared context, or null if sound was never enabled. */
export function getAudioContext(): AudioContext | null {
  return context;
}

/** Create the context (or resume it). Call only from a user gesture. */
export function ensureAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor =
      window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}
