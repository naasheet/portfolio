"use client";

import { ArrowUpRight, Volume2 } from "lucide-react";
import { useEffect, useRef, type MouseEvent } from "react";
import { copy } from "@/content/copy";
import { tracks } from "@/content/music";
import { Img } from "@/components/media/Img";
import { ICON_CLASS } from "@/components/media/iconSize";
import { Bars } from "@/components/player/Bars";
import { openMusic } from "@/components/player/openMusic";
import { Card } from "@/components/ui/Card";
import { focusRing } from "@/components/ui/controlStyles";
import { gsap } from "@/lib/motion/gsap";
import { getMusic } from "@/lib/music";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CardEyebrow } from "./CardEyebrow";

const t = copy.about.nowPlaying;

/** The card-wide hit area and focus ring of the card's one button (CTACard's pattern). */
const STRETCH =
  "after:absolute after:inset-0 after:z-10 after:rounded-card focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-border-focus";

/**
 * The About page's now-playing card (5.5; About frames, row 3 on desktop, after "The short
 * version" on phones), wired to the real player. It shows exactly what the island's music
 * activity shows: it re-renders only on audio.trackIndex, audio.playing and ui.soundEnabled
 * (silent mode); the bars are the island's Bars, and the progress line is written from the
 * ticker through a ref.
 *
 * The whole card is one button (a stretched ::after, as in CTACard). Sound on: it opens the
 * island's expanded player (resuming first if the music had left the island); sound off: "Sound's
 * off. Turn it on?" creates the AudioContext in the click, fades track 1 in and opens the player.
 */
export function NowPlayingCard({ className }: { className?: string }) {
  const index = useStore((s) => s.audio.trackIndex);
  const playing = useStore((s) => s.audio.playing);
  const soundOn = useStore((s) => s.ui.soundEnabled);
  const track = tracks[index];
  const progress = useRef<HTMLSpanElement>(null);

  // The progress line: per frame while playing; one write when paused or on a track change.
  useEffect(() => {
    const el = progress.current;
    if (!el) return;
    const write = () => {
      const music = getMusic();
      const d = music?.getDuration() ?? 0;
      const p = d > 0 ? Math.min(1, (music?.getTime() ?? 0) / d) : 0;
      el.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    write();
    if (!playing) return;
    gsap.ticker.add(write);
    return () => gsap.ticker.remove(write);
  }, [playing, index]);

  if (!track) return null;
  const off = !soundOn;

  // A keyboard click (detail 0) moves focus into the player, so it can be used from there.
  const onClick = (e: MouseEvent<HTMLButtonElement>) =>
    openMusic({ focus: e.detail === 0 });

  return (
    <Card interactive className={cn("group flex flex-col p-2", className)}>
      {off ? (
        // Silent mode: the whole card is the "turn it on" button (no visible text of its own).
        <button
          type="button"
          onClick={onClick}
          aria-label={`${t.offTitle} ${t.offBody}`}
          className={cn(
            "absolute inset-0 z-10 cursor-pointer rounded-card",
            focusRing,
          )}
        />
      ) : null}
      <div className="relative aspect-2/1 w-full overflow-hidden rounded-[calc(var(--radius-card)-8px)] lg:aspect-auto lg:min-h-28 lg:flex-1">
        <Img
          key={track.id}
          src={track.cover}
          alt=""
          width={600}
          height={300}
          sizes="(min-width: 1024px) 25vw, 100vw"
          className="absolute inset-0 h-full"
        />
        {off ? (
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center bg-overlay-scrim/55"
          >
            <span className="flex size-14 items-center justify-center rounded-chip bg-island-text text-island-bg shadow-lift transition-transform duration-250 ease-out group-hover:scale-105">
              <Volume2 className={ICON_CLASS.md} />
            </span>
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardEyebrow mono className="text-accent-primary">
            {off ? t.eyebrow : playing ? t.eyebrow : t.paused}
          </CardEyebrow>
          {off ? null : <Bars className="text-accent-primary" />}
        </div>

        {off ? (
          <>
            <p className="text-headline text-text-primary">{t.offTitle}</p>
            <p className="text-footnote text-text-secondary">{t.offBody}</p>
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-headline text-text-primary">
                {track.title}
              </span>
              <span className="truncate text-footnote text-text-secondary">
                {track.artist}
              </span>
            </div>
            <span
              aria-hidden
              className="relative mt-1 h-0.5 overflow-hidden rounded-chip bg-border-default"
            >
              <span
                ref={progress}
                className="absolute inset-0 origin-left bg-text-primary"
                style={{ transform: "scaleX(0)" }}
              />
            </span>
          </>
        )}

        {off ? null : (
          <button
            type="button"
            onClick={onClick}
            aria-label={t.label(track.title, track.artist, playing)}
            className={cn(
              "mt-1 flex cursor-pointer items-center gap-1 self-start text-footnote text-text-tertiary outline-none",
              STRETCH,
            )}
          >
            {t.opens}
            <ArrowUpRight aria-hidden className="size-3" />
          </button>
        )}
      </div>
    </Card>
  );
}
