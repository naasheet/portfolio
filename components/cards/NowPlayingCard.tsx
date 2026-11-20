import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { cn } from "@/lib/utils";
import { CardEyebrow } from "./CardEyebrow";

export type NowPlayingCardProps = {
  eyebrow: string;
  title: string;
  artist: string;
  /** Without a cover, an amber tile with the bars shows. */
  cover?: { src: string; alt: string };
  /** 0–1. */
  progress: number;
  /** Accessible name of the progress bar. */
  progressLabel: string;
  /** Text of the live chip; shown only while playing. */
  liveLabel?: string;
  playing?: boolean;
  className?: string;
};

function Bars({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex h-4 items-end gap-1", className)}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="np-bar h-full w-1 rounded-chip bg-current" />
      ))}
    </span>
  );
}

/**
 * The track that's playing. Static props for now; chunk 5.5 wires it to the player.
 * The bars loop only while playing (one of the loops §8 allows) and stand still under
 * reduced motion. Progress is drawn with scaleX, never width.
 */
export function NowPlayingCard({
  eyebrow,
  title,
  artist,
  cover,
  progress,
  progressLabel,
  liveLabel,
  playing = false,
  className,
}: NowPlayingCardProps) {
  const p = Math.min(1, Math.max(0, progress));

  return (
    <Card className={className}>
      <div
        className="flex h-full flex-col justify-between gap-4"
        data-playing={playing || undefined}
      >
        <div className="flex items-center justify-between gap-4">
          <CardEyebrow>{eyebrow}</CardEyebrow>
          {playing && liveLabel ? (
            <StatusChip tone="live">{liveLabel}</StatusChip>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          <span className="relative inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-control bg-accent-secondary text-overlay-scrim/80">
            {cover ? (
              <Image
                src={cover.src}
                alt={cover.alt}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <Bars />
            )}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-headline">{title}</span>
            <span className="truncate text-footnote text-text-secondary">
              {artist}
            </span>
          </div>
        </div>
        <div
          role="progressbar"
          aria-label={progressLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(p * 100)}
          className="h-1 overflow-hidden rounded-chip bg-border-default"
        >
          <div
            className="h-full w-full origin-left rounded-chip bg-accent-primary"
            style={{ transform: `scaleX(${p})` }}
          />
        </div>
      </div>
    </Card>
  );
}
