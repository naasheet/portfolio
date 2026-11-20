import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type KbdProps = ComponentPropsWithoutRef<"kbd">;

/** An SF Mono key cap for shortcut hints. For a chord, render one Kbd per key. */
export function Kbd({ className, ...rest }: KbdProps) {
  return (
    <kbd
      {...rest}
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-key border border-border-default bg-surface-solid px-2 text-caption-1 font-mono font-medium text-text-secondary",
        className,
      )}
    />
  );
}
