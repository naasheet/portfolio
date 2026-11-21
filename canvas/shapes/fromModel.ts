import {
  BufferAttribute,
  BufferGeometry,
  EdgesGeometry,
  Mesh,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import {
  MAX_PARTICLES,
  SHAPE_BOX,
  createShape,
  type ShapePoints,
} from "./constants";
import { fitTransform } from "./normalize";

/** Share of the points on sharp edges; the rest go across the surface. */
const EDGE_SHARE = 0.55;
/** Edges where the faces meet at more than this many degrees count as sharp. */
const EDGE_ANGLE = 25;
/** ± jitter around an edge, in world units (the model is fitted to SHAPE_BOX first). */
const EDGE_JITTER = 0.012;

/** Fetch a GLB. Network time: the registry awaits this outside the timed part. */
export async function fetchModel(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.arrayBuffer();
}

/** Every mesh of the scene in world space, merged into one position-only, non-indexed geometry. */
export function mergeMeshes(root: import("three").Object3D): BufferGeometry {
  root.updateMatrixWorld(true);
  const parts: Float32Array[] = [];
  root.traverse((obj) => {
    if (!(obj instanceof Mesh)) return;
    const source = obj.geometry as BufferGeometry;
    const flat = source.index ? source.toNonIndexed() : source.clone();
    flat.applyMatrix4(obj.matrixWorld);
    const pos = flat.getAttribute("position");
    const arr = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      arr[i * 3] = pos.getX(i);
      arr[i * 3 + 1] = pos.getY(i);
      arr[i * 3 + 2] = pos.getZ(i);
    }
    parts.push(arr);
    flat.dispose();
  });
  const total = parts.reduce((n, p) => n + p.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const p of parts) {
    merged.set(p, offset);
    offset += p.length;
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(merged, 3));
  return geo;
}

/**
 * A GLB as points. Plain surface sampling makes flat models look like blank slabs, so:
 * 55% of the points along sharp edges (> 25°, picked in proportion to edge length, ±0.012
 * jitter) and the rest across the surface (MeshSurfaceSampler). Outlines and details stay
 * readable. The model is fitted to SHAPE_BOX first, so the jitter is in world units.
 */
export async function fromModel(
  buffer: ArrayBuffer,
  rand: () => number,
): Promise<ShapePoints> {
  const gltf = await new GLTFLoader().parseAsync(buffer, "");
  const geo = mergeMeshes(gltf.scene);
  const out = createShape();

  // Fit to the shape box so EDGE_JITTER means the same on every model.
  const position = geo.getAttribute("position") as BufferAttribute;
  const { cx, cy, cz, scale } = fitTransform(position.array, SHAPE_BOX);
  geo.translate(-cx, -cy, -cz);
  geo.scale(scale, scale, scale);

  sampleGeometry(geo, out, 0, MAX_PARTICLES, rand, EDGE_JITTER);
  geo.dispose();
  return out;
}

/**
 * 3.2's sampler: `count` points of `geo` written into `out` from point `start`. EDGE_SHARE of
 * them along sharp edges (> EDGE_ANGLE, picked in proportion to edge length, ± `jitter` in the
 * geometry's units), the rest across the surface (MeshSurfaceSampler). The room (R.3) samples
 * each node with it.
 */
export function sampleGeometry(
  geo: BufferGeometry,
  out: Float32Array,
  start: number,
  count: number,
  rand: () => number,
  jitter: number,
): void {
  // Sharp edges, as segment pairs, with a cumulative length table for weighted picks.
  const edges = new EdgesGeometry(geo, EDGE_ANGLE);
  const e = edges.getAttribute("position").array as Float32Array;
  const segments = e.length / 6;
  const cumulative = new Float32Array(segments);
  let length = 0;
  for (let s = 0; s < segments; s++) {
    const o = s * 6;
    length += Math.hypot(
      e[o + 3]! - e[o]!,
      e[o + 4]! - e[o + 1]!,
      e[o + 5]! - e[o + 2]!,
    );
    cumulative[s] = length;
  }

  const edgeCount = segments > 0 ? Math.round(count * EDGE_SHARE) : 0;
  for (let n = 0; n < edgeCount; n++) {
    const i = start + n;
    // Binary search the segment whose cumulative length passes the pick.
    const pick = rand() * length;
    let lo = 0,
      hi = segments - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid]! < pick) lo = mid + 1;
      else hi = mid;
    }
    const o = lo * 6;
    const t = rand();
    const j = () => (rand() * 2 - 1) * jitter;
    out[i * 3] = e[o]! + (e[o + 3]! - e[o]!) * t + j();
    out[i * 3 + 1] = e[o + 1]! + (e[o + 4]! - e[o + 1]!) * t + j();
    out[i * 3 + 2] = e[o + 2]! + (e[o + 5]! - e[o + 2]!) * t + j();
  }

  const mesh = new Mesh(geo);
  const sampler = new MeshSurfaceSampler(mesh);
  // three 0.187 has setRandomGenerator; @types/three 0.187 doesn't declare it yet.
  (
    sampler as unknown as { setRandomGenerator(fn: () => number): unknown }
  ).setRandomGenerator(rand);
  sampler.build();
  const p = new Vector3();
  for (let i = start + edgeCount; i < start + count; i++) {
    sampler.sample(p);
    out[i * 3] = p.x;
    out[i * 3 + 1] = p.y;
    out[i * 3 + 2] = p.z;
  }

  edges.dispose();
}
