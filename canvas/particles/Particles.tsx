"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  type Points,
  ShaderMaterial,
  Sphere,
  Vector2,
  Vector3,
} from "three";
import noise from "../shaders/noise.glsl";
import fragmentShader from "../shaders/particles.frag.glsl";
import vertex from "../shaders/particles.vert.glsl";
import { DEFAULT_PARTICLES, MAX_PARTICLES } from "../shapes/constants";
import { mulberry32 } from "../shapes/random";
import { loadShapes, scatterShape } from "../shapes/registry";
import { getLenis } from "@/lib/motion/lenis";
import { useStore } from "@/lib/store";

export { DEFAULT_PARTICLES, MAX_PARTICLES } from "../shapes/constants";

function readColor(name: string): Color {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return new Color(value || "white");
}

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

/** The one Points mesh (CLAUDE.md §9.2): one draw call, a custom ShaderMaterial. */
export function Particles({ count = DEFAULT_PARTICLES }: { count?: number }) {
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

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: `${noise}\n${vertex}`,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        // Every uniform from CLAUDE.md §9.2, plus uPixelRatio and uSize.
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uScroll: { value: 0 },
          uPointer: { value: new Vector2(0, 0) },
          uPointerRadius: { value: 0 },
          uPointerStrength: { value: 0 },
          uBass: { value: 0 },
          uMid: { value: 0 },
          uHigh: { value: 0 },
          uPulse: { value: 0 },
          uColorA: { value: readColor("--color-canvas-particle-a") },
          uColorB: { value: readColor("--color-canvas-particle-b") },
          uTheme: { value: 0 },
          uPixelRatio: { value: 1 },
          uSize: { value: 16 },
        },
      }),
    [],
  );

  // Compute every other shape while the gate is up, one idle callback each.
  useEffect(() => {
    void loadShapes();
  }, []);

  useEffect(() => {
    geometry.setDrawRange(0, Math.min(count, MAX_PARTICLES));
  }, [geometry, count]);

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
  // Smoothed scroll values, kept in a ref (fast values skip React, CLAUDE.md §5.3).
  const scroll = useRef({ page: 0, chapter: 0.5 });
  useFrame((state, delta) => {
    const mesh = points.current;
    if (!mesh) return;
    const u = mesh.material.uniforms;
    if (u.uTime) u.uTime.value = state.clock.elapsedTime;
    if (u.uPixelRatio) u.uPixelRatio.value = state.viewport.dpr;

    // Rotation and parallax, scrubbed to scroll and separate from the morphs (3.3).
    const s = scroll.current;
    const k = 1 - Math.exp(-Math.max(delta, 0) / SCROLL_TAU);
    s.page += (pageProgress() - s.page) * k;
    s.chapter += (useStore.getState().scroll.progress - s.chapter) * k;
    if (u.uScroll) u.uScroll.value = s.page;
    mesh.rotation.y = s.page * SCROLL_ROTATE_Y;
    mesh.rotation.x = Math.sin(s.page * Math.PI) * SCROLL_TILT_X;
    mesh.position.y = (s.chapter - 0.5) * PARALLAX_Y;
  });

  return (
    <points
      ref={points}
      name="particles"
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}
