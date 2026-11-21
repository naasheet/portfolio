"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  CustomBlending,
  OneFactor,
  OneMinusSrcAlphaFactor,
  type Points,
  ShaderMaterial,
  Sphere,
  Vector2,
  Vector3,
  Vector4,
} from "three";
import noise from "../shaders/noise.glsl";
import fragmentShader from "../shaders/particles.frag.glsl";
import vertex from "../shaders/particles.vert.glsl";
import { DEFAULT_PARTICLES, MAX_PARTICLES } from "../shapes/constants";
import { readCanvasColors, watchTheme } from "./colors";
import { liveMood, liveRoom } from "./mood";
import {
  RIPPLE_SLOTS,
  createPointerTracker,
  type PointerTracker,
} from "./pointer";
import { mulberry32 } from "../shapes/random";
import { getRoom, loadShapes, scatterShape } from "../shapes/registry";
import { updateRoomView } from "../room/hitAreas";
import { liveHot, watchHot } from "../room/hot";
import { roomObjects } from "@/content/room";
import { gsap } from "@/lib/motion/gsap";
import { hasSecret } from "@/lib/secrets";
import { useStore } from "@/lib/store";

export { DEFAULT_PARTICLES, MAX_PARTICLES } from "../shapes/constants";

/**
 * Scroll response (R.2): the current page's own scroll progress (scroll.progress, written by
 * RouteWatcher) turns the mesh (rad over the whole page) and lifts it (parallax, world units),
 * so long pages such as /work move the canvas; pages that don't scroll leave it at rest.
 */
const SCROLL_ROTATE_Y = 0.5;
const SCROLL_TILT_X = 0.12;
const PARALLAX_Y = 0.3;
/** Smoothing time constant (s), so a fling eases instead of jerking the view. */
const SCROLL_TAU = 0.35;
/** Base point size (CSS px at depth 1); the mood scales it. */
const BASE_SIZE = 16;
/**
 * The room (R.3): seen from about 25° above the desk (40° on phones, so the three rows separate
 * on a tall screen); the pointer tilts it up to 3°.
 */
const ROOM_TILT = { desktop: (25 * Math.PI) / 180, phone: (40 * Math.PI) / 180 };
const POINTER_TILT = (3 * Math.PI) / 180;
/** The plant (R.5): its index, whose box anchors the leaf that grows when it's watered. */
const PLANT = roomObjects.findIndex((o) => o.id === "plant");

/** The room sits low in the view, under Home's intro (shape units). */
const ROOM_LIFT = { desktop: 0.05, phone: 0.2 };

/**
 * The one Points mesh (CLAUDE.md §9.2): one draw call, a custom ShaderMaterial. On Home (R.3) a
 * second Points draws the same geometry as the desk's reflection (one more draw call, no more
 * particles); it's hidden everywhere else.
 */
export function Particles({
  count = DEFAULT_PARTICLES,
  pointScale = 1,
}: {
  /** Particles drawn (the quality tier's draw range, 3.6). */
  count?: number;
  /** Point size multiplier from the tier, so fewer particles still draw a solid shape. */
  pointScale?: number;
}) {
  const geometry = useMemo(() => {
    const rand = mulberry32(0x5eed);
    const from = new Float32Array(MAX_PARTICLES * 3);
    const to = new Float32Array(MAX_PARTICLES * 3);
    const random = new Float32Array(MAX_PARTICLES * 4);
    // Start from the idle scatter; the chapter shapes are computed in idle time (3.2).
    from.set(scatterShape());
    to.set(from);
    for (let i = 0; i < random.length; i += 4) {
      random[i] = rand(); // morph delay
      random[i + 1] = 0.5 + rand(); // size, 0.5–1.5
      random[i + 2] = rand(); // seed
      random[i + 3] = rand(); // spare
    }

    const geo = new BufferGeometry();
    geo.setAttribute("aFrom", new BufferAttribute(from, 3));
    geo.setAttribute("aTo", new BufferAttribute(to, 3));
    geo.setAttribute("aRandom", new BufferAttribute(random, 4));
    // The room's per-particle records (R.3), filled once the room is computed. Until then
    // kind -1: no particle is part of the room.
    const room = new Float32Array(MAX_PARTICLES * 4);
    for (let i = 0; i < room.length; i += 4) {
      room[i] = -1;
      room[i + 1] = -1;
    }
    geo.setAttribute("aRoom", new BufferAttribute(room, 4));
    // No `position` attribute, so three can't compute bounds: give it a fixed sphere.
    geo.boundingSphere = new Sphere(new Vector3(), 5);
    return geo;
  }, []);

  // The theme's colours, read once here; colors.ts keeps them in step with the theme (3.5).
  const colors = useMemo(() => readCanvasColors(), []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: `${noise}\n${vertex}`,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        // Premultiplied output: additive in dark, "over" in light (particles.frag.glsl).
        blending: CustomBlending,
        blendSrc: OneFactor,
        blendDst: OneMinusSrcAlphaFactor,
        // Every uniform from CLAUDE.md §9.2, plus uPointerVelocity, uRipples, uPixelRatio, uSize,
        // uDriftTime, uSpread and uFade.
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uScroll: { value: 0 },
          uPointer: { value: new Vector2(0, 0) },
          uPointerRadius: { value: 0.45 },
          uPointerStrength: { value: 0 },
          uPointerVelocity: { value: new Vector2(0, 0) },
          uRipples: {
            value: Array.from({ length: RIPPLE_SLOTS }, () => new Vector4()),
          },
          uBass: { value: 0 },
          uMid: { value: 0 },
          uHigh: { value: 0 },
          uPulse: { value: 0 },
          uColorA: { value: colors.a.clone() },
          uColorB: { value: colors.b.clone() },
          uTheme: { value: colors.theme },
          uFade: { value: 0 },
          uPixelRatio: { value: 1 },
          uSize: { value: BASE_SIZE },
          uDriftTime: { value: 0 },
          uSpread: { value: 1 },
          uRoom: { value: 0 },
          uPhone: { value: 0 },
          uLamp: { value: 1 - colors.theme },
          uDeskY: { value: 0 },
          uPool: { value: new Vector4() },
          uSteam: { value: new Vector4(0, 0, 0, 1) },
          // The module array itself: hot.ts's tweens write it, the uniform reads it each draw.
          uHot: { value: liveHot },
          uAnyHot: { value: 0 },
          uFocus: { value: -1 },
          uBurst: { value: 0 },
          uLeaf: { value: 0 },
          uLeafAxis: { value: new Vector4() },
          uPlant: { value: PLANT },
          uType: { value: 1 },
          uBulb: { value: 1 },
        },
      }),
    [colors],
  );

  // The reflection (R.3): same shaders with REFLECT, sharing the uniforms object, so every
  // write (theme, mood, pointer) reaches both.
  const reflectMaterial = useMemo(() => {
    const m = material.clone();
    m.uniforms = material.uniforms;
    m.defines = { REFLECT: "" };
    return m;
  }, [material]);

  // Pointer (3.4): window listeners, read once per frame below.
  const pointer = useRef<PointerTracker | null>(null);
  useEffect(() => {
    const tracker = createPointerTracker();
    pointer.current = tracker;
    return () => {
      tracker.dispose();
      pointer.current = null;
    };
  }, []);

  // Compute every other shape while the gate is up, one idle callback each. Once the room
  // exists, its per-particle records go into aRoom (once).
  useEffect(() => {
    let cancelled = false;
    void loadShapes().then(() => {
      const room = getRoom();
      if (cancelled || !room) return;
      const attr = geometry.getAttribute("aRoom") as BufferAttribute;
      (attr.array as Float32Array).set(room.attr);
      attr.needsUpdate = true;
    });
    return () => {
      cancelled = true;
    };
  }, [geometry]);

  useEffect(() => {
    geometry.setDrawRange(0, Math.min(count, MAX_PARTICLES));
  }, [geometry, count]);

  // Read every frame, so it lives in a ref (a tier change re-renders once, then the frame reads it).
  const scale = useRef(pointScale);
  useEffect(() => {
    scale.current = pointScale;
  }, [pointScale]);

  // Free the GPU buffers and the program on unmount (CLAUDE.md §6).
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      reflectMaterial.dispose();
    },
    [geometry, material, reflectMaterial],
  );
  const reflection = useRef<Points<BufferGeometry, ShaderMaterial>>(null);

  // Compile both programs now, in the background (KHR_parallel_shader_compile where available).
  // The reflection is hidden until Home's room appears, and compiling it on its first draw took
  // a 300–400 ms frame mid-intro (R.6). compile() includes invisible objects.
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    void gl.compileAsync(scene, camera).catch(() => {});
  }, [gl, scene, camera, material, reflectMaterial]);
  // The pointer's tilt of the room, smoothed (rad).
  const tilt = useRef({ x: 0, y: 0 });

  // Uniforms are written through the mesh ref: refs are the place for per-frame mutation.
  const points = useRef<Points<BufferGeometry, ShaderMaterial>>(null);
  // The room's hover / focus highlight follows the store's room.hot (R.4).
  useEffect(() => watchHot(), []);
  // The plant's leaf (R.5): grown if it was ever watered (lib/secrets.ts), grows when it is.
  const leaf = useRef({ v: 0 });
  useEffect(() => {
    if (hasSecret("plant")) leaf.current.v = 1;
    let tween: gsap.core.Tween | null = null;
    const unsubscribe = useStore.subscribe(
      (s) => s.room.leaf,
      (grown) => {
        if (!grown) return;
        tween?.kill();
        tween = gsap.to(leaf.current, { v: 1, duration: 1.4, ease: "elastic.out(1, 0.6)" });
      },
    );
    return () => {
      unsubscribe();
      tween?.kill();
    };
  }, []);
  // No pointer lean on touch screens (R.5): there's no hover to follow.
  const finePointer = useRef(true);
  useEffect(() => {
    finePointer.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);
  // Theme changes tween the particle colours and the clear colour (3.5).
  useEffect(() => {
    const mesh = points.current;
    if (!mesh) return;
    return watchTheme(mesh.material, colors.bg);
  }, [colors]);
  // Smoothed scroll progress, kept in a ref (fast values skip React, CLAUDE.md §5.3).
  const scroll = useRef(0);
  useFrame((state, delta) => {
    const mesh = points.current;
    if (!mesh) return;
    const u = mesh.material.uniforms;
    if (u.uTime) u.uTime.value = state.clock.elapsedTime;
    if (u.uPixelRatio) u.uPixelRatio.value = state.viewport.dpr;

    // Mood (3.5): tweened by mood.ts. The drift clock advances at the mood's speed, so a speed
    // change never jumps the drift. delta is clamped like the pointer's (a long hidden tab).
    if (u.uDriftTime)
      u.uDriftTime.value += Math.min(Math.max(delta, 0), 0.1) * liveMood.drift;
    if (u.uSize) u.uSize.value = BASE_SIZE * liveMood.size * scale.current;
    if (u.uSpread) u.uSpread.value = liveMood.spread;
    if (u.uFade) u.uFade.value = liveMood.fade;

    // The room (R.3): tweened with the morph by RouteMorph (mood.ts liveRoom).
    const r = liveRoom;
    if (u.uRoom) u.uRoom.value = r.room;
    if (u.uPhone) u.uPhone.value = r.phone;
    if (u.uDeskY) u.uDeskY.value = r.deskY;
    if (u.uType) u.uType.value = r.type;
    if (u.uBulb) u.uBulb.value = r.bulb;
    (u.uPool?.value as Vector4 | undefined)?.set(r.poolX, r.poolY, r.poolZ, r.poolR);
    (u.uSteam?.value as Vector4 | undefined)?.set(r.steamX, r.steamY, r.steamZ, r.steamH);
    if (reflection.current) reflection.current.visible = r.room > 0.001;
    if (u.uAnyHot) u.uAnyHot.value = Math.max(...liveHot);

    // Rotation and parallax, scrubbed to the page's scroll and separate from the morphs.
    const k = 1 - Math.exp(-Math.max(delta, 0) / SCROLL_TAU);
    scroll.current += (useStore.getState().scroll.progress - scroll.current) * k;
    const s = scroll.current;
    if (u.uScroll) u.uScroll.value = s;

    // Pointer: parts the particles like water (3.4).
    const p = pointer.current?.update(state.camera, delta);

    // The room tilts toward the viewer (25°) and follows the pointer by up to 3°.
    const half = { x: state.viewport.width / 2, y: state.viewport.height / 2 };
    const lean = p && finePointer.current;
    const px = lean && half.x > 0 ? Math.max(-1, Math.min(1, p.x / half.x)) : 0;
    const py = lean && half.y > 0 ? Math.max(-1, Math.min(1, p.y / half.y)) : 0;
    const tk = 1 - Math.exp(-Math.max(delta, 0) / 0.4);
    tilt.current.x += (-py * POINTER_TILT - tilt.current.x) * tk;
    tilt.current.y += (px * POINTER_TILT - tilt.current.y) * tk;
    const lift = ROOM_LIFT.desktop + (ROOM_LIFT.phone - ROOM_LIFT.desktop) * r.phone;
    const roomTilt =
      ROOM_TILT.desktop + (ROOM_TILT.phone - ROOM_TILT.desktop) * r.phone;
    for (const obj of [mesh, reflection.current]) {
      if (!obj) continue;
      obj.rotation.y = s * SCROLL_ROTATE_Y + tilt.current.y * r.room;
      obj.rotation.x =
        Math.sin(s * Math.PI) * SCROLL_TILT_X + (roomTilt + tilt.current.x) * r.room;
      obj.position.y = s * PARALLAX_Y + lift * r.room + liveMood.placeY;
      obj.position.x = liveMood.placeX;
      obj.scale.setScalar(liveMood.placeScale);
    }

    // R.4: where each object is on screen, for the DOM's hit test, tags and hover card.
    const layout = getRoom()?.layout[r.phone > 0.5 ? "phone" : "desktop"];
    // R.5: the leaf grows from the plant's box (centre x / z, base y, height).
    if (u.uLeaf) u.uLeaf.value = leaf.current.v;
    if (layout) {
      const b = PLANT * 6;
      const bx = layout.boxes;
      (u.uLeafAxis?.value as Vector4 | undefined)?.set(
        (bx[b]! + bx[b + 3]!) / 2,
        bx[b + 1]!,
        (bx[b + 2]! + bx[b + 5]!) / 2,
        bx[b + 4]! - bx[b + 1]!,
      );
    }
    updateRoomView(
      mesh,
      state.camera,
      state.size,
      layout?.boxes ?? null,
      r.room,
      layout?.bulb ?? null,
    );

    if (p) {
      (u.uPointer?.value as Vector2 | undefined)?.set(p.x, p.y);
      (u.uPointerVelocity?.value as Vector2 | undefined)?.set(p.vx, p.vy);
      if (u.uPointerStrength) u.uPointerStrength.value = p.strength;
      const ripples = u.uRipples?.value as Vector4[] | undefined;
      ripples?.forEach((r, i) => r.copy(p.ripples[i]!));
    }
  });

  return (
    <>
      {/* The canvas is opaque (alpha: false) and clears to bg/base every frame (3.5). */}
      <primitive object={colors.bg} attach="background" />
      <points
        ref={reflection}
        geometry={geometry}
        material={reflectMaterial}
        frustumCulled={false}
        renderOrder={-1}
        visible={false}
      />
      <points
        ref={points}
        name="particles"
        geometry={geometry}
        material={material}
        frustumCulled={false}
      />
    </>
  );
}
