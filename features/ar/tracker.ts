/*
 * The main thread's half of hand tracking (8.2). startTracker(stream) plays the camera in its own
 * detached <video>, starts features/ar/hand.worker.ts, and on the shared gsap ticker (one clock,
 * CLAUDE.md §5.4) sends it a frame at most 30 times a second: only when the video has data and
 * the previous frame's answer is back. Each frame is an ImageBitmap, transferred (no copy). The
 * answers go into `landmarks` (no React, no store); the measured rate into `landmarks.fps`.
 *
 * components/ar/ARLayer.tsx starts it once the camera is live and stops it with the camera.
 */
import { gsap } from "@/lib/motion/gsap";
import type { FromWorker, ToWorker } from "./hand.worker";
import { landmarks, writeLandmarks } from "./landmarks";

/** At most this many frames a second go to the worker. */
export const MAX_FPS = 30;
/** Ticks come every ~16.7 ms at 60 Hz; a 2 ms slack keeps 30 fps from rounding down to 20. */
const MIN_GAP_MS = 1000 / MAX_FPS - 2;

export type TrackerHandlers = {
  /** The model is loaded and detecting ("GPU" or "CPU"). */
  onReady?: (delegate: "GPU" | "CPU") => void;
  /** The worker couldn't start or detection failed; the tracker has already stopped. */
  onError: (message: string) => void;
};

/** Messages from the worker, handled the same in the app and in tests. */
export function createResultHandler(
  handlers: TrackerHandlers,
  stop: () => void,
  now: () => number = () => performance.now(),
) {
  let windowStart = now();
  let count = 0;
  return {
    /** Returns true when a result arrived (the next frame can go). */
    handle(message: FromWorker): boolean {
      if (message.type === "ready") {
        landmarks.phase = "ready";
        landmarks.delegate = message.delegate;
        handlers.onReady?.(message.delegate);
        return false;
      }
      if (message.type === "error") {
        stop();
        handlers.onError(message.message);
        return false;
      }
      writeLandmarks(message.points);
      count++;
      const t = now();
      if (t - windowStart >= 1000) {
        landmarks.fps = (count * 1000) / (t - windowStart);
        count = 0;
        windowStart = t;
      }
      return true;
    },
  };
}

/** Starts tracking the hand in `stream`; returns stop(). */
export function startTracker(
  stream: MediaStream,
  handlers: TrackerHandlers,
): () => void {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  void video.play().catch(() => {});

  let stopped = false;
  let ready = false;
  /** A frame is out (being captured, or with the worker). */
  let busy = false;
  let lastSent = -Infinity;

  landmarks.phase = "loading";
  const worker = new Worker(new URL("./hand.worker.ts", import.meta.url), {
    type: "module",
  });

  const stop = () => {
    if (stopped) return;
    stopped = true;
    gsap.ticker.remove(tick);
    worker.terminate();
    video.pause();
    video.srcObject = null;
    landmarks.phase = "off";
    landmarks.delegate = null;
    landmarks.fps = 0;
    writeLandmarks(null);
  };

  const results = createResultHandler(handlers, stop);

  worker.addEventListener("message", (event: MessageEvent<FromWorker>) => {
    if (stopped) return;
    if (event.data.type === "ready") ready = true;
    if (results.handle(event.data)) busy = false;
  });
  worker.addEventListener("error", (event) => {
    if (stopped) return;
    event.preventDefault();
    stop();
    handlers.onError(event.message || "Hand tracker failed to load");
  });

  function tick() {
    if (stopped || !ready || busy) return;
    const now = performance.now();
    if (now - lastSent < MIN_GAP_MS) return;
    // HAVE_CURRENT_DATA, and a real size (a just-started camera reports 0 × 0).
    if (video.readyState < 2 || video.videoWidth === 0) return;
    busy = true;
    lastSent = now;
    createImageBitmap(video).then(
      (bitmap) => {
        if (stopped) {
          bitmap.close();
          return;
        }
        const message: ToWorker = { type: "frame", bitmap, ts: now };
        worker.postMessage(message, [bitmap]);
      },
      () => {
        // A frame that couldn't be captured (the camera between frames): try the next tick.
        busy = false;
      },
    );
  }

  gsap.ticker.add(tick);
  return stop;
}
