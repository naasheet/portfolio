/*
 * Home's intro (R.6): after the gate, the name forms in particles, holds, bursts and assembles
 * into the room; as it settles the screen code types in, the lamp flickers on, and the intro
 * text, tags and hints fade in (300 ms, opacity only).
 *
 * The gate calls startIntro() when its exit **starts** (or at once when it's skipped), so the
 * name forms under the gate's wipe and the room settles within ~3.5 s of the counter's 100%.
 * The canvas (canvas/RouteMorph.tsx) runs the particle steps while ui.intro is "play" and calls
 * finishIntro() as the room settles. html[data-intro] (set to "pending" before paint by the head
 * script on page loads that land on `/`) drives the CSS fade of [data-intro-fade].
 *
 * Skipped (straight to "done"): not on Home, reduced motion, no WebGL or Save-Data. A safety
 * timer finishes it anyway, so the text can never stay hidden.
 */
import { canvasEnabled } from "../quality";
import { useStore } from "../store";

/** If the canvas never gets to finish it (no shapes, a lost context), show the page anyway. */
const SAFETY_MS = 5000;

let safety: ReturnType<typeof setTimeout> | undefined;

export function finishIntro(): void {
  clearTimeout(safety);
  useStore.getState().ui.setIntro("done");
  if (typeof document !== "undefined") document.documentElement.dataset.intro = "done";
}

export function startIntro(): void {
  if (useStore.getState().ui.intro !== "pending") return;
  const skip =
    window.location.pathname !== "/" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !canvasEnabled();
  if (skip) {
    finishIntro();
    return;
  }
  useStore.getState().ui.setIntro("play");
  document.documentElement.dataset.intro = "play";
  safety = setTimeout(finishIntro, SAFETY_MS);
}
