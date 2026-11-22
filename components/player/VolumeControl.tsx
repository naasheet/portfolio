"use client";

import { m } from "framer-motion";
import { Volume1, Volume2, VolumeX } from "lucide-react";
import type { ChangeEvent, CSSProperties } from "react";
import { copy } from "@/content/copy";
import { ICON_CLASS } from "@/components/media/iconSize";
import { colorTransition, focusRing } from "@/components/ui/controlStyles";
import { spring } from "@/lib/motion/tokens";
import { getMusic } from "@/lib/music";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * The queue sheet's volume row (Queue sheet frame, 5.3): a speaker button that mutes and comes
 * back to the last level (the engine keeps it in localStorage), a native range (← → ±5 %,
 * Home / End 0 / 100 %), and the percentage. Re-renders only when the volume changes.
 */
export function VolumeControl() {
  const volume = useStore((s) => s.audio.volume);
  const percent = Math.round(volume * 100);
  const Icon = percent === 0 ? VolumeX : percent < 50 ? Volume1 : Volume2;

  const onChange = (e: ChangeEvent<HTMLInputElement>) =>
    getMusic()?.setVolume(Number(e.target.value) / 100);

  return (
    <div className="flex w-full items-center gap-3">
      <m.button
        type="button"
        data-cursor="orbit"
        aria-label={percent === 0 ? copy.player.unmute : copy.player.mute}
        onClick={() => getMusic()?.toggleMute()}
        whileTap={{ scale: 0.97 }}
        transition={spring.snappy}
        className={cn(
          "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-border-default text-text-primary hover:bg-text-primary/5",
          colorTransition,
          focusRing,
        )}
      >
        <Icon aria-hidden className={ICON_CLASS.sm} />
      </m.button>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        onChange={onChange}
        aria-label={copy.player.volume}
        aria-valuetext={`${percent}%`}
        data-lenis-prevent
        // Runtime value: how much of the track is filled.
        style={{ "--fill": `${percent}%` } as CSSProperties}
        className={cn(
          "volume-range h-6 min-w-0 flex-1 cursor-pointer appearance-none rounded-chip bg-transparent",
          focusRing,
        )}
      />
      <span
        aria-hidden
        className="w-10 shrink-0 text-right text-caption-1 font-mono text-text-secondary tabular-nums"
      >
        {percent}%
      </span>
    </div>
  );
}
