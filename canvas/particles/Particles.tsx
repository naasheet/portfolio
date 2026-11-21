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

/** Attributes are sized for the maximum (CLAUDE.md §6: 20k–40k); setDrawRange picks the count. */
export const MAX_PARTICLES = 40_000;
export const DEFAULT_PARTICLES = 30_000;

/** Seeded PRNG (mulberry32), so the cloud is the same on every visit. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A soft ellipsoid cloud filling the view (FOV 35 at z = 6 sees about 3.8 units tall).
 * Placeholder for aFrom / aTo until the shapes arrive in 3.2.
 */
function fillCloud(target: Float32Array, rand: () => number): void {
  for (let i = 0; i < target.length; i += 3) {
    // Uniform direction, radius biased towards the centre.
    const u = rand() * 2 - 1;
    const phi = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = Math.cbrt(rand()) * (0.6 + 0.4 * rand());
    target[i] = Math.cos(phi) * s * r * 3.6;
    target[i + 1] = u * r * 2.2;
    target[i + 2] = Math.sin(phi) * s * r * 1.6;
  }
}

function readColor(name: string): Color {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return new Color(value || "white");
}

/** The one Points mesh (CLAUDE.md §9.2): one draw call, a custom ShaderMaterial. */
export function Particles({ count = DEFAULT_PARTICLES }: { count?: number }) {
  const geometry = useMemo(() => {
    const rand = mulberry32(0x5eed);
    const from = new Float32Array(MAX_PARTICLES * 3);
    const to = new Float32Array(MAX_PARTICLES * 3);
    const random = new Float32Array(MAX_PARTICLES * 4);
    fillCloud(from, rand);
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
  useFrame((state) => {
    const mesh = points.current;
    if (!mesh) return;
    const u = mesh.material.uniforms;
    if (u.uTime) u.uTime.value = state.clock.elapsedTime;
    if (u.uPixelRatio) u.uPixelRatio.value = state.viewport.dpr;
  });

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}
