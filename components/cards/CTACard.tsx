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

/**
 * The hero form (4.7, Contact frames: "Say hello."): an eyebrow and a status line on top, a huge
 * title with a teal dot, a line of copy and the actions (real buttons) along the bottom.
 */
export type CTACardHeroProps = {
  variant: "hero";
  eyebrow: string;
  /** Top right ("● Open to work · Indore 03:58 IST"). */
  status?: ReactNode;
  title: string;
  body?: ReactNode;
  actions: ReactNode;
  hoverable?: boolean;
  className?: string;
};

export type CTACardProps =
  | (Base & { variant?: "default" } & (
        | { href: string; onClick?: undefined }
        | { onClick: () => void; href?: undefined }
      ))
  | CTACardHeroProps;

const ARROW =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-chip border border-border-default text-text-primary transition-colors duration-250 ease-out group-hover:border-transparent group-hover:bg-accent-primary group-hover:text-accent-contrast [&_svg]:size-4 [&_svg]:transition-transform [&_svg]:duration-250 [&_svg]:ease-out group-hover:[&_svg]:translate-x-1";

/**
 * One big line and a round arrow that nudges on hover. With href the whole card is the link;
 * with onClick the arrow is a real button whose ::after stretches over the card, so the whole
 * card is clickable and the focus ring outlines the card.
 */
export function CTACard(props: CTACardProps) {
  if (props.variant === "hero") return <HeroCTA {...props} />;
  const { eyebrow, title, actionLabel, href, onClick, className } = props;
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

function HeroCTA({
  eyebrow,
  status,
  title,
  body,
  actions,
  hoverable,
  className,
}: CTACardHeroProps) {
  return (
    <Card
      hoverable={hoverable}
      className={cn("flex flex-col gap-6 md:p-10", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <CardEyebrow mono>{eyebrow}</CardEyebrow>
        {status ? (
          <div className="text-subhead text-text-secondary">{status}</div>
        ) : null}
      </div>
      <div className="flex flex-col gap-4 md:mt-auto">
        <h2 className="text-stat-3 font-bold md:text-stat-1">
          {title}
          <span className="text-accent-primary">.</span>
        </h2>
        {body ? (
          <div className="max-w-xl text-body text-text-secondary md:text-title-3 md:font-normal">
            {body}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:mt-4">
        {actions}
      </div>
    </Card>
  );
}
