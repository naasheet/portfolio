import { cn } from "@/lib/utils";

/**
 * A small glass pill that stands in for a persistent control until its chunk builds it.
 * Not interactive on purpose: no dead buttons for keyboard users.
 */
export function PlaceholderPill({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center rounded-chip glass px-4 text-subhead text-text-secondary",
        className,
      )}
    >
      {label}
    </div>
  );
}
