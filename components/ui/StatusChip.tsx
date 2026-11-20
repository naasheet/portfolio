import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** live pulses; busy, error and idle are still. */
export type StatusTone = "live" | "busy" | "error" | "idle";

const DOT: Record<StatusTone, string> = {
  live: "bg-status-success",
  busy: "bg-accent-secondary",
  error: "bg-status-danger",
  idle: "bg-text-tertiary",
};

export type StatusChipProps = {
  tone?: StatusTone;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"span">, "children">;

/**
 * Text plus a status dot. The dot colour carries the state; the text stays text/secondary,
 * so amber never has to pass as text. The live pulse is CSS only and keeps running under
 * reduced motion (component sheet 1).
 */
export function StatusChip({
  tone = "live",
  children,
  className,
  ...rest
}: StatusChipProps) {
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-2 rounded-chip border border-border-default bg-glass-fill px-4 text-footnote whitespace-nowrap text-text-secondary",
        className,
      )}
    >
      <span aria-hidden className="relative inline-flex size-2">
        {tone === "live" ? (
          <span
            className={cn(
              "absolute inset-0 animate-status-pulse rounded-chip",
              DOT[tone],
            )}
          />
        ) : null}
        <span className={cn("relative size-2 rounded-chip", DOT[tone])} />
      </span>
      {children}
    </span>
  );
}
