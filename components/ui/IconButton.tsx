"use client";

import { m } from "framer-motion";
import { useRef, type ComponentPropsWithRef, type ReactNode } from "react";
import { spring } from "@/lib/motion/tokens";
import { useMagnetic } from "@/lib/hooks/useMagnetic";
import { cn, mergeRefs } from "@/lib/utils";
import {
  colorTransition,
  disabledState,
  focusRing,
  type MotionConflicts,
} from "./controlStyles";

type OwnProps = {
  /** Required: icon-only controls have no visible name. */
  "aria-label": string;
  /** A lucide icon element; sized here. */
  icon: ReactNode;
  /** Toggle buttons: sets aria-pressed and the teal active look. */
  pressed?: boolean;
  /** Optional visible label next to the icon (the AR toggle). */
  label?: ReactNode;
  /** A small teal dot after the label, e.g. "AR is live". */
  indicator?: boolean;
  /** Drift toward the pointer (Cursor board). Default true. */
  magnetic?: boolean;
  className?: string;
};

export type IconButtonProps = OwnProps &
  Omit<
    ComponentPropsWithRef<"button">,
    keyof OwnProps | MotionConflicts | "children"
  >;

/** 44 × 44 icon control, radius 12 (the same as Button). */
export function IconButton({
  icon,
  pressed,
  label,
  indicator = false,
  magnetic = true,
  disabled = false,
  type = "button",
  className,
  ref,
  ...rest
}: IconButtonProps) {
  const own = useRef<HTMLButtonElement | null>(null);
  useMagnetic(own, {}, magnetic && !disabled);
  return (
    <m.button
      type={type}
      data-cursor={disabled ? undefined : "orbit"}
      {...rest}
      ref={mergeRefs(own, ref)}
      disabled={disabled}
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control border border-border-default bg-glass-fill text-text-primary select-none",
        "hover:border-text-tertiary hover:bg-surface-glass",
        "aria-pressed:border-accent-primary aria-pressed:bg-accent-primary/15 aria-pressed:hover:bg-accent-primary/25",
        "[&_svg]:size-4.5 [&_svg]:shrink-0",
        label ? "px-4 text-subhead font-semibold" : "w-11",
        magnetic && "magnetic",
        colorTransition,
        focusRing,
        disabledState,
        className,
      )}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={spring.snappy}
    >
      <span aria-hidden className="inline-flex">
        {icon}
      </span>
      {label ? <span>{label}</span> : null}
      {indicator ? (
        <span aria-hidden className="size-2 rounded-chip bg-status-success" />
      ) : null}
    </m.button>
  );
}
