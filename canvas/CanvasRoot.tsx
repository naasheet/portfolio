"use client";

import { Canvas } from "@react-three/fiber";
import { Scene } from "./Scene";

/** True when the browser can make a WebGL context. Checked once per page load. */
let webglSupport: boolean | undefined;
function hasWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const probe = document.createElement("canvas");
    const ctx = probe.getContext("webgl2") ?? probe.getContext("webgl");
    webglSupport = ctx !== null;
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/**
 * The living canvas (CLAUDE.md §2, §9.2): one fixed full-screen R3F canvas behind everything.
 * Loaded through components/layer/CanvasLoader with next/dynamic (ssr: false). Without WebGL
 * it stays an empty layer and the page background shows (the CSS gradient fallback is later).
 */
export function CanvasRoot() {
  return (
    <div
      aria-hidden
      data-canvas
      className="pointer-events-none fixed inset-0 z-canvas"
    >
      {hasWebGL() ? (
        <Canvas
          frameloop="never"
          dpr={[1, 1.75]}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: "high-performance",
          }}
          camera={{ fov: 35, position: [0, 0, 6], near: 0.1, far: 50 }}
        >
          <Scene />
        </Canvas>
      ) : null}
    </div>
  );
}
