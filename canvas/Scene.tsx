"use client";

import { ShapeCycler } from "./dev/ShapeCycler";
import { FrameDriver } from "./FrameDriver";
import { Particles } from "./particles/Particles";

/** Everything inside the one R3F canvas. */
export function Scene() {
  return (
    <>
      <Particles />
      {/* Dev only: `]` cycles through the shapes (dropped from production builds). */}
      {process.env.NODE_ENV === "development" ? <ShapeCycler /> : null}
      {/* Last on purpose: effects run in sibling order, so the scene's own setup (the draw
          range) is done before the driver renders the first (or, reduced motion, only) frame. */}
      <FrameDriver />
    </>
  );
}
