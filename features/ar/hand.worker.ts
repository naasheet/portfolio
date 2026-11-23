/*
 * Hand detection off the main thread (8.2). A module worker, started by features/ar/tracker.ts
 * when Hand mode's camera is live. Google's guide suggests running detection in a worker, so the
 * page keeps its frame rate.
 *
 * It loads MediaPipe's HandLandmarker from this site (/mediapipe/wasm, copied from node_modules
 * by scripts/copy-mediapipe-wasm.ts; /mediapipe/hand_landmarker.task): one hand, VIDEO mode,
 * detection confidence 0.6, tracking 0.5, the GPU delegate with a CPU fallback. For each frame
 * (an ImageBitmap, transferred) it runs detectForVideo, closes the bitmap and posts back only the
 * nine tracked points (landmarks.ts TRACKED) as a transferred Float32Array, or null when no hand
 * is in view. Video never leaves the device (CLAUDE.md §9.6).
 */
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { TRACKED } from "./landmarks";

/** Main thread → worker. */
export type ToWorker = { type: "frame"; bitmap: ImageBitmap; ts: number };

/** Worker → main thread. */
export type FromWorker =
  | { type: "ready"; delegate: "GPU" | "CPU" }
  | { type: "result"; points: Float32Array | null }
  | { type: "error"; message: string };

const origin = self.location.origin;
const WASM_PATH = `${origin}/mediapipe/wasm`;
const MODEL_PATH = `${origin}/mediapipe/hand_landmarker.task`;

/*
 * Which glue to load. Turbopack starts `new Worker(…, { type: "module" })` through its own
 * classic bootstrap, so this code may run in a classic worker (importScripts works, and the ES
 * module glue would fail there) or a module worker (importScripts throws a TypeError). A call
 * with no URLs tells them apart without loading anything.
 */
const isClassicWorker = (() => {
  try {
    (self as unknown as { importScripts: () => void }).importScripts();
    return true;
  } catch {
    return false;
  }
})();

/*
 * In a module worker MediaPipe's importScripts fails and it falls back to `self.import(url)` if
 * that exists. Ours imports the ES-module glue at run time (the bundler must leave the URL alone)
 * and sets ModuleFactory from its default export every time: a second import of the same URL
 * (the CPU fallback) doesn't re-run the module, so the global it sets on first run would be
 * missing.
 */
type GlueModule = { default?: unknown };
(self as unknown as { import: (url: string) => Promise<void> }).import = async (
  url: string,
) => {
  const glue = (await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ url
  )) as GlueModule;
  (self as unknown as { ModuleFactory?: unknown }).ModuleFactory = glue.default;
};

const post = (message: FromWorker, transfer: Transferable[] = []) =>
  self.postMessage(message, { transfer });

let landmarker: HandLandmarker | null = null;
let delegate: "GPU" | "CPU" = "GPU";
let lastTs = -1;
/** Whether a frame has gone through; a GPU failure before that retries on the CPU. */
let detected = false;

async function create(
  model: Uint8Array,
  use: "GPU" | "CPU",
): Promise<HandLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(
    WASM_PATH,
    !isClassicWorker,
  );
  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetBuffer: model, delegate: use },
    runningMode: "VIDEO",
    numHands: 1,
    minHandDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5,
  });
}

let model: Uint8Array | null = null;

async function init(): Promise<void> {
  const response = await fetch(MODEL_PATH);
  if (!response.ok) throw new Error(`Model: HTTP ${response.status}`);
  model = new Uint8Array(await response.arrayBuffer());
  try {
    landmarker = await create(model, "GPU");
    delegate = "GPU";
  } catch {
    landmarker = await create(model, "CPU");
    delegate = "CPU";
  }
  post({ type: "ready", delegate });
}

async function fallBackToCpu(): Promise<void> {
  landmarker?.close();
  landmarker = null;
  landmarker = await create(model!, "CPU");
  delegate = "CPU";
}

function pack(
  hand: readonly { x: number; y: number }[] | undefined,
): Float32Array | null {
  if (!hand) return null;
  const out = new Float32Array(TRACKED.length * 2);
  for (let i = 0; i < TRACKED.length; i++) {
    const p = hand[TRACKED[i]!];
    if (!p) return null;
    out[i * 2] = p.x;
    out[i * 2 + 1] = p.y;
  }
  return out;
}

const fail = (error: unknown) =>
  post({
    type: "error",
    message: error instanceof Error ? error.message : String(error),
  });

let busy = false;

self.addEventListener("message", (event: MessageEvent<ToWorker>) => {
  const data = event.data;
  if (data.type !== "frame") return;
  const { bitmap } = data;
  if (!landmarker || busy) {
    bitmap.close();
    // The tracker waits for an answer before sending again: always give one.
    post({ type: "result", points: null });
    return;
  }
  // detectForVideo needs strictly increasing timestamps.
  const ts = data.ts > lastTs ? data.ts : lastTs + 1;
  lastTs = ts;
  try {
    const result = landmarker.detectForVideo(bitmap, ts);
    detected = true;
    const points = pack(result.landmarks[0]);
    post({ type: "result", points }, points ? [points.buffer] : []);
  } catch (error) {
    if (delegate === "GPU" && !detected && model) {
      busy = true;
      fallBackToCpu().then(() => {
        busy = false;
        post({ type: "result", points: null });
      }, fail);
    } else {
      fail(error);
    }
  } finally {
    bitmap.close();
  }
});

init().catch(fail);
