"use client";

import { useFrame } from "@react-three/fiber";
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
import { liveMood } from "./mood";
import {
  RIPPLE_SLOTS,
  createPointerTracker,
  type PointerTracker,
} from "./pointer";
import { mulberry32 } from "../shapes/random";
import { loadShapes, scatterShape } from "../shapes/registry";
import { getLenis } from "@/lib/motion/lenis";
import { useStore } from "@/lib/store";

export { DEFAULT_PARTICLES, MAX_PARTICLES } from "../shapes/constants";

/** Overall page scroll, 0–1: Lenis's progress, or native scroll when Lenis is off. */
function pageProgress(): number {
  const lenis = getLenis();
  if (lenis) return Number.isFinite(lenis.progress) ? lenis.progress : 0;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
}

/** Scroll response: rotation (rad) over the whole page, and parallax (world units) per chapter. */
const SCROLL_ROTATE_Y = 0.5;
const SCROLL_TILT_X = 0.12;
const PARALLAX_Y = 0.3;
/** Smoothing time constant (s), so a fling eases instead of jerking the view. */
const SCROLL_TAU = 0.35;
/** Base point size (CSS px at depth 1); the mood scales it. */
const BASE_SIZE = 16;

/** The one Points mesh (CLAUDE.md §9.2): one draw call, a custom ShaderMaterial. */
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
        },
      }),
    [colors],
  );

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

  // Compute every other shape while the gate is up, one idle callback each.
  useEffect(() => {
    void loadShapes();
  }, []);

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
    },
    [geometry, material],
  );

  // Uniforms are written through the mesh ref: refs are the place for per-frame mutation.
  const points = useRef<Points<BufferGeometry, ShaderMaterial>>(null);
  // Theme changes tween the particle colours and the clear colour (3.5).
  useEffect(() => {
    const mesh = points.current;
    if (!mesh) return;
    return watchTheme(mesh.material, colors.bg);
  }, [colors]);
  // Smoothed scroll values, kept in a ref (fast values skip React, CLAUDE.md §5.3).
  const scroll = useRef({ page: 0, chapter: 0.5 });
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

    // Rotation and parallax, scrubbed to scroll and separate from the morphs (3.3).
    const s = scroll.current;
    const k = 1 - Math.exp(-Math.max(delta, 0) / SCROLL_TAU);
    s.page += (pageProgress() - s.page) * k;
    s.chapter += (useStore.getState().scroll.progress - s.chapter) * k;
    if (u.uScroll) u.uScroll.value = s.page;
    mesh.rotation.y = s.page * SCROLL_ROTATE_Y;
    mesh.rotation.x = Math.sin(s.page * Math.PI) * SCROLL_TILT_X;
    mesh.position.y = (s.chapter - 0.5) * PARALLAX_Y;

    // Pointer: parts the particles like water (3.4).
    const p = pointer.current?.update(state.camera, delta);
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
        ref={points}
        name="particles"
        geometry={geometry}
        material={material}
        frustumCulled={false}
      />
    </>
  );
}
