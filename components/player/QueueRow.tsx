"use client";

import { ArrowUpRight, Play } from "lucide-react";
import { useEffect, useRef, type FocusEvent } from "react";
import { copy } from "@/content/copy";
import type { Track } from "@/content/music";
import { Img } from "@/components/media/Img";
import { ICON_CLASS } from "@/components/media/iconSize";
import { focusRing } from "@/components/ui/controlStyles";
import { formatTime } from "@/lib/audio/time";
import { gsap } from "@/lib/motion/gsap";
import { writeText } from "@/lib/motion/writeText";
import { getMusic } from "@/lib/music";
import { cn } from "@/lib/utils";
import { Bars } from "./Bars";

type QueueRowProps = {
  track: Track;
  current: boolean;
  /** Roving focus (5.3): only the active row (and its licence link) is in the Tab order. */
  tabbable: boolean;
  onPlay: () => void;
  onFocusRow: () => void;
};

/**
 * One track in the queue sheet (Queue sheet frame, 5.3): 44 px art, title, "artist · licence ↗",
 * and the length. The row's action is a stretched button over it (so the licence link beside it
 * isn't nested in a button). Current: accent tint and hairline, teal title, live bars over the
 * art, and "elapsed / total" written from the ticker. Other rows show a play icon on hover / focus.
 */
export function QueueRow({
  track,
  current,
  tabbable,
  onPlay,
  onFocusRow,
}: QueueRowProps) {
  const time = useRef<HTMLSpanElement>(null);
  const length = formatTime(track.duration);

  // Current row: "1:12 / 3:42", rewritten only when a whole second changes.
  useEffect(() => {
    const el = time.current;
    if (!current || !el) return;
    let last = "";
    const tick = () => {
      const music = getMusic();
      const total = music?.getDuration() || track.duration;
      const text = `${formatTime(music?.getTime() ?? 0)} / ${formatTime(total)}`;
      if (text !== last) writeText(el, (last = text));
    };
    gsap.ticker.add(tick);
    tick();
    return () => gsap.ticker.remove(tick);
  }, [current, track.duration]);

  const onFocus = (e: FocusEvent) => {
    if (e.target === e.currentTarget) onFocusRow();
  };

  return (
    <li
      className={cn(
        "group relative flex items-center gap-3 rounded-control border p-2 transition-colors duration-150 ease-out",
        current
          ? "border-accent-primary/40 bg-accent-primary/10"
          : "border-transparent hover:bg-text-primary/5 has-[button:focus-visible]:bg-text-primary/5",
      )}
    >
      <button
        type="button"
        data-queue-row
        data-autofocus={current ? "" : undefined}
        data-cursor="orbit"
        tabIndex={tabbable ? 0 : -1}
        aria-current={current ? "true" : undefined}
        aria-label={
          current
            ? copy.player.nowPlaying(track.title, track.artist)
            : copy.player.playTrack(track.title, track.artist, length)
        }
        onClick={onPlay}
        onFocus={onFocus}
        className={cn(
          "absolute inset-0 cursor-pointer rounded-control",
          focusRing,
        )}
      />
      <span
        aria-hidden
        className="pointer-events-none relative size-11 shrink-0 overflow-hidden rounded-key"
      >
        <Img
          src={track.cover}
          alt=""
          width={44}
          height={44}
          sizes="44px"
          className="size-11"
          imgClassName="object-cover"
        />
        {current ? (
          <span className="absolute inset-0 flex items-center justify-center bg-overlay-scrim/45">
            <Bars className="text-island-accent" />
          </span>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-overlay-scrim/55 text-island-text opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-has-[button:focus-visible]:opacity-100">
            <Play aria-hidden fill="currentColor" className={ICON_CLASS.sm} />
          </span>
        )}
      </span>
      <span className="pointer-events-none flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "truncate text-callout font-medium",
            current ? "text-accent-primary" : "text-text-primary",
          )}
        >
          {track.title}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-footnote text-text-secondary">
          <span className="truncate">{track.artist}</span>
          <span aria-hidden className="text-text-tertiary">
            ·
          </span>
          {track.license === "local" ? (
            <span className="shrink-0 text-text-tertiary">
              {copy.player.localFile}
            </span>
          ) : (
            <a
              href={track.license.url}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={tabbable ? 0 : -1}
              aria-label={copy.player.licenceLink(track.license.source)}
              className={cn(
                "pointer-events-auto relative inline-flex shrink-0 items-center gap-0.5 rounded-key text-text-tertiary transition-colors duration-150 ease-out hover:text-text-primary",
                focusRing,
              )}
            >
              {track.license.source}
              <ArrowUpRight aria-hidden className="size-3" />
            </a>
          )}
        </span>
      </span>
      <span
        ref={time}
        className={cn(
          "pointer-events-none shrink-0 text-caption-1 font-mono tabular-nums",
          current ? "text-accent-primary" : "text-text-tertiary",
        )}
      >
        {current ? `0:00 / ${length}` : length}
      </span>
    </li>
  );
}
