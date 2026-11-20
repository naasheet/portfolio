"use client";

import Link from "next/link";
import {
  useRef,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";
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
  /** Hover lift, lift shadow, border change and pointer spotlight (mouse only). */
  interactive?: boolean;
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
  interactive = false,
  children,
  className,
  onPointerMove,
  ...rest
}: CardProps) {
  const ref = useRef<HTMLElement | null>(null);
  const isInteractive = interactive || href !== undefined;

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
      {isInteractive ? <span aria-hidden className="card-spot" /> : null}
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
    "data-interactive": isInteractive ? "" : undefined,
    className: classes,
    onPointerMove: isInteractive ? handlePointerMove : onPointerMove,
  };

  if (href !== undefined) {
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
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
