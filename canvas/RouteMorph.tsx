"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { fallbackMood, SCATTER_FADE, shapePageAt } from "@/content/chapters";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fadeTo, moodTo, roomTo, stopMood, stopRoom } from "./particles/mood";
import { morphTo, stopMorph, type ParticleMesh } from "./particles/morph";
import {
  getRoom,
  getShape,
  loadShapes,
  PHONE_SUFFIX,
} from "./shapes/registry";

/** The room's phone layout below the tablet breakpoint (md, 48rem). */
const PHONE_QUERY = "(max-width: 47.99rem)";

/**
 * Route → shape (R.2, CLAUDE.md §2). The six pages' own routes morph to their shape and mood;
 * every other route (case studies, /arcade/*, 404, /terminal, /credits, /dev) to the scatter
 * with the calm fallback mood, faded toward the background (uFade SCATTER_FADE). Shape, mood,
 * fade and the room state all tween together over MORPH_DURATION (0.9 s, power3.inOut).
 * morphTo coalesces calls and freezes a running morph before retargeting (3.3), so rapid page
 * switching never pops. A shape that isn't computed yet is morphed to as soon as loadShapes()
 * has it. The first route of a visit starts at its fade (no tween); reduced motion swaps
 * instantly (CLAUDE.md §10).
 *
 * Home is the particle room (R.3): its desktop or phone layout by a live media query, so
 * resizing across 768 px re-morphs without a reload.
 */
export function RouteMorph({ pathname }: { pathname: string }) {
  const scene = useThree((s) => s.scene);
  const reduced = useReducedMotion();
  const phone = useMediaQuery(PHONE_QUERY);
  const first = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const current = shapePageAt(pathname);
    fadeTo(current ? 0 : SCATTER_FADE, { instant: reduced || first.current });
    first.current = false;

    const isRoom = current?.shape.kind === "room";
    const id = current
      ? current.id + (isRoom && phone ? PHONE_SUFFIX : "")
      : "scatter";
    const apply = () => {
      if (cancelled) return;
      const mesh = scene.getObjectByName("particles") as
        ParticleMesh | undefined;
      const shape = getShape(id);
      if (!mesh || !shape) return;
      morphTo(mesh, shape, { instant: reduced });
      moodTo(current?.mood ?? fallbackMood, { instant: reduced });
      const room = getRoom();
      if (isRoom && room) {
        const l = room.layout[phone ? "phone" : "desktop"];
        roomTo(
          {
            room: 1,
            phone: phone ? 1 : 0,
            deskY: l.deskY,
            poolX: l.pool[0],
            poolY: l.pool[1],
            poolZ: l.pool[2],
            poolR: l.pool[3],
            steamX: l.steam[0],
            steamY: l.steam[1],
            steamZ: l.steam[2],
            steamH: l.steam[3],
          },
          { instant: reduced },
        );
      } else {
        roomTo({ room: 0 }, { instant: reduced });
      }
    };
    if (getShape(id)) apply();
    else void loadShapes().then(apply);
    return () => {
      cancelled = true;
    };
  }, [scene, pathname, reduced, phone]);

  useEffect(
    () => () => {
      stopMorph();
      stopMood();
      stopRoom();
    },
    [],
  );

  return null;
}
