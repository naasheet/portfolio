import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BentoGridProps = {
  as?: "div" | "section" | "ul";
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

/**
 * The bento grid: 1 column on phones, 6 on tablets, 12 on desktop, 16 px gap, rows at least
 * 160 px tall (cards grow with their content). Lay cards out with BentoItem.
 */
export function BentoGrid({
  as = "div",
  className,
  children,
  ...rest
}: BentoGridProps) {
  const Tag = as as "div";
  return (
    <Tag {...rest} className={cn("bento", className)}>
      {children}
    </Tag>
  );
}
