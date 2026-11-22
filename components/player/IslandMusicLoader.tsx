"use client";

import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";

const IslandMusic = dynamic(() => import("./IslandMusic"), { ssr: false });

/**
 * Loads the island's music activity (5.2) once the audio engine exists, so visitors who never
 * turn sound on download none of the player.
 */
export function IslandMusicLoader() {
  const enabled = useStore((s) => s.audio.enabled);
  return enabled ? <IslandMusic /> : null;
}
