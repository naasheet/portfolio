"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { chapters, fallbackMood, pageFromPath } from "@/content/chapters";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fadeTo, moodTo, stopMood } from "./particles/mood";
import { morphTo, stopMorph, type ParticleMesh } from "./particles/morph";
import { getShape, loadShapes } from "./shapes/registry";

/**
 * Page → shape (CLAUDE.md §2). Since R.1 each chapter is its own route: the page comes from
 * the URL through pageFromPath() (the same table RouteWatcher uses, so /work/[slug] is Work and
 * /arcade/* is Arcade), and the canvas morphs to that page's shape and mood (3.5). Home keeps
 * the name shape until R.3's room. On pages outside the six the canvas calms down: a slow morph
 * to the scatter, the calm fallback mood, and the particles fade toward the background (uFade).
 * A shape that isn't computed yet is morphed to as soon as loadShapes() has it. Reduced motion
 * swaps instantly (CLAUDE.md §10: no morphs). R.2 turns this into the real RouteMorph.
 */

/** Off the six pages: the slow move to the scatter and the fade toward the background (s). */
const CALM_DURATION = 2.4;
const FADE_OUT = 1.2;
const FADE_IN = 0.8;
export function ScrollMorph({ pathname }: { pathname: string }) {
  const scene = useThree((s) => s.scene);
  const reduced = useReducedMotion();
  // The first route of a visit starts in its state (no fade-in or calm-down from the homepage).
  const first = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const page = pageFromPath(pathname);
    const current = chapters.find((c) => c.id === page);
    const instant = reduced || first.current;
    first.current = false;
    fadeTo(current ? 0 : 1, {
      duration: current ? FADE_IN : FADE_OUT,
      instant,
    });

    const id = current?.id ?? "scatter";
    const duration = current ? undefined : CALM_DURATION;
    const apply = () => {
      if (cancelled) return;
      const mesh = scene.getObjectByName("particles") as
        ParticleMesh | undefined;
      const shape = getShape(id);
      if (!mesh || !shape) return;
      morphTo(mesh, shape, { instant: reduced, duration });
      moodTo(current?.mood ?? fallbackMood, { instant: reduced, duration });
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
