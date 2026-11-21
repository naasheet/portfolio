import { chapters, fallbackShape, type ShapeSpec } from "@/content/chapters";
import { profile } from "@/content/profile";
import { SCATTER_BOX, type ShapePoints } from "./constants";
import { fetchModel, fromModel } from "./fromModel";
import { fromScene } from "./fromScene";
import { fromText, loadTextFont } from "./fromText";
import { grid, ring, scatter, sphere } from "./math";
import { normalize } from "./normalize";
import { mulberry32, seedFrom } from "./random";
import { buildRoom, roomNodeCounts, type Room } from "./room";

/*
 * Every particle shape, computed once and cached (CLAUDE.md §9.2). The canvas mounts while the
 * entry gate is up, starts loadShapes(), and each shape is computed in its own idle callback,
 * so nothing blocks the first paint. Network waits (models, the Display font) happen outside the
 * timed part; the dev console logs the compute time of each shape and the total.
 */

type Entry = { id: string; spec: ShapeSpec };

/**
 * Page shapes in nav order, then the fallback, then the name (Home's shape before R.3; kept for
 * the arrival sequence) and grid (not mapped; dev cycling). The room makes two cache entries:
 * "home" (desktop) and "home-phone" (under 768 px).
 */
export const SHAPE_ENTRIES: readonly Entry[] = [
  { id: "scatter", spec: fallbackShape },
  ...chapters.map((c) => ({ id: c.id, spec: c.shape })),
  { id: "name", spec: { kind: "text", text: profile.name } },
  { id: "grid", spec: { kind: "grid" } },
];

/** The phone layout's cache id for a room page. */
export const PHONE_SUFFIX = "-phone";

let room: Room | null = null;
/** The room's longest single task (ms), for the dev log: no task may pass 50 ms (§6). */
let roomMaxTask = 0;

/** The room's per-particle records and layouts, once computed (R.3). */
export function getRoom(): Room | null {
  return room;
}

/** The name on a phone: the shape box is 4 wide, a 390 px view ~1.8 at z = 0. */
const PHONE_NAME_SCALE = 0.32;
/** The intro's burst: the name grows by this much, plus a little noise (shape units). */
const BURST_SCALE = 1.12;
const BURST_NOISE = 0.06;

type IntroShapes = { name: ShapePoints; burst: ShapePoints };
const introCache = new Map<string, IntroShapes>();

/**
 * Home's intro (R.6) for one room layout: the name, with particle i given the name point whose
 * left-to-right rank matches its room point's (letters on the left fly to the objects on the
 * left, so paths stay short), and the same name burst outward. Null until the name and the room
 * exist. Computed once per layout (two 60k sorts, ~10 ms; loadShapes warms both in idle time).
 */
export function getIntroShapes(layout: "desktop" | "phone"): IntroShapes | null {
  const hit = introCache.get(layout);
  if (hit) return hit;
  const nameShape = cache.get("name");
  if (!nameShape || !room) return null;
  const target = layout === "phone" ? room.phone : room.desktop;
  const scale = layout === "phone" ? PHONE_NAME_SCALE : 1;
  const n = target.length / 3;
  const byRoom = Uint32Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => target[a * 3]! - target[b * 3]!,
  );
  const byName = Uint32Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => nameShape[a * 3]! - nameShape[b * 3]!,
  );
  const name = new Float32Array(n * 3);
  const burst = new Float32Array(n * 3);
  const rand = mulberry32(seedFrom(`intro-${layout}`));
  for (let k = 0; k < n; k++) {
    const from = byName[k]! * 3;
    const to = byRoom[k]! * 3;
    for (let d = 0; d < 3; d++) {
      const v = nameShape[from + d]! * scale;
      name[to + d] = v;
      burst[to + d] = v * BURST_SCALE + (rand() * 2 - 1) * BURST_NOISE * scale;
    }
  }
  const shapes = { name, burst };
  introCache.set(layout, shapes);
  return shapes;
}

export const SHAPE_IDS = SHAPE_ENTRIES.map((e) => e.id);

const cache = new Map<string, ShapePoints>();
let loading: Promise<void> | null = null;

/** The shape if it's ready, else undefined. */
export function getShape(id: string): ShapePoints | undefined {
  return cache.get(id);
}

/** Maths shapes are cheap (a few ms); compute synchronously. */
function computeMath(id: string, spec: ShapeSpec): ShapePoints | null {
  const rand = mulberry32(seedFrom(id));
  switch (spec.kind) {
    case "sphere":
      return normalize(sphere(rand), rand);
    case "grid":
      return normalize(grid(rand), rand);
    case "ring":
      return normalize(ring(rand), rand);
    case "scatter":
      return normalize(scatter(rand), rand, SCATTER_BOX);
    default:
      return null;
  }
}

/** The idle scatter, synchronously (the canvas starts from it before anything else is ready). */
export function scatterShape(): ShapePoints {
  const hit = cache.get("scatter");
  if (hit) return hit;
  const shape = computeMath("scatter", fallbackShape)!;
  cache.set("scatter", shape);
  return shape;
}

const idle = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => resolve(), { timeout: 500 });
    } else {
      setTimeout(resolve, 16); // Safari
    }
  });

async function compute(
  entry: Entry,
): Promise<{ shape: ShapePoints; ms: number }> {
  const { id, spec } = entry;
  const rand = mulberry32(seedFrom(id));
  if (spec.kind === "text") {
    await loadTextFont(spec.text);
    await idle();
    const t0 = performance.now();
    const shape = normalize(fromText(spec.text, rand), rand);
    return { shape, ms: performance.now() - t0 };
  }
  if (spec.kind === "room") {
    const buffer = await fetchModel(spec.url);
    // fromScene waits for an idle callback before each node: time only the work.
    let ms = 0;
    let t0 = performance.now();
    const pause = async () => {
      const seg = performance.now() - t0;
      ms += seg;
      roomMaxTask = Math.max(roomMaxTask, seg);
      await idle();
      t0 = performance.now();
    };
    const nodes = await fromScene(buffer, roomNodeCounts(), rand, pause);
    await pause();
    room = buildRoom(nodes, rand);
    cache.set(id + PHONE_SUFFIX, room.phone);
    const last = performance.now() - t0;
    ms += last;
    roomMaxTask = Math.max(roomMaxTask, last);
    return { shape: room.desktop, ms };
  }
  if (spec.kind === "model") {
    const buffer = await fetchModel(spec.url);
    await idle();
    const t0 = performance.now();
    const shape = normalize(await fromModel(buffer, rand), rand);
    return { shape, ms: performance.now() - t0 };
  }
  await idle();
  const t0 = performance.now();
  const shape = computeMath(id, spec)!;
  return { shape, ms: performance.now() - t0 };
}

/** Compute every shape once (idempotent). A shape that fails is skipped and logged. */
export function loadShapes(): Promise<void> {
  loading ??= (async () => {
    const started = performance.now();
    const times: string[] = [];
    let total = 0;
    for (const entry of SHAPE_ENTRIES) {
      if (cache.has(entry.id)) continue;
      try {
        const { shape, ms } = await compute(entry);
        cache.set(entry.id, shape);
        total += ms;
        times.push(`${entry.id} ${ms.toFixed(1)}`);
      } catch (error) {
        console.error(`[shapes] ${entry.id} failed`, error);
      }
    }
    // R.6: pair the name with both room layouts now, so the intro starts without a long task.
    for (const layout of ["desktop", "phone"] as const) {
      await idle();
      getIntroShapes(layout);
    }
    if (process.env.NODE_ENV === "development") {
      const line =
        `${cache.size} shapes, compute ${total.toFixed(1)} ms (${times.join(", ")}; room's ` +
        `longest task ${roomMaxTask.toFixed(1)}), ` +
        `${(performance.now() - started).toFixed(0)} ms wall`;
      console.info(`[shapes] ${line}`);
      // Also on <html>, for headless checks (their console capture skips info).
      document.documentElement.dataset.shapes = line;
    }
  })();
  return loading;
}
