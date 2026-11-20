import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** One labelled cell in a /dev state grid. */
export function DevState({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("flex flex-col items-start gap-2", className)}>
      <div className="flex min-h-13 items-center">{children}</div>
      <figcaption className="text-caption-1 text-text-tertiary">
        {label}
      </figcaption>
    </figure>
  );
}
