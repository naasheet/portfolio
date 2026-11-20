"use client";

import { m } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import {
  useRef,
  type ComponentPropsWithRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { copy } from "@/content/copy";
import { useMagnetic } from "@/lib/hooks/useMagnetic";
import { spring } from "@/lib/motion/tokens";
import { sfx } from "@/lib/sfx";
import { cn, mergeRefs } from "@/lib/utils";
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
  /** Hover and click UI sounds (only ever audible when sound is on). Default true. */
  sound?: boolean;
  /** Drift toward the pointer (Cursor board). Default: primary buttons only. */
  magnetic?: boolean;
  /** Name tag on the cursor's selection box. Defaults to the control's kind (content/copy.ts). */
  cursorLabel?: string;
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
    sound = true,
    magnetic = variant === "primary",
    cursorLabel,
    children,
    className,
    ...rest
  } = props;

  const iconSize = ICON_SIZE[size];
  const inactive = disabled || loading;

  const own = useRef<HTMLElement | null>(null);
  useMagnetic(own, {}, magnetic && !inactive);

  // UI sounds wrap the caller's handlers. Hover is mouse-only, so a tap never "hovers".
  const withSound = <E extends HTMLElement>(
    onEnter?: (e: PointerEvent<E>) => void,
    onClick?: (e: MouseEvent<E>) => void,
  ) => ({
    onPointerEnter: (e: PointerEvent<E>) => {
      if (sound && !inactive && e.pointerType === "mouse") sfx("hover");
      onEnter?.(e);
    },
    onClick: (e: MouseEvent<E>) => {
      if (sound && !inactive) sfx("click");
      onClick?.(e);
    },
  });

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
    magnetic && "magnetic",
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
    const { href, ref, onPointerEnter, onClick, ...linkRest } = rest as Omit<
      AsLink,
      keyof OwnProps
    >;
    return (
      <MotionLink
        href={href}
        data-cursor="select"
        data-cursor-label={cursorLabel ?? copy.cursor.link}
        {...linkRest}
        {...withSound(onPointerEnter, onClick)}
        ref={mergeRefs(own, ref)}
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
    onPointerEnter,
    ref,
    ...buttonRest
  } = rest as Omit<AsButton, keyof OwnProps>;
  const handlers = withSound(onPointerEnter, onClick);
  // A disabled link falls back to a button; drop its href.
  delete (buttonRest as { href?: string }).href;

  return (
    <m.button
      type={type}
      data-cursor={inactive ? undefined : "select"}
      data-cursor-label={
        inactive ? undefined : (cursorLabel ?? copy.cursor.button)
      }
      {...buttonRest}
      ref={mergeRefs(own, ref)}
      onPointerEnter={handlers.onPointerEnter}
      // Loading stays focusable (aria-disabled); disabled leaves the tab order.
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : handlers.onClick}
      className={classes}
      whileTap={tap}
      transition={spring.snappy}
    >
      {content}
    </m.button>
  );
}
