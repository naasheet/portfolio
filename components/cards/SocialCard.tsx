import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { IconTile } from "./IconTile";

export type SocialCardProps = {
  platform: string;
  handle: string;
  href: string;
  /** A brand icon from components/media/icons. */
  icon: ReactNode;
  /** Screen-reader note that the link opens a new tab. */
  newTabLabel: string;
  className?: string;
};

/** A link to one profile elsewhere. Opens in a new tab; the arrow slides in on hover and focus. */
export function SocialCard({
  platform,
  handle,
  href,
  icon,
  newTabLabel,
  className,
}: SocialCardProps) {
  return (
    <Card
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("group", className)}
    >
      <div className="flex h-full min-h-28 flex-col justify-between gap-6">
        <IconTile>{icon}</IconTile>
        <div className="flex flex-col">
          <span className="text-headline">{platform}</span>
          <span className="text-footnote text-text-secondary">{handle}</span>
          <span className="sr-only">{newTabLabel}</span>
        </div>
      </div>
      <ArrowUpRight
        aria-hidden
        className="absolute top-6 right-6 size-4 -translate-x-1 translate-y-1 text-accent-primary opacity-0 transition-[opacity,translate] duration-250 ease-out group-hover:translate-0 group-hover:opacity-100 group-focus-visible:translate-0 group-focus-visible:opacity-100"
      />
    </Card>
  );
}
