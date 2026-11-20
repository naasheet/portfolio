import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The accent-tinted square that holds a card's icon (SocialCard, ARCard). */
export function IconTile({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-accent-primary/15 text-accent-primary [&_svg]:size-5",
        className,
      )}
    >
      {children}
    </span>
  );
}
