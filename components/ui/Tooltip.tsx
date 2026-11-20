"use client";

import { AnimatePresence, m } from "framer-motion";
import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { durationS, easeOutPoints } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

const HOVER_DELAY_MS = 300;

export type TooltipSide = "top" | "bottom";

export type TooltipProps = {
  /** Tooltip text; may include a Kbd. */
  content: ReactNode;
  /** One focusable element. It gets aria-describedby pointing at the tooltip. */
  children: ReactElement<{ "aria-describedby"?: string }>;
  side?: TooltipSide;
  /** "end" lines the bubble up with the trigger's right edge (controls near the right of the screen). */
  align?: "center" | "end";
  /** Show it regardless of hover or focus (e.g. the nav's first-visit sound hint). */
  forceOpen?: boolean;
  className?: string;
};

/**
 * Opens 300 ms after a mouse hover, or straight away on keyboard focus. Esc closes it.
 * The tooltip is hoverable (it sits inside the hover area), so it doesn't vanish when the
 * pointer moves onto it. Its text is always in the DOM for aria-describedby; the animated
 * bubble is visual only.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  forceOpen = false,
  className,
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const clearTimer = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  };

  useEffect(() => clearTimer, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimer();
    timer.current = window.setTimeout(() => setOpen(true), HOVER_DELAY_MS);
  };

  const onPointerLeave = () => {
    clearTimer();
    setOpen(false);
  };

  const onFocus = (e: FocusEvent) => {
    if (!(e.target instanceof Element) || !e.target.matches(":focus-visible"))
      return;
    clearTimer();
    setOpen(true);
  };

  const onBlur = () => {
    clearTimer();
    setOpen(false);
  };

  const top = side === "top";
  const describedBy = [children.props["aria-describedby"], id]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {cloneElement(children, { "aria-describedby": describedBy })}
      <span id={id} role="tooltip" className="sr-only">
        {content}
      </span>
      <AnimatePresence>
        {open || forceOpen ? (
          <m.span
            aria-hidden
            // The padding bridges the gap, so moving onto the tooltip keeps it open.
            className={cn(
              "absolute z-overlay flex",
              align === "end" ? "right-0" : "left-1/2 -translate-x-1/2",
              top ? "bottom-full pb-2" : "top-full pt-2",
            )}
            initial={{ opacity: 0, y: top ? 4 : -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: top ? 4 : -4, scale: 0.96 }}
            transition={{ duration: durationS.fast, ease: easeOutPoints }}
          >
            <span
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-control border border-border-default bg-surface-solid px-2 text-footnote whitespace-nowrap text-text-primary shadow-overlay",
                className,
              )}
            >
              {content}
            </span>
          </m.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
