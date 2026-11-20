"use client";

import type { TargetAndTransition, Transition } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { durationS, easeOutPoints, spring } from "@/lib/motion/tokens";

type PanelMotion = {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
  transition: Transition;
};

/**
 * Enter / exit props for an overlay panel. `hidden` is where the panel rests when closed
 * (e.g. { x: "100%" }); it animates to `shown` on the soft spring. With reduced motion it
 * only fades: no slide, no scale (Overlays board, "Motion").
 */
export function usePanelMotion(
  hidden: TargetAndTransition,
  shown: TargetAndTransition,
): PanelMotion {
  const reduced = useReducedMotion();
  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: durationS.base, ease: easeOutPoints },
    };
  }
  return {
    initial: hidden,
    animate: shown,
    exit: hidden,
    transition: spring.soft,
  };
}
