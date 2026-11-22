"use client";

import Link from "next/link";
import {
  useRef,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";
import { focusRing } from "./controlStyles";

export type CardVariant = "glass" | "solid" | "media";
type CardTag = "div" | "article" | "section" | "li" | "aside" | "figure";

const VARIANTS: Record<CardVariant, string> = {
  glass: "glass p-6",
  solid: "border border-border-default bg-surface-solid p-6",
  // Edge to edge: no padding; the inner wrapper clips the media to the radius.
  media: "glass",
};

type OwnProps = {
  variant?: CardVariant;
  /** Element to render when there's no href. */
  as?: CardTag;
  /** Renders a next/link; implies interactive. */
  href?: string;
  /** Link only, e.g. "_blank" with rel "noopener noreferrer" for external profiles. */
  target?: string;
  rel?: string;
  /** Link only: download the file instead of opening it (Contact's resume card, 4.7). */
  download?: boolean | string;
  /** Hover lift, lift shadow, border change and pointer spotlight (mouse only). */
  interactive?: boolean;
  /**
   * The hover look of an interactive card (border, spotlight, lift) on a card that isn't itself
   * clickable (4.3: "every card has its hover state"). No cursor ring, no sounds.
   */
  hoverable?: boolean;
  /** Hover and click UI sounds on interactive cards (only audible when sound is on). Default true. */
  sound?: boolean;
  children?: ReactNode;
  className?: string;
};

export type CardProps = OwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof OwnProps>;

/**
 * The card every module sits in: glass (default), solid, or media (edge to edge).
 * The spotlight writes --x / --y on the element through a ref; it never touches React
 * state, so moving the pointer never re-renders. Touch is excluded in CSS and here.
 */
export function Card({
  variant = "glass",
  as = "div",
  href,
  target,
  rel,
  download,
  interactive = false,
  hoverable = false,
  sound = true,
  children,
  className,
  onPointerMove,
  onPointerEnter,
  onClick,
  ...rest
}: CardProps) {
  const ref = useRef<HTMLElement | null>(null);
  const isInteractive = interactive || href !== undefined;
  const hasHover = isInteractive || hoverable;

  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    onPointerMove?.(e);
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  };

  const classes = cn(
    "relative isolate block rounded-card text-text-primary",
    VARIANTS[variant],
    href !== undefined && focusRing,
    className,
  );

  const content = (
    <>
      {hasHover ? <span aria-hidden className="card-spot" /> : null}
      {variant === "media" ? (
        <div className="relative h-full overflow-hidden rounded-[inherit]">
          {children}
        </div>
      ) : (
        children
      )}
    </>
  );

  const shared = {
    "data-card": "",
    "data-variant": variant,
    "data-interactive": hasHover ? "" : undefined,
    className: classes,
    onPointerMove: hasHover ? handlePointerMove : onPointerMove,
    onPointerEnter: (e: PointerEvent<HTMLElement>) => {
      if (isInteractive && sound && e.pointerType === "mouse") sfx("hover");
      onPointerEnter?.(e);
    },
    // A button inside the card plays its own click; the per-sound throttle keeps it to one.
    onClick: (e: MouseEvent<HTMLElement>) => {
      if (isInteractive && sound) sfx("click");
      onClick?.(e);
    },
    "data-cursor": isInteractive ? "orbit" : undefined,
  };

  if (href !== undefined) {
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        download={download}
        {...(rest as Omit<ComponentPropsWithoutRef<"a">, "href">)}
        {...shared}
        ref={(el) => {
          ref.current = el;
        }}
      >
        {content}
      </Link>
    );
  }

  // Every CardTag accepts the same HTML attributes; narrow for JSX.
  const Tag = as as "div";
  return (
    <Tag
      {...rest}
      {...shared}
      ref={(el: HTMLElement | null) => {
        ref.current = el;
      }}
    >
      {content}
    </Tag>
  );
}
