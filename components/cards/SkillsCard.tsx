"use client";

import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { focusRing } from "@/components/ui/controlStyles";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { durationS, easeOutPoints } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { CardEyebrow } from "./CardEyebrow";

const SWIPE_PX = 40;

export type SkillArea = { name: string; skills: string[] };

export type SkillsCardProps = {
  eyebrow: string;
  areas: SkillArea[];
  labels: {
    /** Accessible name of the carousel region. */
    region: string;
    prev: string;
    next: string;
    /** Hint under the skills, e.g. "← → keys when focused · swipe on touch". */
    hint: string;
  };
  className?: string;
};

/**
 * Skills grouped by area, one area per page. Arrows, ←/→ while the card body has focus, or a
 * horizontal swipe on touch move between pages; pages slide in from the side they came from.
 */
export function SkillsCard({
  eyebrow,
  areas,
  labels,
  className,
}: SkillsCardProps) {
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  const swipeStart = useRef<number | null>(null);
  const count = areas.length;
  const area = areas[index];

  const go = (delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= count) return;
    setPage([next, delta]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    swipeStart.current = e.pointerType === "mouse" ? null : e.clientX;
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) >= SWIPE_PX) go(dx < 0 ? 1 : -1);
  };

  if (!area) return null;

  return (
    <Card className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <CardEyebrow className="text-caption-1">{eyebrow}</CardEyebrow>
          <h3 className="text-title-3 font-semibold" aria-live="polite">
            {area.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-caption-1 text-text-secondary tabular-nums">
            {index + 1} / {count}
          </span>
          <IconButton
            aria-label={labels.prev}
            icon={<ArrowLeft />}
            disabled={index === 0}
            onClick={() => go(-1)}
          />
          <IconButton
            aria-label={labels.next}
            icon={<ArrowRight />}
            disabled={index === count - 1}
            onClick={() => go(1)}
          />
        </div>
      </div>

      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={labels.region}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeStart.current = null)}
        className={cn(
          "relative flex-1 touch-pan-y overflow-hidden rounded-control",
          focusRing,
        )}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <m.ul
            key={index}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d * 24, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d * -24, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: durationS.base, ease: easeOutPoints }}
            className="flex flex-wrap content-start gap-2"
          >
            {area.skills.map((skill) => (
              <li
                key={skill}
                className="inline-flex h-6 items-center rounded-chip border border-border-default px-2 text-caption-1 text-text-secondary"
              >
                {skill}
              </li>
            ))}
          </m.ul>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-caption-2 text-text-tertiary">{labels.hint}</span>
        <span aria-hidden className="flex items-center gap-1">
          {areas.map((a, i) => (
            <span
              key={a.name}
              className={cn(
                "h-1.5 rounded-chip transition-colors duration-250 ease-out",
                i === index
                  ? "w-4 bg-accent-primary"
                  : "w-1.5 bg-text-tertiary",
              )}
            />
          ))}
        </span>
      </div>
    </Card>
  );
}
