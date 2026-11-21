import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The small label at the top of a card that says what it is ("Skills", "About"). `mono` (4.3,
 * About frame): small uppercase SF Mono with wide tracking ("THE SHORT VERSION").
 */
export function CardEyebrow({
  children,
  mono = false,
  className,
}: {
  children: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        mono
          ? "text-caption-1 font-mono tracking-widest text-text-secondary uppercase"
          : "text-footnote text-text-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}
