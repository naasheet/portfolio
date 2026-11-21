"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { isTypingTarget } from "@/lib/shortcuts";
import { morphTo, type ParticleMesh } from "../particles/morph";
import { SHAPE_IDS, getShape } from "../shapes/registry";

/**
 * Development only (rendered behind a NODE_ENV check in Scene): `]` morphs to the next ready
 * shape through the same morphTo as the scroll morph, so a press mid-morph doesn't pop.
 * Changing page takes over again.
 */
export function ShapeCycler() {
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    let index = SHAPE_IDS.indexOf("scatter");

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "]" || e.repeat || e.ctrlKey || e.metaKey || e.altKey)
        return;
      if (isTypingTarget(e.target)) return;
      const mesh = scene.getObjectByName("particles") as
        ParticleMesh | undefined;
      if (!mesh) return;

      for (let step = 1; step <= SHAPE_IDS.length; step++) {
        const next = (index + step) % SHAPE_IDS.length;
        const id = SHAPE_IDS[next]!;
        const shape = getShape(id);
        if (!shape) continue;
        morphTo(mesh, shape);
        index = next;
        console.info(`[shapes] → ${id}`);
        document.documentElement.dataset.shape = id;
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scene]);

  return null;
}
