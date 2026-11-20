import { cn } from "@/lib/utils";

/**
 * Four equalizer bars (the now-playing loop §8 allows). They move only while `playing`, and
 * stand still under reduced motion (the .np-bar rules in globals.css).
 */
export function EqBars({
  playing = true,
  className,
}: {
  playing?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      data-playing={playing ? "" : undefined}
      className={cn("flex h-3.5 items-end gap-0.5", className)}
    >
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="np-bar h-full w-0.5 rounded-chip bg-current" />
      ))}
    </span>
  );
}
