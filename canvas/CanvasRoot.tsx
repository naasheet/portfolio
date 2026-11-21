"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { pickTier, stepDown, TIERS, type TierName } from "@/lib/quality";
import { Scene } from "./Scene";

/**
 * The living canvas (CLAUDE.md §2, §9.2): one fixed full-screen R3F canvas behind everything.
 * Loaded through components/layer/CanvasLoader with next/dynamic (ssr: false), only when the
 * browser has WebGL (otherwise the loader shows CanvasFallback). The canvas is opaque and clears
 * to the theme's bg/base; <body> stays on bg/base too, for the first paint before WebGL starts.
 *
 * Quality (3.6): it starts at the tier lib/quality.ts picks from the hardware, and drei's
 * PerformanceMonitor steps it down a tier (never up) when frames slow: only the draw range and
 * the DPR cap change. Reduced motion renders only on request (FrameDriver), so the monitor sees
 * no frames there and never steps down.
 */
export function CanvasRoot() {
  // Read outside <Canvas> and passed down, rather than relying on R3F's context bridge.
  const pathname = usePathname();
  const [tier, setTier] = useState<TierName>(pickTier);
  const { count, dpr, pointScale } = TIERS[tier];
  return (
    <div
      aria-hidden
      data-canvas
      data-quality={tier}
      className="pointer-events-none fixed inset-0 z-canvas"
    >
      <Canvas
        frameloop="never"
        // A range, so a low-DPR screen never renders above its own pixel ratio.
        dpr={[1, dpr]}
        gl={{
          antialias: false,
          // Opaque: the canvas paints bg/base itself (3.5), so it never composites through
          // the page (premultiplied-alpha edge cases differ between browsers).
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{ fov: 35, position: [0, 0, 6], near: 0.1, far: 50 }}
      >
        <PerformanceMonitor onDecline={() => setTier(stepDown)}>
          <Scene pathname={pathname} count={count} pointScale={pointScale} />
        </PerformanceMonitor>
      </Canvas>
    </div>
  );
}
