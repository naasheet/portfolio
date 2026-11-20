"use client";

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { CardEyebrow } from "./CardEyebrow";

type Base = {
  eyebrow: string;
  title: string;
  /** Accessible name of the arrow button (onClick form). The link form is named by its text. */
  actionLabel: string;
  className?: string;
};

export type CTACardProps = Base &
  (
    | { href: string; onClick?: undefined }
    | { onClick: () => void; href?: undefined }
  );

const ARROW =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-chip border border-border-default text-text-primary transition-colors duration-250 ease-out group-hover:border-transparent group-hover:bg-accent-primary group-hover:text-accent-contrast [&_svg]:size-4 [&_svg]:transition-transform [&_svg]:duration-250 [&_svg]:ease-out group-hover:[&_svg]:translate-x-1";

/**
 * One big line and a round arrow that nudges on hover. With href the whole card is the link;
 * with onClick the arrow is a real button whose ::after stretches over the card, so the whole
 * card is clickable and the focus ring outlines the card.
 */
export function CTACard({
  eyebrow,
  title,
  actionLabel,
  href,
  onClick,
  className,
}: CTACardProps) {
  const body = (arrow: ReactNode) => (
    <div className="flex h-full flex-col justify-between gap-6">
      <CardEyebrow>{eyebrow}</CardEyebrow>
      <div className="flex items-end justify-between gap-4">
        <p className="text-title-2 font-semibold">{title}</p>
        {arrow}
      </div>
    </div>
  );

  if (href !== undefined) {
    return (
      // The visible text names the link (label in name); actionLabel is for the button form.
      <Card href={href} className={cn("group", className)}>
        {body(
          <span aria-hidden className={ARROW}>
            <ArrowRight />
          </span>,
        )}
      </Card>
    );
  }

  return (
    <Card interactive className={cn("group", className)}>
      {body(
        <button
          type="button"
          onClick={onClick}
          aria-label={actionLabel}
          className={cn(
            ARROW,
            "cursor-pointer outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-border-focus",
          )}
        >
          <ArrowRight aria-hidden />
        </button>,
      )}
    </Card>
  );
}
