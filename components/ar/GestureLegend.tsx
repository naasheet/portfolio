import { arCopy } from "@/content/ar";
import { cn } from "@/lib/utils";
import { HandSkeleton } from "./HandSkeleton";

const t = arCopy.legend;

/**
 * The gesture legend beside the camera preview (8.4, AR board "Tracking: preview, legend"): the
 * three gestures, each with a tiny drawing of the pose that loops gently (`.legend-icon` in
 * globals.css: transform only, only while Hand mode shows it, still under reduced motion), and the
 * "drag the preview" hint. Moves with the preview (it's inside the same draggable group).
 */
export function GestureLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-48 flex-col gap-2 rounded-card glass p-4 select-none",
        className,
      )}
    >
      <span className="text-caption-2 font-mono tracking-wide text-text-tertiary uppercase">
        {t.title}
      </span>
      <ul className="flex flex-col gap-2">
        {t.rows.map((row) => (
          <li key={row.pose} className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-control border border-island-border bg-island-bg p-0.5">
              <HandSkeleton
                pose={row.pose}
                className="legend-icon"
                data-pose={row.pose}
              />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-footnote font-semibold text-text-primary">
                {row.name}
              </span>
              <span className="text-caption-2 text-text-secondary">
                {row.hint}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <span className="text-caption-2 text-text-tertiary">{t.drag}</span>
    </div>
  );
}
