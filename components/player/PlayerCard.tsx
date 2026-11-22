"use client";

import { m } from "framer-motion";
import { ListMusic, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import type { ComponentProps } from "react";
import { copy } from "@/content/copy";
import { tracks } from "@/content/music";
import { disabledState, focusRing } from "@/components/ui/controlStyles";
import { ICON_CLASS } from "@/components/media/iconSize";
import { spring } from "@/lib/motion/tokens";
import { getMusic } from "@/lib/music";
import { sfx } from "@/lib/sfx";
import { toggleSound } from "@/lib/shortcuts";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Bars } from "./Bars";
import { Cover } from "./Cover";
import { Scrubber } from "./Scrubber";

function Control({
  className,
  onClick,
  ...props
}: ComponentProps<typeof m.button>) {
  return (
    <m.button
      type="button"
      data-cursor="orbit"
      whileTap={props.disabled ? undefined : { scale: 0.97 }}
      transition={spring.snappy}
      onClick={(e) => {
        sfx("click");
        onClick?.(e);
      }}
      className={cn(
        "flex cursor-pointer items-center justify-center rounded-chip transition-colors duration-150 ease-out",
        focusRing,
        disabledState,
        className,
      )}
      {...props}
    />
  );
}

/**
 * The music player (5.2): the island's expanded music card (Island board, "Music · expanded"),
 * the only music player on the site. Art, title, "artist · track n of N", the bars, the
 * scrubber, and previous / play-pause / next, with the queue button on the right (5.3 opens the
 * track list from it). Renders on track and play-state changes only; time and levels go through
 * refs (Scrubber, Bars).
 */
export function PlayerCard() {
  const index = useStore((s) => s.audio.trackIndex);
  const playing = useStore((s) => s.audio.playing);
  const track = tracks[index];
  const position = getMusic()?.getQueuePosition();

  const togglePlay = () => {
    const music = getMusic();
    if (!music) return;
    if (playing) music.pause();
    // Sound off (M) paused it: turning sound back on resumes the music (lib/music.ts).
    else if (!useStore.getState().ui.soundEnabled) toggleSound();
    else void music.play();
  };

  if (!track) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Cover size={56} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-headline text-island-text">
            {track.title}
          </span>
          <span className="truncate text-footnote text-island-text-secondary">
            {track.artist}
            {position
              ? ` · ${copy.player.trackOf(position.index, position.total)}`
              : null}
          </span>
        </div>
        <Bars className="text-island-accent" />
      </div>

      <Scrubber />

      <div className="relative flex items-center justify-center gap-4 text-island-text">
        <Control
          aria-label={copy.player.previous}
          onClick={() => void getMusic()?.prev()}
          className="size-11 hover:bg-island-text/10"
        >
          <SkipBack aria-hidden fill="currentColor" className={ICON_CLASS.md} />
        </Control>
        <Control
          data-island-autofocus
          aria-label={playing ? copy.player.pause : copy.player.play}
          onClick={togglePlay}
          className="size-11 bg-island-text text-island-bg"
        >
          {playing ? (
            <Pause aria-hidden fill="currentColor" className={ICON_CLASS.md} />
          ) : (
            <Play aria-hidden fill="currentColor" className={ICON_CLASS.md} />
          )}
        </Control>
        <Control
          aria-label={copy.player.next}
          onClick={() => void getMusic()?.next()}
          className="size-11 hover:bg-island-text/10"
        >
          <SkipForward
            aria-hidden
            fill="currentColor"
            className={ICON_CLASS.md}
          />
        </Control>
        {/* 5.3 wires the track list to this button. */}
        <Control
          aria-label={copy.player.queue}
          disabled
          className="absolute right-0 size-11 text-island-text-secondary"
        >
          <ListMusic aria-hidden className={ICON_CLASS.md} />
        </Control>
      </div>
    </div>
  );
}
