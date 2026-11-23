/*
 * The main thread's half of hand tracking (8.2). startTracker(stream) plays the camera in its own
 * detached <video> and, on the shared gsap ticker (one clock, CLAUDE.md §5.4), sends
 * features/ar/hand.worker.ts a frame at most 30 times a second: only when the video has data and
 * the previous frame's answer is back. Each frame is an ImageBitmap, transferred (no copy). The
 * answers go into `landmarks` (no React, no store); the measured rate into `landmarks.fps`.
 *
 * 8.5:
 *   hidden tab   no frames are sent, and the rate isn't judged (a hidden window resets it).
 *   slow         under 15 fps for 3 s: the camera drops to 320 × 240 (applyConstraints, no new
 *                prompt); still under 15 fps for another 3 s: onSlow, once (ARLayer suggests
 *                turning Hand off).
 *   warm worker  the worker (and the model in it) outlives a session: Hand off starts a 30 s
 *                timer, Hand on again within it reuses the loaded model; after it the worker is
 *                terminated and the model released. A worker that failed is dropped at once.
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
/** Detection below this rate for SLOW_HOLD_S counts as slow (8.5). */
export const SLOW_FPS = 15;
export const SLOW_HOLD_S = 3;
/** The camera's fallback size when detection is slow. */
export const LOW_RES = { width: 320, height: 240 } as const;
/** After Hand mode is off this long, the worker and its model are released. */
export const WORKER_IDLE_MS = 30_000;

export type TrackerHandlers = {
  /** The model is loaded and detecting ("GPU" or "CPU"). */
  onReady?: (delegate: "GPU" | "CPU") => void;
  /** The worker couldn't start or detection failed; the tracker has already stopped. */
  onError: (message: string) => void;
  /** 8.5: still slow after dropping to 320 × 240 (called once per session). */
  onSlow?: () => void;
};

/** Messages from the worker, handled the same in the app and in tests. */
export function createResultHandler(
  handlers: TrackerHandlers,
  stop: () => void,
  now: () => number = () => performance.now(),
  onRate?: (fps: number) => void,
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
      writeLandmarks(message.points, message.hand ?? null);
      count++;
      const t = now();
      if (t - windowStart >= 1000) {
        landmarks.fps = (count * 1000) / (t - windowStart);
        count = 0;
        windowStart = t;
        onRate?.(landmarks.fps);
      }
      return true;
    },
    /** Start a fresh rate window (after the tab was hidden). */
    reset() {
      windowStart = now();
      count = 0;
    },
  };
}

/**
 * Slow detection (8.5): true once the rate has stayed under SLOW_FPS for SLOW_HOLD_S. Fed once a
 * second with the measured rate; any good second starts it over.
 */
export function createSlowMonitor(threshold = SLOW_FPS, holdS = SLOW_HOLD_S) {
  let since: number | null = null;
  return {
    update(fps: number, nowS: number): boolean {
      if (fps >= threshold) {
        since = null;
        return false;
      }
      since ??= nowS;
      if (nowS - since >= holdS) {
        since = null;
        return true;
      }
      return false;
    },
    reset() {
      since = null;
    },
  };
}

// --- The warm worker (8.5) ---------------------------------------------------------------------

type Listener = (message: FromWorker) => void;

type WarmWorker = {
  worker: Worker;
  /** The model is loaded; `delegate` says where. */
  ready: boolean;
  delegate: "GPU" | "CPU";
  /** The session receiving messages, or null between sessions. */
  listener: Listener | null;
  /** A frame is with the worker (possibly sent by a session that has since ended). */
  inFlight: boolean;
  idle: ReturnType<typeof setTimeout> | null;
};

let warm: WarmWorker | null = null;

/** The live worker, kept warm across sessions; a new one if there's none. */
export function acquireWorker(
  create: () => Worker = () =>
    new Worker(new URL("./hand.worker.ts", import.meta.url), {
      type: "module",
    }),
): WarmWorker {
  if (warm) {
    if (warm.idle) clearTimeout(warm.idle);
    warm.idle = null;
    return warm;
  }
  const w: WarmWorker = {
    worker: create(),
    ready: false,
    delegate: "GPU",
    listener: null,
    inFlight: false,
    idle: null,
  };
  w.worker.addEventListener("message", (event: MessageEvent<FromWorker>) => {
    const message = event.data;
    if (message.type === "ready") {
      w.ready = true;
      w.delegate = message.delegate;
    }
    if (message.type === "result") w.inFlight = false;
    w.listener?.(message);
  });
  w.worker.addEventListener("error", (event) => {
    event.preventDefault();
    // Broken between sessions: drop it, so the next Hand on starts a fresh one.
    if (!w.listener) {
      releaseWorker(w, true);
      return;
    }
    w.listener({
      type: "error",
      message: event.message || "Hand tracker failed to load",
    });
  });
  warm = w;
  return w;
}

/** The session is over: keep the worker for WORKER_IDLE_MS, or drop it now (`broken`). */
export function releaseWorker(w: WarmWorker, broken = false): void {
  w.listener = null;
  if (warm !== w) return;
  if (broken) {
    w.worker.terminate();
    warm = null;
    return;
  }
  if (w.idle) clearTimeout(w.idle);
  w.idle = setTimeout(() => {
    w.worker.terminate();
    if (warm === w) warm = null;
  }, WORKER_IDLE_MS);
}

/** For tests and /dev: whether a worker is alive. */
export const hasWarmWorker = () => warm !== null;

// --- Session -----------------------------------------------------------------------------------

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
  let broken = false;
  let ready = false;
  /** This session's frame is out (being captured, or with the worker). */
  let busy = false;
  let lastSent = -Infinity;

  // Slow detection: 0 = full size, 1 = dropped to 320 × 240, 2 = reported.
  let stage = 0;
  const slow = createSlowMonitor();
  const onRate = (fps: number) => {
    if (document.hidden || stage > 1) return;
    if (!slow.update(fps, performance.now() / 1000)) return;
    if (stage === 0) {
      stage = 1;
      const track = stream.getVideoTracks()[0];
      void track
        ?.applyConstraints({
          width: { ideal: LOW_RES.width },
          height: { ideal: LOW_RES.height },
        })
        .catch(() => {});
    } else {
      stage = 2;
      handlers.onSlow?.();
    }
  };

  landmarks.phase = "loading";
  const w = acquireWorker();

  const stop = () => {
    if (stopped) return;
    stopped = true;
    gsap.ticker.remove(tick);
    document.removeEventListener("visibilitychange", onVisibility);
    releaseWorker(w, broken);
    video.pause();
    video.srcObject = null;
    landmarks.phase = "off";
    landmarks.delegate = null;
    landmarks.fps = 0;
    landmarks.frameWidth = 0;
    landmarks.frameHeight = 0;
    writeLandmarks(null);
  };

  const results = createResultHandler(
    {
      ...handlers,
      onError: (message) => {
        broken = true;
        handlers.onError(message);
      },
    },
    () => {
      broken = true;
      stop();
    },
    undefined,
    onRate,
  );

  w.listener = (message) => {
    if (stopped) return;
    if (message.type === "ready") ready = true;
    // A result for a frame this session didn't send (the previous session's) is dropped.
    if (message.type === "result" && !busy) return;
    if (results.handle(message)) busy = false;
  };
  // A warm worker already has its model: this session is ready at once.
  if (w.ready) {
    queueMicrotask(() => w.listener?.({ type: "ready", delegate: w.delegate }));
  }

  // A hidden tab sends nothing; coming back starts a fresh rate window.
  const onVisibility = () => {
    if (!document.hidden) {
      results.reset();
      slow.reset();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  function tick() {
    if (stopped || !ready || busy || w.inFlight || document.hidden) return;
    const now = performance.now();
    if (now - lastSent < MIN_GAP_MS) return;
    // HAVE_CURRENT_DATA, and a real size (a just-started camera reports 0 × 0).
    if (video.readyState < 2 || video.videoWidth === 0) return;
    busy = true;
    lastSent = now;
    landmarks.aspect = video.videoWidth / video.videoHeight;
    landmarks.frameWidth = video.videoWidth;
    landmarks.frameHeight = video.videoHeight;
    createImageBitmap(video).then(
      (bitmap) => {
        if (stopped) {
          bitmap.close();
          return;
        }
        const message: ToWorker = { type: "frame", bitmap, ts: now };
        w.inFlight = true;
        w.worker.postMessage(message, [bitmap]);
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
