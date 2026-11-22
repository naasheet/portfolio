"use client";

import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { focusRing } from "@/components/ui/controlStyles";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { Kbd } from "@/components/ui/Kbd";
import { LevelDots } from "@/components/ui/LevelDots";
import { durationS, easeOutPoints } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { CardEyebrow } from "./CardEyebrow";

const SWIPE_PX = 40;

/** A plain skill (a pill) or a rated one (a row with dots and years, 4.6). */
export type SkillItem =
  string | { name: string; level?: number; years?: number };

export type SkillArea = {
  name: string;
  /** One line under the name (rated layout). */
  summary?: string;
  skills: readonly SkillItem[];
};

export type SkillsCardProps = {
  /** Small label above the area name (pills layout). */
  eyebrow?: string;
  areas: readonly SkillArea[];
  /**
   * "pills" (1.4, default): skills as pills. "rated" (4.6, Skills frames): a big area name and
   * summary, skills as rows with level dots and years (two columns from md), area chips and a
   * "← → or swipe" hint (md up), page dots and "Swipe for the next area" (phones).
   */
  variant?: "pills" | "rated";
  labels: {
    /** Accessible name of the carousel region. */
    region: string;
    prev: string;
    next: string;
    /** Hint under the skills: pills layout, and the rated layout on md up ("or swipe"). */
    hint: string;
    /** Rated layout, phones: "Swipe for the next area". */
    swipeHint?: string;
    /** Rated layout: the dots' accessible text ("4 of 5", "Not rated yet"). */
    level?: (level: number | undefined) => string;
    /** Rated layout: "4 yrs". */
    years?: (years: number) => string;
    /** Rated layout: the chip row's accessible name. */
    areas?: string;
  };
  className?: string;
};

const skillName = (s: SkillItem) => (typeof s === "string" ? s : s.name);

/**
 * Skills grouped by area, one area per page, with an "n / N" counter. Arrows, ←/→ while the
 * card body has focus, a horizontal swipe on touch, or (rated, md up) the area chips move
 * between pages; pages slide in from the side they came from.
 */
export function SkillsCard({
  eyebrow,
  areas,
  variant = "pills",
  labels,
  className,
}: SkillsCardProps) {
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  const swipeStart = useRef<number | null>(null);
  const count = areas.length;
  const area = areas[index];
  const rated = variant === "rated";

  const goTo = (next: number) => {
    if (next < 0 || next >= count || next === index) return;
    setPage([next, next > index ? 1 : -1]);
  };
  const go = (delta: number) => goTo(index + delta);

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

  // Rated: reserve the tallest area's rows (56 px each), so paging never changes the card's height.
  const most = Math.max(...areas.map((a) => a.skills.length));
  const rows = {
    "--rows-sm": most,
    "--rows-md": Math.ceil(most / 2),
  } as CSSProperties;

  const counter = (
    <span className="text-footnote font-mono text-text-secondary tabular-nums">
      {index + 1} / {count}
    </span>
  );

  const arrows = (
    <>
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
    </>
  );

  const dots = (
    <span aria-hidden className="flex items-center gap-1">
      {areas.map((a, i) => (
        <span
          key={a.name}
          className={cn(
            "h-1.5 rounded-chip transition-colors duration-250 ease-out",
            i === index ? "w-4 bg-accent-primary" : "w-1.5 bg-text-tertiary",
          )}
        />
      ))}
    </span>
  );

  return (
    <Card
      className={cn("flex flex-col gap-4", rated && "gap-6 md:p-8", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow ? (
            <CardEyebrow className="text-caption-1">{eyebrow}</CardEyebrow>
          ) : null}
          <h3
            className={cn(
              rated
                ? "text-title-1 font-bold md:text-large-title"
                : "text-title-3 font-semibold",
            )}
            aria-live="polite"
          >
            {area.name}
          </h3>
          {rated && area.summary ? (
            <p className="text-subhead text-text-secondary">{area.summary}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {counter}
          {rated ? (
            <span className="hidden items-center gap-2 md:flex">{arrows}</span>
          ) : (
            arrows
          )}
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
        style={rated ? rows : undefined}
        className={cn(
          "relative flex-1 touch-pan-y overflow-hidden rounded-control",
          rated &&
            "min-h-[calc(var(--rows-sm)*3.5rem)] md:min-h-[calc(var(--rows-md)*3.5rem)]",
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
            className={
              rated
                ? "grid content-start md:grid-cols-2 md:gap-x-12"
                : "flex flex-wrap content-start gap-2"
            }
          >
            {area.skills.map((skill, i) =>
              rated ? (
                <li
                  key={`${skillName(skill)}-${i}`}
                  className="flex h-14 items-center justify-between gap-4 border-b border-border-default"
                >
                  <span className="truncate text-body text-text-primary">
                    {skillName(skill)}
                  </span>
                  <span className="flex shrink-0 items-center gap-4">
                    <LevelDots
                      level={
                        typeof skill === "string" ? undefined : skill.level
                      }
                      label={
                        labels.level?.(
                          typeof skill === "string" ? undefined : skill.level,
                        ) ?? ""
                      }
                    />
                    {typeof skill !== "string" &&
                    skill.years !== undefined &&
                    labels.years ? (
                      <span className="hidden w-14 text-right text-footnote font-mono text-text-tertiary tabular-nums md:inline">
                        [{labels.years(skill.years)}]
                      </span>
                    ) : null}
                  </span>
                </li>
              ) : (
                <li
                  key={`${skillName(skill)}-${i}`}
                  className="inline-flex h-6 items-center rounded-chip border border-border-default px-2 text-caption-1 text-text-secondary"
                >
                  {skillName(skill)}
                </li>
              ),
            )}
          </m.ul>
        </AnimatePresence>
      </div>

      {rated ? (
        <>
          <div className="hidden items-center justify-between gap-4 md:flex">
            <div
              role="group"
              aria-label={labels.areas}
              className="flex flex-wrap gap-2"
            >
              {areas.map((a, i) => (
                <Chip
                  key={a.name}
                  tone="solid"
                  selected={i === index}
                  onClick={() => goTo(i)}
                  className="h-8 px-3 text-footnote"
                >
                  {a.name}
                </Chip>
              ))}
            </div>
            <span className="flex shrink-0 items-center gap-1 text-caption-1 text-text-tertiary">
              <Kbd>←</Kbd>
              <Kbd>→</Kbd>
              <span className="ml-1">{labels.hint}</span>
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 md:hidden">
            {dots}
            <span className="text-caption-1 text-text-tertiary">
              {labels.swipeHint}
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <span className="text-caption-2 text-text-tertiary">
            {labels.hint}
          </span>
          {dots}
        </div>
      )}
    </Card>
  );
}
