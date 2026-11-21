"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { chapters } from "@/content/chapters";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useStore } from "@/lib/store";
import { morphTo, stopMorph, type ParticleMesh } from "./particles/morph";
import { getShape, loadShapes } from "./shapes/registry";

/**
 * Chapter → shape (CLAUDE.md §2). Watches scroll.chapter (written by ChapterSection's
 * ScrollTrigger) and morphs to that chapter's shape; off the homepage, to the scatter. A shape
 * that isn't computed yet is morphed to as soon as loadShapes() has it. Reduced motion swaps
 * instantly (CLAUDE.md §10: no morphs).
 */
export function ScrollMorph({ pathname }: { pathname: string }) {
  const scene = useThree((s) => s.scene);
  const reduced = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    const home = pathname === "/";

    const go = (chapter: number) => {
      const id = home ? (chapters[chapter]?.id ?? "scatter") : "scatter";
      const apply = () => {
        if (cancelled) return;
        const mesh = scene.getObjectByName("particles") as
          ParticleMesh | undefined;
        const shape = getShape(id);
        if (mesh && shape) morphTo(mesh, shape, { instant: reduced });
      };
      if (getShape(id)) apply();
      else void loadShapes().then(apply);
    };

    go(useStore.getState().scroll.chapter);
    const unsubscribe = useStore.subscribe((s) => s.scroll.chapter, go);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [scene, pathname, reduced]);

  useEffect(() => stopMorph, []);

  return null;
}
