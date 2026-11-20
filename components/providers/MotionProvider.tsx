"use client";

import { LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

const loadFeatures = () =>
  import("./motionFeatures").then((mod) => mod.default);

/**
 * Framer Motion for the whole app. Components use `m.*`; LazyMotion supplies the DOM
 * animation features from a separate chunk loaded right after hydration, so they don't
 * count against first-load JS on `/`. Until it arrives (a few ms), `m.*` elements render
 * normally, they just don't animate yet. `strict` throws if anything uses `motion.*`, so the
 * full bundle can't sneak back in. Reduced motion makes transforms jump.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
