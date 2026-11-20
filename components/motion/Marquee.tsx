import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MarqueeProps = {
  children: ReactNode;
  /** Seconds for one full loop. */
  duration?: number;
  /** Scroll left to right instead. */
  reverse?: boolean;
  /** Space between items and at the seam, in px (keep it on the 8 px grid). */
  gap?: number;
  className?: string;
};

/**
 * A horizontal loop in pure CSS (no JS): the content is rendered twice and the track moves
 * by -50%. It pauses on hover and keyboard focus, and stands still under reduced motion.
 * The copy is aria-hidden and inert. The content should be at least as wide as the marquee,
 * or the loop shows a gap.
 *
 * CLAUDE.md §8 allows only the status dot and the now-playing bars to loop: using this on a
 * page needs Nasheet's OK.
 */
export function Marquee({
  children,
  duration = 30,
  reverse = false,
  gap = 32,
  className,
}: MarqueeProps) {
  const vars = {
    "--marquee-duration": `${duration}s`,
    "--marquee-gap": `${gap}px`,
  } as CSSProperties;

  return (
    <div
      className={cn("marquee", className)}
      style={vars}
      data-reverse={reverse || undefined}
    >
      <div className="marquee-track">
        <div className="marquee-content">{children}</div>
        <div className="marquee-content" aria-hidden inert>
          {children}
        </div>
      </div>
    </div>
  );
}
