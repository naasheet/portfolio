"use client";

import { m } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { copy } from "@/content/copy";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import {
  colorTransition,
  disabledState,
  focusRing,
  type MotionConflicts,
} from "./controlStyles";

const MotionLink = m.create(Link);

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-accent-primary text-accent-contrast hover:bg-accent-primary-hover",
  secondary:
    "border-border-default bg-glass-fill text-text-primary hover:border-text-tertiary hover:bg-surface-glass",
  ghost:
    "border-transparent bg-transparent text-text-primary hover:bg-surface-glass",
};

// Heights 36 / 44 / 52 come from the component sheet.
const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-footnote",
  md: "h-11 px-6 text-subhead",
  lg: "h-13 px-6 text-body",
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };
const ICON_CLASS: Record<ButtonSize, string> = {
  sm: "[&_svg]:size-3.5",
  md: "[&_svg]:size-4",
  lg: "[&_svg]:size-4.5",
};

type OwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon before the label. Pass a lucide icon element; sizing is handled here. */
  leadingIcon?: ReactNode;
  /** Icon after the label. */
  trailingIcon?: ReactNode;
  /** Hides the label (keeping its width) and shows a centred spinner. Clicks are ignored. */
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

type AsButton = OwnProps &
  Omit<ComponentPropsWithRef<"button">, keyof OwnProps | MotionConflicts> & {
    href?: undefined;
  };

type AsLink = OwnProps &
  Omit<
    ComponentPropsWithRef<"a">,
    keyof OwnProps | MotionConflicts | "href"
  > & {
    /** Renders a next/link with the same look. */
    href: string;
  };

export type ButtonProps = AsButton | AsLink;

/** The main action control: primary, secondary or ghost, in three sizes. */
export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    leadingIcon,
    trailingIcon,
    loading = false,
    disabled = false,
    children,
    className,
    ...rest
  } = props;

  const iconSize = ICON_SIZE[size];
  const inactive = disabled || loading;

  const classes = cn(
    "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control border font-semibold whitespace-nowrap select-none",
    "[&_svg]:shrink-0",
    colorTransition,
    focusRing,
    disabledState,
    // Loading isn't dimmed (sheet): only disabled is.
    loading &&
      "cursor-progress aria-disabled:cursor-progress aria-disabled:opacity-100",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  const content = (
    <>
      <span
        className={cn(
          "inline-flex items-center gap-2",
          ICON_CLASS[size],
          loading && "opacity-0",
        )}
      >
        {leadingIcon ? (
          <span aria-hidden className="inline-flex">
            {leadingIcon}
          </span>
        ) : null}
        {children}
        {trailingIcon ? (
          <span aria-hidden className="inline-flex">
            {trailingIcon}
          </span>
        ) : null}
      </span>
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoaderCircle aria-hidden size={iconSize} className="animate-spin" />
          <span className="sr-only">{copy.ui.loading}</span>
        </span>
      ) : null}
    </>
  );

  const tap = inactive ? undefined : { scale: 0.97 };

  // A disabled or loading link can't navigate, so it renders as a button.
  if (rest.href !== undefined && !inactive) {
    const { href, ...linkRest } = rest as Omit<AsLink, keyof OwnProps>;
    return (
      <MotionLink
        href={href}
        {...linkRest}
        className={classes}
        whileTap={tap}
        transition={spring.snappy}
      >
        {content}
      </MotionLink>
    );
  }

  const {
    type = "button",
    onClick,
    ...buttonRest
  } = rest as Omit<AsButton, keyof OwnProps>;
  // A disabled link falls back to a button; drop its href.
  delete (buttonRest as { href?: string }).href;

  return (
    <m.button
      type={type}
      {...buttonRest}
      // Loading stays focusable (aria-disabled); disabled leaves the tab order.
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      className={classes}
      whileTap={tap}
      transition={spring.snappy}
    >
      {content}
    </m.button>
  );
}
