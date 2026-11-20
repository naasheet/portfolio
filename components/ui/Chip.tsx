"use client";

import { m } from "framer-motion";
import { Check } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { spring } from "@/lib/motion/tokens";
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
  /** Optional count after the label ("All 9"). */
  count?: number;
  children: ReactNode;
  className?: string;
};

export type ChipProps = OwnProps &
  Omit<
    ComponentPropsWithRef<"button">,
    keyof OwnProps | MotionConflicts | "aria-pressed"
  >;

/** A selectable filter pill. Selected adds a check, a teal tint and a teal border. */
export function Chip({
  selected = false,
  count,
  disabled = false,
  type = "button",
  children,
  className,
  ...rest
}: ChipProps) {
  return (
    <m.button
      type={type}
      {...rest}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-chip border border-border-default bg-glass-fill px-4 text-subhead text-text-secondary select-none",
        "hover:border-text-tertiary hover:text-text-primary",
        "aria-pressed:border-accent-primary aria-pressed:bg-accent-primary/15 aria-pressed:text-text-primary aria-pressed:hover:bg-accent-primary/25",
        colorTransition,
        focusRing,
        disabledState,
        className,
      )}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={spring.snappy}
    >
      {selected ? <Check aria-hidden className="size-3.5 shrink-0" /> : null}
      <span>{children}</span>
      {count !== undefined ? (
        <span className="text-caption-1 text-text-tertiary tabular-nums">
          {count}
        </span>
      ) : null}
    </m.button>
  );
}
