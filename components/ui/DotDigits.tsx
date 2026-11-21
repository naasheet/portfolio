"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/** 3 × 5 dot patterns, row by row (1 = lit). */
const GLYPHS: Record<string, string> = {
  "0": "111101101101111",
  "1": "010110010010111",
  "2": "111001111100111",
  "3": "111001111001111",
  "4": "101101111001001",
  "5": "111100111001111",
  "6": "111100111101111",
  "7": "111001001001001",
  "8": "111101111101111",
  "9": "111101111001111",
};

export type DotDigitsProps = {
  value: number;
  /** At least this many digits, zero-padded ("05"). Default 2. */
  digits?: number;
  /** Count up from 0 once, when it scrolls into view. Default true. */
  countUp?: boolean;
  className?: string;
};

const pad = (n: number, digits: number) =>
  String(Math.max(0, Math.round(n))).padStart(digits, "0");

function paint(root: HTMLElement, text: string) {
  const cells = root.querySelectorAll<HTMLElement>("[data-dot]");
  for (const cell of cells) {
    const d = Number(cell.dataset.digit);
    const i = Number(cell.dataset.dot);
    const lit = GLYPHS[text[d] ?? "0"]?.[i] === "1";
    if (lit) cell.dataset.on = "";
    else delete cell.dataset.on;
  }
}

/**
 * A number in 3 × 5 dot digits (About frame, 4.3): lit dots teal with a soft glow, unlit at 7%.
 * Counts up once when it scrolls into view, by toggling the dots' data-on from one GSAP tween
 * (no React re-renders). Reduced motion and the server render the final number. The real number
 * is in an sr-only span; the dots are aria-hidden.
 */
export function DotDigits({ value, digits = 2, countUp = true, className }: DotDigitsProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const text = pad(value, digits);
  const width = Math.max(digits, text.length);

  useEffect(() => {
    const root = ref.current;
    if (!root || !countUp) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const counter = { v: 0 };
    paint(root, pad(0, width));
    const tween = gsap.to(counter, {
      v: value,
      duration: Math.min(1.2, 0.4 + value * 0.04),
      ease: "power2.out",
      paused: true,
      onUpdate: () => paint(root, pad(counter.v, width)),
    });
    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top 90%",
      once: true,
      onEnter: () => tween.play(),
    });
    return () => {
      trigger.kill();
      tween.kill();
      paint(root, text);
    };
  }, [value, width, countUp, text]);

  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span className="sr-only">{value}</span>
      <span ref={ref} aria-hidden className="flex gap-4">
        {Array.from({ length: width }, (_, d) => (
          <span key={d} className="grid grid-cols-3 gap-1">
            {Array.from({ length: 15 }, (_, i) => (
              <span
                key={i}
                data-dot={i}
                data-digit={d}
                data-on={GLYPHS[text[d] ?? "0"]?.[i] === "1" ? "" : undefined}
                className="dot-digit size-2.5 rounded-chip"
              />
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}
