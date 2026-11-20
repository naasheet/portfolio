"use client";

import { useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { writeText } from "@/lib/motion/writeText";
import { cn } from "@/lib/utils";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/\\$@";
/** Share of the run spent fully scrambled before characters start to resolve. */
const HOLD = 0.25;
/** Seconds between glyph swaps, so the noise reads as cycling, not static. */
const SWAP = 0.04;

export type ScrambleTextProps = {
  text: string;
  /** "view": once, when it scrolls into view (default). "mount": straight away, and again on every text change. */
  trigger?: "view" | "mount";
  /** Seconds for the whole effect. */
  duration?: number;
  className?: string;
};

function randomGlyph() {
  return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
}

/**
 * SF Mono text whose characters cycle randomly, then resolve left to right (about 600 ms).
 * Monospace keeps every character the same width, so nothing shifts. Screen readers get the
 * real text from a visually hidden copy; the animated text is aria-hidden.
 * Reduced motion: no scramble.
 */
export function ScrambleText({
  text,
  trigger = "view",
  duration = 0.6,
  className,
}: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced || text.length === 0) return;

      const chars = [...text];
      const state = { p: 0 };
      let noise = chars.map((c) => (c === " " ? " " : randomGlyph()));
      let lastSwap = -1;

      const tween = gsap.to(state, {
        p: 1,
        duration,
        ease: "none",
        paused: true,
        onUpdate() {
          const t = tween.time();
          if (t - lastSwap >= SWAP) {
            noise = chars.map((c) => (c === " " ? " " : randomGlyph()));
            lastSwap = t;
          }
          const resolved = Math.floor(
            Math.max(0, (state.p - HOLD) / (1 - HOLD)) * chars.length,
          );
          writeText(
            el,
            chars.map((c, i) => (i < resolved ? c : noise[i])).join(""),
          );
        },
        onComplete: () => writeText(el, text),
      });

      if (trigger === "mount") {
        tween.play();
      } else {
        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () => tween.play(),
        });
      }

      return () => writeText(el, text);
    },
    {
      dependencies: [text, trigger, duration, reduced],
      revertOnUpdate: true,
    },
  );

  return (
    <span className={cn("font-mono", className)}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden className="whitespace-pre">
        {text}
      </span>
    </span>
  );
}
