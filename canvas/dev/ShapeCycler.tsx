"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type {
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
} from "three";
import { gsap } from "@/lib/motion/gsap";
import { isTypingTarget } from "@/lib/shortcuts";
import { SHAPE_IDS, getShape } from "../shapes/registry";

/**
 * Development only (rendered behind a NODE_ENV check in Scene): `]` morphs to the next ready
 * shape. The current target becomes aFrom, the next shape aTo, and uMorph tweens 0 → 1, so the
 * per-particle delay shows. 3.3 owns the real switching (scroll).
 */
export function ShapeCycler() {
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    let index = SHAPE_IDS.indexOf("scatter");
    let tween: gsap.core.Tween | null = null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "]" || e.repeat || e.ctrlKey || e.metaKey || e.altKey)
        return;
      if (isTypingTarget(e.target)) return;
      const mesh = scene.getObjectByName("particles") as
        Points<BufferGeometry, ShaderMaterial> | undefined;
      const morph = mesh?.material.uniforms.uMorph;
      if (!mesh || !morph) return;

      for (let step = 1; step <= SHAPE_IDS.length; step++) {
        const next = (index + step) % SHAPE_IDS.length;
        const id = SHAPE_IDS[next]!;
        const shape = getShape(id);
        if (!shape) continue;
        const from = mesh.geometry.getAttribute("aFrom") as BufferAttribute;
        const to = mesh.geometry.getAttribute("aTo") as BufferAttribute;
        (from.array as Float32Array).set(to.array as Float32Array);
        (to.array as Float32Array).set(shape);
        from.needsUpdate = true;
        to.needsUpdate = true;
        tween?.kill();
        morph.value = 0;
        tween = gsap.to(morph, {
          value: 1,
          duration: 1.2,
          ease: "power2.inOut",
        });
        index = next;
        console.info(`[shapes] → ${id}`);
        document.documentElement.dataset.shape = id;
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      tween?.kill();
    };
  }, [scene]);

  return null;
}
