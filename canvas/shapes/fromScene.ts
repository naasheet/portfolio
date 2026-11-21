import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeMeshes, sampleGeometry } from "./fromModel";

/** Edge jitter in the scene's own units (room.glb is ~12 wide, so ~3x 3.2's 0.012). */
const SCENE_JITTER = 0.035;

/**
 * A multi-object GLB as points per node (R.3). Each named node keeps its transform (sampled in
 * world space) and gets `count` points from 3.2's edge-plus-surface sampler. `pause` runs between
 * nodes (an idle callback), so no single task gets long. Returns model-space points per node,
 * unfitted: the caller places and fits them.
 */
export async function fromScene(
  buffer: ArrayBuffer,
  nodes: readonly { node: string; count: number }[],
  rand: () => number,
  pause: () => Promise<void>,
): Promise<Map<string, Float32Array>> {
  const gltf = await new GLTFLoader().parseAsync(buffer, "");
  gltf.scene.updateMatrixWorld(true);
  const out = new Map<string, Float32Array>();
  for (const { node, count } of nodes) {
    const object = gltf.scene.getObjectByName(node);
    if (!object) throw new Error(`room.glb has no node "${node}"`);
    await pause();
    const geo = mergeMeshes(object);
    const points = new Float32Array(count * 3);
    sampleGeometry(geo, points, 0, count, rand, SCENE_JITTER);
    geo.dispose();
    out.set(node, points);
  }
  return out;
}
