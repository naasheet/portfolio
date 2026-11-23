"use client";

import { Hand, MousePointer2 } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { useEffect, useId, useState } from "react";
import { useCameraDetection } from "@/components/ar/useCameraDetection";
import { copy } from "@/content/copy";
import { colorTransition, focusRing } from "@/components/ui/controlStyles";
import { spring } from "@/lib/motion/tokens";
import { useIsTouch } from "@/lib/hooks/useIsTouch";
import { setHandMode } from "@/lib/shortcuts";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { navHeight } from "./navStyles";

const OPTIONS = [
  { hand: false, label: copy.nav.mouse, Icon: MousePointer2 },
  { hand: true, label: copy.nav.hand, Icon: Hand },
] as const;

/** How long the phone tip stays up. */
const TIP_MS = 2500;

/**
 * Mouse | Hand. Hand is the AR toggle (shortcut A, setHandMode): it opens the camera explainer
 * (8.1), or turns Hand on directly once the camera was allowed before. The current option is a
 * solid light pill that slides across.
 *
 * AR board, edge states: with no camera at all the switch is hidden; on phones (touch) Hand stays
 * off, is shown disabled, and tapping it shows "Best on a laptop" under the switch.
 */
export function ModeSwitch({
  compact = false,
  className,
}: {
  /** Tighter pills (the phone menu's control row). */
  compact?: boolean;
  className?: string;
}) {
  useCameraDetection();
  const handOn = useStore((s) => s.ar.enabled);
  const noCamera = useStore((s) => s.ar.camera === "none");
  const touch = useIsTouch();
  const pillId = useId();
  const tipId = useId();
  const [tip, setTip] = useState(false);

  useEffect(() => {
    if (!tip) return;
    const timer = setTimeout(() => setTip(false), TIP_MS);
    return () => clearTimeout(timer);
  }, [tip]);

  if (noCamera) return null;

  return (
    <div
      role="group"
      aria-label={copy.nav.mode}
      className={cn(
        "relative flex items-center gap-1 rounded-chip glass p-1",
        navHeight,
        className,
      )}
    >
      {OPTIONS.map(({ hand, label, Icon }) => {
        const current = handOn === hand;
        // Phones: Hand is off for good; a tap explains why instead.
        const unavailable = hand && touch;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={current}
            aria-disabled={unavailable || undefined}
            aria-describedby={unavailable ? tipId : undefined}
            data-cursor="orbit"
            onClick={() => (unavailable ? setTip(true) : setHandMode(hand))}
            className={cn(
              "relative flex h-full cursor-pointer items-center rounded-chip text-subhead select-none",
              compact ? "px-3" : "px-4",
              current
                ? "text-bg-base"
                : "text-text-secondary hover:text-text-primary",
              unavailable && "opacity-40 hover:text-text-secondary",
              colorTransition,
              focusRing,
            )}
          >
            {current ? (
              <m.span
                aria-hidden
                layoutId={pillId}
                className="absolute inset-0 rounded-chip bg-text-primary"
                transition={spring.snappy}
              />
            ) : null}
            <span className="relative flex items-center gap-2 [&_svg]:size-4">
              <Icon aria-hidden />
              {label}
            </span>
          </button>
        );
      })}
      {touch ? (
        <span id={tipId} className="sr-only">
          {copy.alerts.bestOnLaptop}
        </span>
      ) : null}
      <AnimatePresence>
        {tip ? (
          // Under the switch in the nav; above it in the phone menu, where the switch sits at
          // the bottom (Get in touch is right below).
          <m.span
            aria-hidden
            initial={{ opacity: 0, y: compact ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: compact ? 4 : -4 }}
            transition={spring.snappy}
            style={{ x: "-50%" }}
            className={cn(
              "pointer-events-none absolute left-1/2 rounded-chip border border-border-default bg-surface-solid px-3 py-1.5 text-footnote whitespace-nowrap text-text-secondary shadow-lift",
              compact ? "bottom-full mb-2" : "top-full mt-2",
            )}
          >
            {copy.alerts.bestOnLaptop}
          </m.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
