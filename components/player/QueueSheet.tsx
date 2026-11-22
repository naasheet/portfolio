"use client";

import { useState, type KeyboardEvent } from "react";
import { copy } from "@/content/copy";
import { tracks } from "@/content/music";
import { TransitionLink } from "@/components/nav/TransitionLink";
import { Sheet } from "@/components/overlay/Sheet";
import { Kbd } from "@/components/ui/Kbd";
import { focusRing } from "@/components/ui/controlStyles";
import { island } from "@/lib/island";
import { getMusic } from "@/lib/music";
import { toggleSound } from "@/lib/shortcuts";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { QueueRow } from "./QueueRow";
import { VolumeControl } from "./VolumeControl";

const close = () => useStore.getState().ui.setQueueOpen(false);

/** Play track `i` with the 1.2 s crossfade (or resume it, if it's the current one). */
function playTrack(i: number) {
  const music = getMusic();
  if (!music) return;
  const { audio, ui } = useStore.getState();
  // Sound off (M) paused the music: turn it back on, as the island's play button does.
  if (!ui.soundEnabled) toggleSound();
  if (i !== audio.trackIndex) void music.load(i);
  else if (!audio.playing && ui.soundEnabled) void music.play();
}

/**
 * The music queue (Queue sheet frame, 5.3), opened from the island player's queue button: the 1.5
 * Sheet (desktop: the side sheet; phones: a bottom sheet at ~82 % of the screen). The list is
 * this visit's play order. Focus lands on the current track; ↑ / ↓ move between rows (one Tab
 * stop, roving), Enter plays, Tab reaches the volume; Esc closes and the trap hands focus back to
 * the island's queue button. Cover, controls and scrubber stay in the island.
 */
export default function QueueSheet() {
  const open = useStore((s) => s.ui.queueOpen);
  const current = useStore((s) => s.audio.trackIndex);
  const [focused, setFocused] = useState<number | null>(null);
  // The row in the Tab order: the one last focused, else the current track.
  const active = focused ?? current;
  const order = getMusic()?.getOrder() ?? tracks.map((_, i) => i);

  const onClose = () => {
    setFocused(null);
    close();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLOListElement>) => {
    const keys = ["ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const rows = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>("[data-queue-row]"),
    );
    const from = rows.findIndex((row) =>
      row.parentElement?.contains(document.activeElement),
    );
    if (from < 0) return;
    e.preventDefault();
    const to =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? rows.length - 1
          : Math.min(
              rows.length - 1,
              Math.max(0, from + (e.key === "ArrowDown" ? 1 : -1)),
            );
    rows[to]?.focus();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={copy.player.queue}
      eyebrow={copy.player.queueEyebrow(order.length)}
      eyebrowClassName="font-mono text-caption-2 tracking-wider uppercase"
      titleClassName="text-title-2 font-bold"
      closeLabel={copy.player.queueClose}
      className="max-md:h-[82dvh]"
      footer={
        <div className="flex w-full flex-col gap-4">
          <VolumeControl />
          <div className="flex items-center justify-between gap-4 text-caption-1 text-text-secondary">
            <span aria-hidden className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span className="mr-1">{copy.player.keysMove} ·</span>
              <Kbd>↵</Kbd>
              <span>{copy.player.keysPlay}</span>
            </span>
            <span>
              {copy.player.creditsBefore}{" "}
              <TransitionLink
                href="/credits"
                // /credits arrives in 11.2: until then a prefetch would only fetch a 404.
                prefetch={false}
                onClick={() => {
                  close();
                  island.collapse();
                }}
                className={cn(
                  "rounded-key text-text-primary underline-offset-2 hover:underline",
                  focusRing,
                )}
              >
                {copy.player.creditsLink}
              </TransitionLink>
            </span>
          </div>
        </div>
      }
    >
      <ol
        aria-label={copy.player.queue}
        onKeyDown={onKeyDown}
        className="-mx-2 -mt-2 flex flex-col gap-1"
      >
        {order.map((i) => {
          const track = tracks[i];
          if (!track) return null;
          return (
            <QueueRow
              key={track.id}
              track={track}
              current={i === current}
              tabbable={i === active}
              onPlay={() => playTrack(i)}
              onFocusRow={() => setFocused(i)}
            />
          );
        })}
      </ol>
    </Sheet>
  );
}
