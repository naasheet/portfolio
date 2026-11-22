"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { copy } from "@/content/copy";
import { tracks } from "@/content/music";
import { getIsland, island } from "@/lib/island";
import { MUSIC_ACTIVITY } from "@/lib/music";
import { useStore } from "@/lib/store";
import { Bars } from "./Bars";
import { Cover } from "./Cover";
import { PlayerCard } from "./PlayerCard";

const QueueSheet = dynamic(() => import("./QueueSheet"), { ssr: false });

/** Paused this long, the activity leaves the island (5.2). */
const LINGER_MS = 30_000;

/**
 * Puts the music into the island (5.2, Island board "Music · live"): album art leading, the bars
 * trailing, the page staying in the centre; either slot expands into PlayerCard. Mounted once
 * the engine exists (IslandMusicLoader). Paused, the activity stays with flat bars for 30 s, then
 * leaves. It also hosts the queue sheet (5.3), loaded the first time it opens and kept mounted
 * so it can animate out (it lives here, not in the card: an island alert swaps the card out).
 */
export default function IslandMusic() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const shown = () =>
      getIsland().activities.some((a) => a.id === MUSIC_ACTIVITY);

    const push = () => {
      const track = tracks[useStore.getState().audio.trackIndex];
      island.push({
        id: MUSIC_ACTIVITY,
        kind: "music",
        label: track
          ? copy.player.open(track.title, track.artist)
          : copy.player.play,
        lead: <Cover size={28} />,
        trail: <Bars className="text-island-accent" />,
        expanded: <PlayerCard />,
      });
    };

    const onPlaying = (playing: boolean) => {
      clearTimeout(timer);
      if (playing) {
        if (!shown()) push();
      } else if (shown()) {
        timer = setTimeout(() => island.remove(MUSIC_ACTIVITY), LINGER_MS);
      }
    };

    onPlaying(useStore.getState().audio.playing);
    const offPlaying = useStore.subscribe((s) => s.audio.playing, onPlaying);
    // The slot buttons' name says what's playing.
    const offTrack = useStore.subscribe(
      (s) => s.audio.trackIndex,
      () => {
        if (shown()) push();
      },
    );
    return () => {
      clearTimeout(timer);
      offPlaying();
      offTrack();
      island.remove(MUSIC_ACTIVITY);
    };
  }, []);

  const queueOpen = useStore((s) => s.ui.queueOpen);
  const [queueLoaded, setQueueLoaded] = useState(false);
  if (queueOpen && !queueLoaded) setQueueLoaded(true);

  return queueLoaded ? <QueueSheet /> : null;
}
