"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { fallbackMood, SCATTER_FADE, shapePageAt } from "@/content/chapters";
import { roomObjectForPage, roomObjects } from "@/content/room";
import { screen } from "@/content/screen";
import { gsap } from "@/lib/motion/gsap";
import { finishIntro } from "@/lib/motion/intro";
import { useStore } from "@/lib/store";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import {
  fadeTo,
  liveRoom,
  moodTo,
  placeTo,
  roomTo,
  stopMood,
  stopRoom,
} from "./particles/mood";
import { morphTo, stopMorph, type ParticleMesh } from "./particles/morph";
import {
  getIntroShapes,
  getRoom,
  getShape,
  loadShapes,
  PHONE_SUFFIX,
} from "./shapes/registry";

/** A page shape's default placement: centred, full size (4.3). */
const CENTRED = { x: 0, y: 0, scale: 1 };

/**
 * `particles --explode` (6.5), in seconds: the push out (uExplode 0 -> 1), its settle back to 0,
 * the scatter morph that runs with it, when the page's shape starts re-forming, and how long that takes.
 */
const EXPLODE = { out: 0.25, settle: 1.1, scatter: 0.6, hold: 1.2, back: 0.9 };

/** The room's phone layout below the tablet breakpoint (md, 48rem). */
const PHONE_QUERY = "(max-width: 47.99rem)";

/**
 * Home's intro (R.6), in seconds from its start (the gate's exit): the name forms (0.9 s), holds
 * (0.6 s), bursts outward (0.4 s) and assembles into the room (1.0 s). As the room settles the
 * code types in line by line, the bulb flickers on and the page text fades in (finishIntro).
 */
const INTRO = { name: 0, burst: 1.5, room: 1.9, settle: 2.5 } as const;

/** The room's layout state for roomTo (R.3), from a layout. */
function layoutState(phone: boolean) {
  const room = getRoom();
  if (!room) return null;
  const l = room.layout[phone ? "phone" : "desktop"];
  return {
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
  };
}

/** The room object (content/room.ts index) to focus for a move between two routes, or -1. */
function focusFor(from: string | null, to: string): number {
  const prev = from ? shapePageAt(from) : undefined;
  const next = shapePageAt(to);
  const page =
    next?.shape.kind === "room" && prev
      ? prev.id
      : prev?.shape.kind === "room" && next
        ? next.id
        : null;
  const object = page ? roomObjectForPage(page) : undefined;
  return object ? roomObjects.indexOf(object) : -1;
}

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
 * resizing across 768 px re-morphs without a reload. Leaving the room for a page, or coming
 * back from one (R.4), focuses that page's object: it grows into (or back out of) the page's
 * shape first while the rest bursts and re-forms, so Back runs the same move in reverse.
 */
export function RouteMorph({ pathname }: { pathname: string }) {
  const scene = useThree((s) => s.scene);
  const reduced = useReducedMotion();
  const phone = useMediaQuery(PHONE_QUERY);
  const first = useRef(true);
  const previous = useRef<string | null>(null);
  const intro = useStore((s) => s.ui.intro);
  const introTimeline = useRef<gsap.core.Timeline | null>(null);
  const override = useStore((s) =>
    s.particles.path === pathname ? s.particles.shape : null,
  );
  const reapply = useRef<(() => void) | null>(null);
  const explodeTimeline = useRef<gsap.core.Timeline | null>(null);

  // Home's intro (R.6): runs once, while ui.intro is "play" on Home.
  useEffect(() => {
    const home = shapePageAt(pathname)?.shape.kind === "room";
    if (!home) {
      // Left Home mid-intro: drop it and show everything.
      if (introTimeline.current) {
        introTimeline.current.kill();
        introTimeline.current = null;
        roomTo({ type: 1, bulb: 1 }, { instant: true });
        finishIntro();
      }
      return;
    }
    if (intro !== "play" || introTimeline.current) return;
    let cancelled = false;
    void loadShapes().then(() => {
      if (cancelled || introTimeline.current) return;
      const mesh = scene.getObjectByName("particles") as ParticleMesh | undefined;
      const shapes = getIntroShapes(phone ? "phone" : "desktop");
      const roomShape = getShape("home" + (phone ? PHONE_SUFFIX : ""));
      const state = layoutState(phone);
      const mood = shapePageAt(pathname)?.mood;
      if (!mesh || !shapes || !roomShape || !state || !mood) {
        finishIntro();
        return;
      }
      moodTo(mood, { instant: true });
      roomTo({ room: 0, type: 0, bulb: 0 }, { instant: true });
      introTimeline.current = gsap
        .timeline()
        .call(() => morphTo(mesh, shapes.name, { duration: 0.9 }), [], INTRO.name)
        .call(
          () => morphTo(mesh, shapes.burst, { duration: 0.4, ease: "power2.out" }),
          [],
          INTRO.burst,
        )
        .call(
          () => {
            morphTo(mesh, roomShape, { duration: 1 });
            roomTo(state, { duration: 1 });
          },
          [],
          INTRO.room,
        )
        .call(finishIntro, [], INTRO.settle)
        .to(
          liveRoom,
          { type: 1, duration: 0.5, ease: `steps(${screen.lines.length})` },
          INTRO.settle,
        )
        .to(
          liveRoom,
          { keyframes: { bulb: [0, 1, 0.15, 0.9, 0.35, 1] }, duration: 0.5, ease: "none" },
          INTRO.settle,
        );
    });
    return () => {
      cancelled = true;
    };
  }, [intro, pathname, phone, scene]);

  useEffect(() => {
    let cancelled = false;
    const current = shapePageAt(pathname);
    fadeTo(current ? 0 : SCATTER_FADE, { instant: reduced || first.current });
    first.current = false;

    const from = previous.current;
    previous.current = pathname;
    // Home before its intro has finished: the intro effect above drives the particles.
    if (current?.shape.kind === "room" && intro !== "done") return;
    // The terminal's `particles <shape>` (6.5) replaces the page's shape while you stay here.
    const isRoom = override
      ? override === "home"
      : current?.shape.kind === "room";
    const focus =
      override || reduced || !getRoom() ? -1 : focusFor(from, pathname);
    const base = override ?? (current ? current.id : "scatter");
    const id = base + (isRoom && phone ? PHONE_SUFFIX : "");
    const apply = () => {
      if (cancelled) return;
      const mesh = scene.getObjectByName("particles") as
        ParticleMesh | undefined;
      const shape = getShape(id);
      if (!mesh || !shape) return;
      morphTo(mesh, shape, { instant: reduced, focus });
      moodTo(current?.mood ?? fallbackMood, { instant: reduced });
      // The room is laid out for the whole view: centred when it's an override on another page.
      const place =
        isRoom && override ? CENTRED : current?.place?.[phone ? "phone" : "desktop"];
      placeTo(place ?? CENTRED, { instant: reduced });
      const state = isRoom ? layoutState(phone) : null;
      if (state) {
        roomTo(state, { instant: reduced });
      } else {
        roomTo({ room: 0 }, { instant: reduced });
      }
    };
    // `particles --explode` returns here (and focus never applies to a return).
    reapply.current = () => {
      if (cancelled) return;
      const mesh = scene.getObjectByName("particles") as
        ParticleMesh | undefined;
      const shape = getShape(id);
      if (!mesh || !shape) return;
      morphTo(mesh, shape, { duration: EXPLODE.back });
      const state = isRoom ? layoutState(phone) : null;
      roomTo(state ?? { room: 0 }, { duration: EXPLODE.back });
    };
    if (getShape(id)) apply();
    else void loadShapes().then(apply);
    return () => {
      cancelled = true;
    };
  }, [scene, pathname, reduced, phone, intro, override]);

  // `particles --explode` (6.5): a big push outward (uExplode) while the particles scatter, then
  // back to whatever the page shows. Not under reduced motion (no shake, §10), nor mid-intro.
  useEffect(
    () =>
      useStore.subscribe(
        (s) => s.particles.explodes,
        () => {
          if (reduced || useStore.getState().ui.intro === "play") return;
          const mesh = scene.getObjectByName("particles") as
            ParticleMesh | undefined;
          const scatter = getShape("scatter");
          const uExplode = mesh?.material.uniforms.uExplode;
          if (!mesh || !scatter || !uExplode) return;
          explodeTimeline.current?.kill();
          morphTo(mesh, scatter, { duration: EXPLODE.scatter, ease: "power2.out" });
          roomTo({ room: 0 }, { duration: EXPLODE.scatter });
          explodeTimeline.current = gsap
            .timeline()
            .to(uExplode, { value: 1, duration: EXPLODE.out, ease: "power2.out" })
            .to(uExplode, { value: 0, duration: EXPLODE.settle, ease: "power2.inOut" })
            .call(() => reapply.current?.(), [], EXPLODE.hold);
        },
      ),
    [scene, reduced],
  );

  useEffect(
    () => () => {
      introTimeline.current?.kill();
      explodeTimeline.current?.kill();
      stopMorph();
      stopMood();
      stopRoom();
    },
    [],
  );

  return null;
}
