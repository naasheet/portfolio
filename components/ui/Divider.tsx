import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type DividerProps = {
  orientation?: "horizontal" | "vertical";
  /** Purely visual: hidden from assistive tech instead of announced as a separator. */
  decorative?: boolean;
} & Omit<ComponentPropsWithoutRef<"div">, "children">;

/** A 1 px hairline in border/default. Vertical dividers stretch to their flex row's height. */
export function Divider({
  orientation = "horizontal",
  decorative = false,
  className,
  ...rest
}: DividerProps) {
  return (
    <div
      {...rest}
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "separator", "aria-orientation": orientation })}
      className={cn(
        "shrink-0 bg-border-default",
        orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch",
        className,
      )}
    />
  );
}
