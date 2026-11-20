"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { writeText } from "@/lib/motion/writeText";
import { useReducedMotion } from "./useReducedMotion";

export type CountUpOptions = {
  /** Seconds. */
  duration?: number;
  /** Digits after the decimal point. */
  decimals?: number;
};

/** The formatter the hook uses, so the server-rendered text matches what it writes. */
export function formatCount(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Counts a number up from 0 once, when its element enters view. Render the final value as the
 * element's only child (`{formatCount(value)}`), so it's right without JS, and give the element
 * `tabular-nums`. On mount the hook locks the element's width to the final value's, so the digits
 * never shift the layout, then writes each frame straight to the DOM (no React state).
 * Reduced motion: the final value stays as rendered.
 */
export function useCountUp<T extends HTMLElement>(
  value: number,
  { duration = 1.2, decimals = 0 }: CountUpOptions = {},
) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;

      const final = formatCount(value, decimals);
      writeText(el, final);
      if (getComputedStyle(el).display === "inline") {
        el.style.display = "inline-block";
      }
      el.style.minWidth = `${el.getBoundingClientRect().width}px`;

      const counter = { v: 0 };
      writeText(el, formatCount(0, decimals));
      gsap.to(counter, {
        v: value,
        duration,
        ease: "power2.out",
        onUpdate: () => writeText(el, formatCount(counter.v, decimals)),
        onComplete: () => writeText(el, final),
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });

      return () => {
        writeText(el, final);
        el.style.minWidth = "";
        el.style.display = "";
      };
    },
    {
      dependencies: [value, duration, decimals, reduced],
      revertOnUpdate: true,
    },
  );

  return ref;
}
