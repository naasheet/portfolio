import { roomAmbience, roomGeometry, roomObjects } from "@/content/room";
import { screen } from "@/content/screen";
import { MAX_PARTICLES, type Box, type ShapePoints } from "./constants";
import { fitTransform } from "./normalize";

/*
 * The particle room (R.3): Home's shape, built from room.glb's nodes (fromScene) plus what the
 * model doesn't have: the ambience (desk dust, the bright front edge, the lamp's light pool and
 * cone, motes), the code on the laptop screen and the mug's steam.
 *
 * Every point also gets an `aRoom` record (object, kind, tint, extra), fixed per particle index:
 * the shader reads it only while `uRoom` > 0, so other shapes behave as object −1 without any
 * per-morph upload. Both layouts (desktop and phone, under 768 px) are built from the same
 * samples in the same order and shuffled with one permutation, so a particle is the same part
 * of the same object in both, and switching layouts is a plain morph.
 */

/** `aRoom.y`. Must match the kind numbers in particles.vert.glsl. */
export const ROOM_KIND = {
  object: 0,
  screen: 1,
  cursor: 2,
  dust: 3,
  edge: 4,
  pool: 5,
  cone: 6,
  mote: 7,
  steam: 8,
} as const;

/** `aRoom.z`: 0 the shape's own colour mix, 1 teal, 2 amber, 3 grey (screen code, steam). */
const TINT = { none: 0, teal: 1, amber: 2, grey: 3 } as const;

/** World-unit boxes the two layouts are fitted into (the view at z = 0 is ~6.7 × 3.8 at 16:9). */
const DESKTOP_BOX: Box = { x: 5.6, y: 4, z: 4 };
const PHONE_BOX: Box = { x: 1.75, y: 4, z: 4 };

/** What the canvas needs to know about a layout, in fitted (shape) units. */
export type RoomLayout = {
  /** The desk plane's height: reflections flip about it. */
  deskY: number;
  /** Light pool: centre x, y, z and radius (radius 0 on phones: no lamp). */
  pool: [number, number, number, number];
  /** Steam: origin x, y, z and the height the wisps rise. */
  steam: [number, number, number, number];
  /**
   * Each object's box in shape units (R.4 hit areas), 6 floats per object in content/room.ts
   * order: min x, y, z, max x, y, z. NaN for an object the layout doesn't show (the phone lamp).
   */
  boxes: Float32Array;
  /** The lamp's bulb (R.5), shape units; NaN when the layout has no lamp. */
  bulb: [number, number, number];
};

export type Room = {
  desktop: ShapePoints;
  phone: ShapePoints;
  /** aRoom, 4 floats per particle. */
  attr: Float32Array;
  layout: { desktop: RoomLayout; phone: RoomLayout };
};

/** How many particles each node gets from the model (the screen and steam are carved out). */
export function roomNodeCounts(): { node: string; count: number }[] {
  return roomObjects.map((o) => {
    let count = Math.round(o.share * MAX_PARTICLES);
    if (o.node === "work") count -= Math.round(count * roomGeometry.screen.share);
    if (o.node === "mug") count -= Math.round(count * roomGeometry.steam.share);
    return { node: o.node, count };
  });
}

type Vec3 = readonly [number, number, number];

/** Token bars for one line of code: start column, length, tint. */
function tokenBars(line: string): { col: number; len: number; tint: number }[] {
  const keywords = new Set<string>(screen.keywords);
  const bars: { col: number; len: number; tint: number }[] = [];
  const re = /("[^"]*"|'[^']*'|\d+(?:\.\d+)?|[A-Za-z_$][\w$]*|[^\sA-Za-z_$\d"']+)/g;
  for (let m = re.exec(line); m; m = re.exec(line)) {
    const text = m[0];
    // Names teal, strings and numbers amber, keywords and punctuation grey (the Home board's
    // mostly-teal screen).
    const tint = /^["'\d]/.test(text)
      ? TINT.amber
      : /^[A-Za-z_$]/.test(text) && !keywords.has(text)
        ? TINT.teal
        : TINT.grey;
    bars.push({ col: m.index, len: text.length, tint });
  }
  return bars;
}

export function buildRoom(
  nodes: Map<string, Float32Array>,
  rand: () => number,
): Room {
  const n = MAX_PARTICLES;
  const desk = new Float32Array(n * 3); // model space, desktop placement
  const phone = new Float32Array(n * 3);
  const attr = new Float32Array(n * 4);
  let i = 0;

  const put = (
    p: Vec3,
    q: Vec3,
    object: number,
    kind: number,
    tint: number,
    extra: number,
  ) => {
    desk.set(p, i * 3);
    phone.set(q, i * 3);
    attr.set([object, kind, tint, extra], i * 4);
    i++;
  };

  const g = roomGeometry;
  const rnd = (a: number, b: number) => a + rand() * (b - a);
  const phoneDust = (): Vec3 => [
    rnd(g.phoneDesk.x[0], g.phoneDesk.x[1]),
    rnd(0, 0.02),
    rnd(g.phoneDesk.z[0], g.phoneDesk.z[1]),
  ];

  // Phone placement of a node's point: about the node's footprint centre, then moved and scaled.
  const placeOf = (points: Float32Array) => {
    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    for (let k = 0; k < points.length; k += 3) {
      minX = Math.min(minX, points[k]!);
      maxX = Math.max(maxX, points[k]!);
      minZ = Math.min(minZ, points[k + 2]!);
      maxZ = Math.max(maxZ, points[k + 2]!);
    }
    return { cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2 };
  };

  let phoneSteam: Vec3 = [0, 0, 0];
  let phoneScaleSteam = 1;

  roomObjects.forEach((o, index) => {
    const points = nodes.get(o.node);
    if (!points) throw new Error(`room: no samples for ${o.node}`);
    const { cx, cz } = placeOf(points);
    const place = o.phone;
    const toPhone = (p: Vec3): Vec3 =>
      place
        ? [
            place.x + (p[0] - cx) * place.scale,
            p[1] * place.scale,
            place.z + (p[2] - cz) * place.scale,
          ]
        : phoneDust();
    // No lamp on phones: its points become desk dust there (aRoom.w = 1).
    const extra = place ? 0 : 1;
    for (let k = 0; k < points.length; k += 3) {
      const p: Vec3 = [points[k]!, points[k + 1]!, points[k + 2]!];
      put(p, toPhone(p), index, ROOM_KIND.object, TINT.none, extra);
    }

    if (o.node === "work") {
      const total =
        Math.round(o.share * n) - points.length / 3; // the screen's share
      layoutScreen(total, index, toPhone);
    }
    if (o.node === "mug") {
      const total = Math.round(o.share * n) - points.length / 3;
      const s = g.steam;
      for (let k = 0; k < total; k++) {
        // Resting spot along a wisp; the shader animates them while the room is shown.
        const wisp = k % s.wisps;
        const p: Vec3 = [
          s.origin[0] + (wisp - 1) * 0.18 + rnd(-0.04, 0.04),
          s.origin[1] + rand() * s.height,
          s.origin[2] + rnd(-0.04, 0.04),
        ];
        put(p, toPhone(p), index, ROOM_KIND.steam, TINT.grey, wisp);
      }
      phoneSteam = toPhone(s.origin);
      phoneScaleSteam = place?.scale ?? 1;
    }
  });

  function layoutScreen(
    total: number,
    object: number,
    toPhone: (p: Vec3) => Vec3,
  ) {
    const sc = g.screen;
    const lines = screen.lines;
    const cols = Math.max(...lines.map((l) => l.length)) + 4; // + the line-number gutter
    const inset = { u: 0.07, v: 0.1 };
    const lineH = (1 - inset.v * 2) / (lines.length + 0.5);
    const colW = (1 - inset.u * 2) / cols;
    // Bars: [u0, u1, v, tint, kind, line], gutter dots first. `line` (1/n … 1) goes into
    // aRoom.w, so the intro (R.6) can type the code in line by line (uType).
    const bars: [number, number, number, number, number, number][] = [];
    lines.forEach((line, r) => {
      const v = 1 - inset.v - (r + 0.5) * lineH;
      const order = (r + 1) / lines.length;
      bars.push([inset.u, inset.u + colW, v, TINT.grey, ROOM_KIND.screen, order]);
      for (const b of tokenBars(line)) {
        const u0 = inset.u + (b.col + 3) * colW;
        bars.push([u0, u0 + b.len * colW, v, b.tint, ROOM_KIND.screen, order]);
      }
    });
    const lastLine = lines[lines.length - 1] ?? "";
    const cu = inset.u + (lastLine.length + 4) * colW;
    const cursorV = 1 - inset.v - (lines.length - 0.5) * lineH;
    const cursor: [number, number, number, number, number, number] = [
      cu,
      cu + colW * 1.2,
      cursorV,
      TINT.amber,
      ROOM_KIND.cursor,
      1,
    ];
    const cursorCount = Math.round(total * 0.04);
    const textCount = total - cursorCount;
    const length = bars.reduce((s, b) => s + (b[1] - b[0]), 0);
    // Slightly in front of the lid, so the code never sinks into it.
    const nx = 0,
      ny = 0.309,
      nz = 0.951;
    const at = (u: number, v: number): Vec3 => [
      sc.origin[0] + sc.right[0] * u + sc.up[0] * v + nx * 0.02,
      sc.origin[1] + sc.right[1] * u + sc.up[1] * v + ny * 0.02,
      sc.origin[2] + sc.right[2] * u + sc.up[2] * v + nz * 0.02,
    ];
    const barH = lineH * 0.42;
    const emit = (b: (typeof bars)[number]) => {
      const u = rnd(b[0], b[1]);
      const v = b[2] + rnd(-barH, barH) / 2 * (b[4] === ROOM_KIND.cursor ? 2.2 : 1);
      const p = at(u, v);
      put(p, toPhone(p), object, b[4], b[3], b[5]);
    };
    // Points per bar in proportion to its length (cumulative pick).
    for (let k = 0; k < textCount; k++) {
      let pick = rand() * length;
      let b = bars[0]!;
      for (const bar of bars) {
        b = bar;
        pick -= bar[1] - bar[0];
        if (pick <= 0) break;
      }
      emit(b);
    }
    for (let k = 0; k < cursorCount; k++) emit(cursor);
  }

  // Ambience: everything else (the remainder, so the total is exactly MAX_PARTICLES).
  const amb = roomAmbience;
  const shares = [amb.edge, amb.pool, amb.cone, amb.motes].map((s) =>
    Math.round(s * n),
  );
  const [edgeN, poolN, coneN, moteN] = shares as [number, number, number, number];
  const dustN = n - i - edgeN - poolN - coneN - moteN;

  for (let k = 0; k < dustN; k++) {
    const p: Vec3 = [rnd(g.desk.x[0], g.desk.x[1]), rnd(0, 0.02), rnd(g.desk.z[0], g.desk.z[1])];
    put(p, phoneDust(), -1, ROOM_KIND.dust, TINT.none, 0);
  }
  for (let k = 0; k < edgeN; k++) {
    const p: Vec3 = [rnd(g.desk.x[0], g.desk.x[1]), rnd(0, 0.03), g.desk.z[1] + rnd(-0.03, 0.03)];
    const q: Vec3 = [rnd(g.phoneDesk.x[0], g.phoneDesk.x[1]), p[1], g.phoneDesk.z[1] + rnd(-0.03, 0.03)];
    put(p, q, -1, ROOM_KIND.edge, TINT.none, 0);
  }
  const pool = g.pool;
  for (let k = 0; k < poolN; k++) {
    // Dense in the middle, soft at the rim.
    const r = pool.radius * Math.min(1.15, Math.sqrt(-2 * Math.log(1 - rand() * 0.999)) * 0.5);
    const a = rand() * Math.PI * 2;
    const p: Vec3 = [pool.centre[0] + Math.cos(a) * r, rnd(0, 0.02), pool.centre[2] + Math.sin(a) * r * 0.85];
    put(p, phoneDust(), -1, ROOM_KIND.pool, TINT.amber, 1);
  }
  const shade = g.shade;
  for (let k = 0; k < coneN; k++) {
    const t = rand();
    const c = [0, 1, 2].map((d) => shade.centre[d]! + (pool.centre[d]! - shade.centre[d]!) * t);
    const r = (shade.radius + (pool.radius * 0.8 - shade.radius) * t) * Math.sqrt(rand());
    const a = rand() * Math.PI * 2;
    const p: Vec3 = [c[0]! + Math.cos(a) * r, c[1]!, c[2]! + Math.sin(a) * r];
    put(p, phoneDust(), -1, ROOM_KIND.cone, TINT.amber, 1);
  }
  for (let k = 0; k < moteN; k++) {
    const p: Vec3 = [rnd(g.desk.x[0], g.desk.x[1]), rnd(0.3, 2.6), rnd(g.desk.z[0], g.desk.z[1])];
    const q: Vec3 = [rnd(g.phoneDesk.x[0], g.phoneDesk.x[1]), p[1], rnd(g.phoneDesk.z[0], g.phoneDesk.z[1])];
    put(p, q, -1, ROOM_KIND.mote, TINT.none, 0);
  }

  // Fit each layout into its box; carry the layout's reference points through the same fit.
  const fit = (points: Float32Array, box: Box) => {
    const t = fitTransform(points, box);
    for (let k = 0; k < points.length; k += 3) {
      points[k] = (points[k]! - t.cx) * t.scale;
      points[k + 1] = (points[k + 1]! - t.cy) * t.scale;
      points[k + 2] = (points[k + 2]! - t.cz) * t.scale;
    }
    return (p: Vec3): [number, number, number] => [
      (p[0] - t.cx) * t.scale,
      (p[1] - t.cy) * t.scale,
      (p[2] - t.cz) * t.scale,
    ];
    // (scale is exposed through the mapped points' differences)
  };
  const deskMap = fit(desk, DESKTOP_BOX);
  const phoneMap = fit(phone, PHONE_BOX);

  // Per-object boxes (objects, screen code and cursor; not the steam, which moves).
  const boxesOf = (points: Float32Array, hidden: (object: number) => boolean) => {
    const count = roomObjects.length;
    const b = new Float32Array(count * 6);
    for (let o = 0; o < count; o++) {
      b.set([Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity], o * 6);
    }
    for (let k = 0; k < n; k++) {
      const o = attr[k * 4]!;
      const kind = attr[k * 4 + 1]!;
      if (o < 0 || kind > ROOM_KIND.cursor) continue;
      for (let d = 0; d < 3; d++) {
        const v = points[k * 3 + d]!;
        if (v < b[o * 6 + d]!) b[o * 6 + d] = v;
        if (v > b[o * 6 + 3 + d]!) b[o * 6 + 3 + d] = v;
      }
    }
    for (let o = 0; o < count; o++) if (hidden(o)) b.fill(NaN, o * 6, o * 6 + 6);
    return b;
  };
  const deskBoxes = boxesOf(desk, () => false);
  const phoneBoxes = boxesOf(phone, (o) => roomObjects[o]?.phone === null);
  const scaleOf = (map: (p: Vec3) => [number, number, number]) =>
    map([1, 0, 0])[0] - map([0, 0, 0])[0];

  const ds = scaleOf(deskMap);
  const ps = scaleOf(phoneMap);
  const dPool = deskMap(pool.centre);
  const dSteam = deskMap(g.steam.origin);
  const pSteam = phoneMap(phoneSteam);
  const layout = {
    desktop: {
      deskY: deskMap([0, 0, 0])[1],
      pool: [dPool[0], dPool[1], dPool[2], pool.radius * ds] as RoomLayout["pool"],
      steam: [dSteam[0], dSteam[1], dSteam[2], g.steam.height * ds] as RoomLayout["steam"],
      boxes: deskBoxes,
      bulb: deskMap(g.bulb),
    },
    phone: {
      deskY: phoneMap([0, 0, 0])[1],
      pool: [0, 0, 0, 0] as RoomLayout["pool"],
      steam: [pSteam[0], pSteam[1], pSteam[2], g.steam.height * ps * phoneScaleSteam] as RoomLayout["steam"],
      boxes: phoneBoxes,
      bulb: [NaN, NaN, NaN] as RoomLayout["bulb"],
    },
  };

  // One permutation for both layouts and the records, so any prefix (the tier's draw range)
  // covers the whole room.
  for (let a = n - 1; a > 0; a--) {
    const b = Math.floor(rand() * (a + 1));
    for (const [arr, w] of [
      [desk, 3],
      [phone, 3],
      [attr, 4],
    ] as const) {
      for (let k = 0; k < w; k++) {
        const t = arr[a * w + k]!;
        arr[a * w + k] = arr[b * w + k]!;
        arr[b * w + k] = t;
      }
    }
  }

  return { desktop: desk, phone, attr, layout };
}
