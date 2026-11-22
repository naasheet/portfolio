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
  /** Screen-reader note that the link opens a new tab (not used with `download`). */
  newTabLabel: string;
  /** Text that slides in with the arrow on hover, top right ("Follow", 4.7). */
  hoverLabel?: string;
  /** Small mono text top right, always shown ("PDF · 180 KB", 4.7). */
  meta?: string;
  /** A file to download instead of a profile to open (Contact's resume card, 4.7). */
  download?: boolean;
  /** "row" (phones, the resume card): icon left, text beside it. Default "tile". */
  layout?: "tile" | "row";
  className?: string;
};

/** A link to one profile elsewhere. Opens in a new tab; the arrow slides in on hover and focus. */
export function SocialCard({
  platform,
  handle,
  href,
  icon,
  newTabLabel,
  hoverLabel,
  meta,
  download = false,
  layout = "tile",
  className,
}: SocialCardProps) {
  const row = layout === "row";
  return (
    <Card
      href={href}
      {...(download
        ? { download: true }
        : { target: "_blank", rel: "noopener noreferrer" })}
      className={cn("group", className)}
    >
      <div
        className={cn(
          "flex h-full gap-6",
          row ? "items-center gap-4" : "min-h-28 flex-col justify-between",
        )}
      >
        <IconTile
          className={cn(download && "bg-accent-primary/20", row && "size-14")}
        >
          {icon}
        </IconTile>
        <div className="flex min-w-0 flex-col">
          <span className="text-headline">{platform}</span>
          <span className="truncate text-footnote font-mono text-text-secondary">
            {handle}
          </span>
          {download ? null : <span className="sr-only">{newTabLabel}</span>}
        </div>
      </div>
      {meta ? (
        <span
          className={cn(
            "text-caption-2 font-mono tracking-wide text-text-tertiary uppercase",
            row ? "sr-only" : "absolute top-6 right-6",
          )}
        >
          {meta}
        </span>
      ) : (
        <span
          aria-hidden
          className="absolute top-6 right-6 flex -translate-x-1 translate-y-1 items-center gap-2 text-subhead text-text-primary opacity-0 transition-[opacity,translate] duration-250 ease-out group-hover:translate-0 group-hover:opacity-100 group-focus-visible:translate-0 group-focus-visible:opacity-100"
        >
          {hoverLabel}
          <ArrowUpRight className="size-4 text-accent-primary" />
        </span>
      )}
    </Card>
  );
}
