"use client";

import { m } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { arCopy } from "@/content/ar";
import { coachStepDone, onGesture } from "@/features/ar/gestures";
import { storage } from "@/lib/browser";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { HandSkeleton } from "./HandSkeleton";

const t = arCopy.coach;
/** Saved once the tour is finished or skipped: it runs only the first time Hand mode starts. */
export const COACH_KEY = "ar-coach";

export const coachSeen = () => storage.get(COACH_KEY) === "1";

/** The step's drawing: the pose, plus the amber pinch ring or the drag arrow (AR board, Coach). */
function CoachDrawing({ pose }: { pose: "point" | "pinch" | "drag" }) {
  return (
    <span className="relative flex h-32 items-center justify-center rounded-control border border-island-border bg-island-bg">
      <span className="relative size-24">
        <HandSkeleton pose={pose === "point" ? "point" : "pinch"} />
        {pose !== "point" ? (
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            className="absolute inset-0 size-full overflow-visible"
          >
            {pose === "pinch" ? (
              <circle
                cx={30}
                cy={36}
                r={13}
                fill="none"
                strokeWidth={2}
                className="stroke-accent-secondary"
              />
            ) : (
              <path
                d="M 84 70 Q 104 46 86 18 M 86 18 l -7 3 M 86 18 l 2 7"
                fill="none"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray="4 5"
                className="stroke-accent-secondary"
              />
            )}
          </svg>
        ) : null}
      </span>
    </span>
  );
}

/**
 * The first-time tour of Hand mode (8.4, AR board "Coach: three steps the first time"): a solid
 * card centred near the bottom. Each step waits until the visitor does its gesture once (the
 * gesture driver's onGesture: point, pinch-click, pinch-drag), then Next lights up. Skip ends it;
 * finishing or skipping saves `ar-coach`, so it shows once. Not modal: the page works underneath,
 * which is how the visitor practises (pinching Next works too).
 */
export function ARCoach({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const last = step === t.steps.length - 1;
  const current = t.steps[step]!;

  useEffect(
    () =>
      onGesture((event) => {
        if (coachStepDone(step, event)) setDone(true);
      }),
    [step],
  );

  const finish = () => {
    storage.set(COACH_KEY, "1");
    onClose();
  };
  const next = () => {
    if (last) {
      finish();
      return;
    }
    setStep(step + 1);
    setDone(false);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(24px,env(safe-area-inset-bottom))] flex justify-center px-4">
      <m.section
        aria-label={t.label}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.soft}
        className="pointer-events-auto flex w-90 max-w-full flex-col gap-4 rounded-card border border-border-default bg-surface-solid p-4 shadow-overlay"
      >
        <div className="flex items-center justify-between">
          <span className="text-caption-2 font-mono tracking-wide text-text-tertiary uppercase">
            {t.step(step + 1, t.steps.length)}
          </span>
          <span aria-hidden className="flex gap-1">
            {t.steps.map((s, i) => (
              <span
                key={s.title}
                className={cn(
                  "h-1 rounded-chip",
                  i === step
                    ? "w-4 bg-accent-primary"
                    : i < step
                      ? "w-2 bg-accent-primary"
                      : "w-2 bg-border-default",
                )}
              />
            ))}
          </span>
        </div>
        <CoachDrawing pose={current.pose} />
        <div aria-live="polite" className="flex flex-col gap-1">
          <h2 className="text-title-3 font-semibold text-text-primary">
            {current.title}
          </h2>
          <p className="text-subhead text-text-secondary">{current.body}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish}>
            {t.skip}
          </Button>
          <span className="flex items-center gap-2">
            {done ? null : (
              <span className="text-caption-1 text-text-tertiary">
                {t.waiting}
              </span>
            )}
            <Button size="sm" disabled={!done} onClick={next}>
              {last ? t.done : t.next}
            </Button>
          </span>
        </div>
      </m.section>
    </div>
  );
}
