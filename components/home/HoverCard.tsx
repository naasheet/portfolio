import { ArrowUpRight } from "lucide-react";
import { Kbd } from "@/components/ui/Kbd";
import { copy } from "@/content/copy";
import type { RoomInfo } from "./roomInfo";

/** Placeholder tile fills (Work's three projects) until content/projects.ts exists (4.1). */
const TILE_FILLS = [
  "bg-accent-primary/15",
  "bg-accent-secondary/15",
  "bg-text-tertiary/15",
] as const;

/**
 * The card above a hovered or focused room object (R.4, "Home — hovering the laptop"): 320 px
 * of glass with the number, name and subtitle (or, for the headphones, mug and lamp, their
 * action line), Work's three project tiles, and "Click, or [3]" with the route. Presentational:
 * RoomOverlay positions it.
 */
export function HoverCard({ info }: { info: RoomInfo }) {
  const t = copy.home.room;
  return (
    <div className="glass flex w-80 flex-col gap-4 rounded-card p-6 shadow-lift">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="flex items-baseline gap-2">
            <span className="text-caption-1 font-mono text-accent-primary">
              {info.number}
            </span>
            <span className="text-headline text-text-primary">{info.name}</span>
          </p>
          <p className="text-subhead text-text-secondary">{info.line}</p>
        </div>
        {info.route ? (
          <ArrowUpRight aria-hidden className="size-4 shrink-0 text-text-secondary" />
        ) : null}
      </div>
      {info.id === "work" ? (
        <div className="grid grid-cols-3 gap-2">
          {TILE_FILLS.map((fill, i) => (
            <div
              key={fill}
              className={`flex h-16 items-end rounded-control border border-border-default p-2 ${fill}`}
            >
              <span className="text-caption-2 font-mono whitespace-nowrap text-text-secondary">
                {t.projectTile(i + 1)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between border-t border-border-default pt-4">
        <span className="flex items-center gap-2 text-footnote text-text-secondary">
          {info.keyHint ? (
            <>
              {t.clickOr}
              <Kbd>{info.keyHint}</Kbd>
            </>
          ) : (
            t.click
          )}
        </span>
        {info.route ? (
          <span className="text-caption-1 font-mono text-text-tertiary">{info.route}</span>
        ) : null}
      </div>
    </div>
  );
}
