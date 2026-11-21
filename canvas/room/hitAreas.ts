import { Vector3, type Camera, type Object3D } from "three";
import { useStore } from "@/lib/store";

const corner = new Vector3();
const view = new Vector3();

/**
 * R.4 hit areas: project each object's box (shape units, from the room build) through the
 * mesh's current transform (tilt, lift, pointer lean) to a screen rect in CSS px plus a depth,
 * and write them in place into the store's room.view. The DOM (RoomOverlay) hit-tests the
 * pointer against them; nothing here re-renders anything. `shown` 0 hides them all.
 */
export function updateRoomView(
  mesh: Object3D,
  camera: Camera,
  size: { width: number; height: number },
  boxes: Float32Array | null,
  shown: number,
  bulb: readonly [number, number, number] | null = null,
): void {
  const out = useStore.getState().room.view;
  out.shown = boxes ? shown : 0;
  const count = out.boxes.length / 5;
  if (!boxes || shown <= 0) {
    out.boxes.fill(NaN);
    out.bulb.fill(NaN);
    return;
  }
  mesh.updateMatrixWorld();
  // The lamp's bulb (R.5): where the theme reveal starts.
  if (bulb && !Number.isNaN(bulb[0])) {
    corner.set(bulb[0], bulb[1], bulb[2]).applyMatrix4(mesh.matrixWorld).project(camera);
    out.bulb[0] = (corner.x * 0.5 + 0.5) * size.width;
    out.bulb[1] = (-corner.y * 0.5 + 0.5) * size.height;
  } else {
    out.bulb.fill(NaN);
  }
  for (let o = 0; o < count; o++) {
    const b = o * 6;
    if (Number.isNaN(boxes[b]!)) {
      out.boxes[o * 5] = NaN;
      continue;
    }
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity,
      depth = Infinity;
    for (let c = 0; c < 8; c++) {
      corner.set(
        boxes[b + (c & 1 ? 3 : 0)]!,
        boxes[b + 1 + (c & 2 ? 3 : 0)]!,
        boxes[b + 2 + (c & 4 ? 3 : 0)]!,
      );
      corner.applyMatrix4(mesh.matrixWorld);
      view.copy(corner).applyMatrix4(camera.matrixWorldInverse);
      depth = Math.min(depth, -view.z);
      corner.project(camera);
      const sx = (corner.x * 0.5 + 0.5) * size.width;
      const sy = (-corner.y * 0.5 + 0.5) * size.height;
      x0 = Math.min(x0, sx);
      x1 = Math.max(x1, sx);
      y0 = Math.min(y0, sy);
      y1 = Math.max(y1, sy);
    }
    out.boxes.set([x0, y0, x1, y1, depth], o * 5);
  }
}
