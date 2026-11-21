"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { chapters, fallbackMood } from "@/content/chapters";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useStore } from "@/lib/store";
import { fadeTo, moodTo, stopMood } from "./particles/mood";
import { morphTo, stopMorph, type ParticleMesh } from "./particles/morph";
import { getShape, loadShapes } from "./shapes/registry";

/**
 * Chapter → shape (CLAUDE.md §2). Watches scroll.chapter (written by ChapterSection's
 * ScrollTrigger) and morphs to that chapter's shape; off the homepage, to the scatter. A shape
 * that isn't computed yet is morphed to as soon as loadShapes() has it. Each chapter's mood
 * (3.5) tweens with its morph. Off the homepage the canvas calms down: a slow morph to the
 * scatter, the calm fallback mood, and the particles fade toward the background (uFade).
 * Reduced motion swaps instantly (CLAUDE.md §10: no morphs).
 */

/** Off the homepage: the slow move to the scatter and the fade toward the background (s). */
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
    const home = pathname === "/";
    const instant = reduced || first.current;
    first.current = false;
    fadeTo(home ? 0 : 1, {
      duration: home ? FADE_IN : FADE_OUT,
      instant,
    });

    const go = (chapter: number) => {
      const current = home ? chapters[chapter] : undefined;
      const id = current?.id ?? "scatter";
      const duration = home ? undefined : CALM_DURATION;
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
    };

    go(useStore.getState().scroll.chapter);
    const unsubscribe = useStore.subscribe((s) => s.scroll.chapter, go);
    return () => {
      cancelled = true;
      unsubscribe();
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
