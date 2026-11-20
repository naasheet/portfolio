import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The small label at the top of a card that says what it is ("Skills", "About"). */
export function CardEyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("text-footnote text-text-secondary", className)}>
      {children}
    </span>
  );
}
