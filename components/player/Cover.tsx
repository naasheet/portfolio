"use client";

import { tracks } from "@/content/music";
import { Img } from "@/components/media/Img";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * The current track's album art (5.2), decorative: the title is in the card, and the island's
 * slot button carries the name. Re-renders only when the track changes; keyed by track, so a
 * new cover fades in.
 */
export function Cover({
  size,
  className,
}: {
  size: 28 | 56;
  className?: string;
}) {
  const index = useStore((s) => s.audio.trackIndex);
  const track = tracks[index];
  if (!track) return null;
  return (
    <Img
      key={track.id}
      src={track.cover}
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
      className={cn(
        "shrink-0",
        size === 28 ? "size-7 rounded-key" : "size-14 rounded-control",
        className,
      )}
    />
  );
}
