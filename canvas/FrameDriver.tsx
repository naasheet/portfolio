"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { gsap } from "@/lib/motion/gsap";
import { setFrameRequester } from "./frame";
import { usePageVisible } from "@/lib/hooks/usePageVisible";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * One clock (CLAUDE.md §5.4): the canvas runs with frameloop "never" and renders from
 * gsap.ticker, after Lenis and ScrollTrigger have updated on the same frame. No frames while
 * the tab is hidden. Reduced motion draws one still frame, again on resize and when the shape
 * changes (CLAUDE.md §9.2).
 */
export function FrameDriver() {
  const advance = useThree((s) => s.advance);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const reduced = useReducedMotion();
  const visible = usePageVisible();

  useEffect(() => {
    if (reduced) {
      advance(0);
      // Instant shape swaps (ScrollMorph) ask for a frame through canvas/frame.ts.
      setFrameRequester(() => advance(0));
      return () => setFrameRequester(null);
    }
    if (!visible) return;
    // gsap's time is in seconds, which is what R3F uses as elapsed time with frameloop "never".
    const tick = (time: number) => advance(time);
    gsap.ticker.add(tick, false, false); // last: after Lenis's raf
    return () => gsap.ticker.remove(tick);
  }, [advance, reduced, visible, width, height]);

  return null;
}
