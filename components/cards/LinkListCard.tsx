import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { TransitionLink } from "@/components/nav/TransitionLink";
import { Card } from "@/components/ui/Card";
import { focusRing } from "@/components/ui/controlStyles";
import { cn } from "@/lib/utils";
import { CardEyebrow } from "./CardEyebrow";

export type LinkListItem = {
  label: string;
  /** A site path (page transition) or an https URL (new tab); none = plain text. */
  href?: string;
};

export type LinkListCardProps = {
  eyebrow: string;
  title: string;
  items: readonly LinkListItem[];
  /** Phones (Skills phone frame): the items as one line, "This site · [Project title]". */
  compact?: boolean;
  /** Appended to external links' names, e.g. "opens in a new tab". */
  newTabLabel?: string;
  hoverable?: boolean;
  className?: string;
};

const isExternal = (href: string) => /^https?:/.test(href);

/**
 * A titled list of links (4.6, Skills frames: "Where I used it"): bordered rows with ↗ for
 * links, plain rows for text. Site paths go through the page transition.
 */
export function LinkListCard({
  eyebrow,
  title,
  items,
  compact = false,
  newTabLabel,
  hoverable,
  className,
}: LinkListCardProps) {
  const link = (item: LinkListItem, className: string, children: ReactNode) => {
    if (!item.href) return <span className={className}>{children}</span>;
    if (isExternal(item.href)) {
      return (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={newTabLabel ? `${item.label}, ${newTabLabel}` : undefined}
          className={cn(className, focusRing)}
        >
          {children}
        </a>
      );
    }
    return (
      <TransitionLink href={item.href} className={cn(className, focusRing)}>
        {children}
      </TransitionLink>
    );
  };

  return (
    <Card
      hoverable={hoverable}
      className={cn("flex flex-col gap-4", className)}
    >
      <CardEyebrow mono>{eyebrow}</CardEyebrow>
      <h3 className="text-title-2 font-bold tracking-tight">{title}</h3>
      {compact ? (
        <p className="text-subhead text-text-secondary">
          {items.map((item, i) => (
            <span key={`${item.label}-${i}`}>
              {i > 0 ? " · " : null}
              {link(
                item,
                item.href
                  ? "rounded-[2px] underline decoration-border-default underline-offset-4 hover:text-text-primary"
                  : "",
                item.label,
              )}
            </span>
          ))}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={`${item.label}-${i}`}>
              {link(
                item,
                cn(
                  "flex h-11 items-center justify-between gap-4 rounded-control border border-border-default px-4 text-subhead text-text-secondary",
                  item.href &&
                    "transition-colors duration-150 ease-out hover:border-text-tertiary hover:text-text-primary",
                ),
                <>
                  <span className="truncate">{item.label}</span>
                  {item.href ? (
                    <ArrowUpRight aria-hidden className="size-4 shrink-0" />
                  ) : null}
                </>,
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
