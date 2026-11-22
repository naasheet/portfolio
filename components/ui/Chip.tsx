"use client";

import { m } from "framer-motion";
import { Check } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { spring } from "@/lib/motion/tokens";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";
import {
  colorTransition,
  disabledState,
  focusRing,
  type MotionConflicts,
} from "./controlStyles";

type OwnProps = {
  /** Selected state, exposed as aria-pressed. */
  selected?: boolean;
  /**
   * The selected look. "tint" (default): a check, a teal tint and a teal border. "solid": a solid
   * light pill with no check, like the nav's current item (Work's filters, Skills' areas; 4.4).
   */
  tone?: "tint" | "solid";
  /** Optional count after the label ("All 9"). */
  count?: number;
  /** Hover and toggle UI sounds (only ever audible when sound is on). Default true. */
  sound?: boolean;
  children: ReactNode;
  className?: string;
};

export type ChipProps = OwnProps &
  Omit<
    ComponentPropsWithRef<"button">,
    keyof OwnProps | MotionConflicts | "aria-pressed"
  >;

/** A selectable filter pill. Selected adds a check, a teal tint and a teal border (or, with
 * `tone="solid"`, turns into a solid light pill). */
export function Chip({
  selected = false,
  tone = "tint",
  count,
  sound = true,
  disabled = false,
  type = "button",
  children,
  className,
  onPointerEnter,
  onClick,
  ...rest
}: ChipProps) {
  return (
    <m.button
      type={type}
      data-cursor={disabled ? undefined : "orbit"}
      {...rest}
      onPointerEnter={(e) => {
        if (sound && !disabled && e.pointerType === "mouse") sfx("hover");
        onPointerEnter?.(e);
      }}
      onClick={(e) => {
        // The sound says what the click does: selecting or deselecting.
        if (sound && !disabled) sfx(selected ? "toggleOff" : "toggleOn");
        onClick?.(e);
      }}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-chip border border-border-default bg-glass-fill px-4 text-subhead text-text-secondary select-none",
        "hover:border-text-tertiary hover:text-text-primary",
        tone === "tint"
          ? "aria-pressed:border-accent-primary aria-pressed:bg-accent-primary/15 aria-pressed:text-text-primary aria-pressed:hover:bg-accent-primary/25"
          : "aria-pressed:border-text-primary aria-pressed:bg-text-primary aria-pressed:text-bg-base aria-pressed:hover:border-text-primary aria-pressed:hover:text-bg-base",
        colorTransition,
        focusRing,
        disabledState,
        className,
      )}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={spring.snappy}
    >
      {selected && tone === "tint" ? <Check aria-hidden className="size-3.5 shrink-0" /> : null}
      <span>{children}</span>
      {count !== undefined ? (
        <span className="text-caption-1 text-text-tertiary tabular-nums">
          {count}
        </span>
      ) : null}
    </m.button>
  );
}
