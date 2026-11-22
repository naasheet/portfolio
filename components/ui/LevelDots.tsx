import { cn } from "@/lib/utils";

export type LevelDotsProps = {
  /** 1–5 lit dots; undefined shows five empty dots (not rated yet). */
  level?: number;
  /** Read instead of the dots, e.g. "4 of 5" or "Not rated yet". Omit when `decorative`. */
  label?: string;
  /** Hidden from assistive tech (when a visible label already says it). */
  decorative?: boolean;
  max?: number;
  className?: string;
};

/** A skill level as five dots (4.6; Skills frames): lit teal with a soft glow, unlit dim. */
export function LevelDots({
  level = 0,
  label,
  decorative = false,
  max = 5,
  className,
}: LevelDotsProps) {
  return (
    <span
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": label })}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-2.5 rounded-chip",
            i < level
              ? "bg-accent-primary shadow-[0_0_8px_color-mix(in_srgb,var(--color-accent-primary)_55%,transparent)]"
              : "bg-text-primary/10",
          )}
        />
      ))}
    </span>
  );
}
