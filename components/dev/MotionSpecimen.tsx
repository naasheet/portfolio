"use client";

import { MotionConfig, m, type Transition } from "framer-motion";
import { useRef, useState } from "react";
import {
  duration,
  durationS,
  easeOutPoints,
  spring,
} from "@/lib/motion/tokens";

const BOX = 40; // px

const ROWS: { label: string; detail: string; transition: Transition }[] = [
  {
    label: "fast",
    detail: `${duration.fast} ms · ease-out`,
    transition: { duration: durationS.fast, ease: easeOutPoints },
  },
  {
    label: "base",
    detail: `${duration.base} ms · ease-out`,
    transition: { duration: durationS.base, ease: easeOutPoints },
  },
  {
    label: "slow",
    detail: `${duration.slow} ms · ease-out`,
    transition: { duration: durationS.slow, ease: easeOutPoints },
  },
  {
    label: "snappy",
    detail: `spring ${spring.snappy.stiffness} / ${spring.snappy.damping}`,
    transition: spring.snappy,
  },
  {
    label: "soft",
    detail: `spring ${spring.soft.stiffness} / ${spring.soft.damping}`,
    transition: spring.soft,
  },
  {
    label: "gentle",
    detail: `spring ${spring.gentle.stiffness} / ${spring.gentle.damping}`,
    transition: spring.gentle,
  },
];

/**
 * One box per duration and spring, all moving the same distance on "Play".
 * Only transform animates. MotionConfig "user" makes the boxes jump under reduced motion.
 */
export function MotionSpecimen() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);

  const play = () => {
    const width = trackRef.current?.clientWidth ?? 0;
    setX((current) => (current === 0 ? Math.max(0, width - BOX) : 0));
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={play}
          className="self-start rounded-control bg-accent-primary px-4 py-2 text-subhead font-semibold text-accent-contrast transition-[transform,background-color] duration-150 ease-out hover:bg-accent-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus active:scale-[0.97]"
        >
          {x === 0 ? "Play" : "Play back"}
        </button>
        <ul className="flex flex-col gap-4">
          {ROWS.map(({ label, detail, transition }, i) => (
            <li
              key={label}
              className="grid gap-2 md:grid-cols-[176px_1fr] md:items-center md:gap-6"
            >
              <div className="flex flex-col">
                <code className="text-footnote font-mono text-accent-primary">
                  {label}
                </code>
                <span className="text-caption-2 font-mono text-text-tertiary">
                  {detail}
                </span>
              </div>
              <div
                ref={i === 0 ? trackRef : undefined}
                className="relative h-10 rounded-control bg-surface-glass"
              >
                <m.div
                  className="size-10 rounded-control bg-accent-primary"
                  animate={{ x }}
                  transition={transition}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </MotionConfig>
  );
}
