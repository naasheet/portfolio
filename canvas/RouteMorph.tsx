"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { fallbackMood, SCATTER_FADE, shapePageAt } from "@/content/chapters";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fadeTo, moodTo, stopMood } from "./particles/mood";
import { morphTo, stopMorph, type ParticleMesh } from "./particles/morph";
import { getShape, loadShapes } from "./shapes/registry";

/**
 * Route → shape (R.2, CLAUDE.md §2). The six pages' own routes morph to their shape and mood;
 * every other route (case studies, /arcade/*, 404, /terminal, /credits, /dev) to the scatter
 * with the calm fallback mood, faded toward the background (uFade SCATTER_FADE). Shape, mood
 * and fade all tween together over MORPH_DURATION (0.9 s, power3.inOut). morphTo coalesces calls
 * and freezes a running morph before retargeting (3.3), so rapid page switching never pops.
 * A shape that isn't computed yet is morphed to as soon as loadShapes() has it. The first route
 * of a visit starts at its fade (no tween); reduced motion swaps instantly (CLAUDE.md §10).
 * Home keeps the name shape until R.3's room.
 */
export function RouteMorph({ pathname }: { pathname: string }) {
  const scene = useThree((s) => s.scene);
  const reduced = useReducedMotion();
  const first = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const current = shapePageAt(pathname);
    fadeTo(current ? 0 : SCATTER_FADE, { instant: reduced || first.current });
    first.current = false;

    const id = current?.id ?? "scatter";
    const apply = () => {
      if (cancelled) return;
      const mesh = scene.getObjectByName("particles") as
        ParticleMesh | undefined;
      const shape = getShape(id);
      if (!mesh || !shape) return;
      morphTo(mesh, shape, { instant: reduced });
      moodTo(current?.mood ?? fallbackMood, { instant: reduced });
    };
    if (getShape(id)) apply();
    else void loadShapes().then(apply);
    return () => {
      cancelled = true;
    };
  }, [scene, pathname, reduced]);

  useEffect(
    () => () => {
      stopMorph();
      stopMood();
    },
    [],
  );

  return null;
}
