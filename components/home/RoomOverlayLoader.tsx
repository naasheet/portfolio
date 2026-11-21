"use client";

import dynamic from "next/dynamic";

// Loaded after hydration, so the room's layers stay out of first-load JS on `/` (§6).
const RoomOverlay = dynamic(
  () => import("./RoomOverlay").then((mod) => mod.RoomOverlay),
  { ssr: false },
);
const RoomCards = dynamic(
  () => import("./RoomCards").then((mod) => mod.RoomCards),
  { ssr: false },
);

/**
 * Mounts the particle room's hover, tags, card and phone-sheet layer (R.4, R.5) on Home, and
 * the no-WebGL / Save-Data cards (which render nothing while the canvas runs).
 */
export function RoomOverlayLoader() {
  return (
    <>
      <RoomOverlay />
      <RoomCards />
    </>
  );
}
