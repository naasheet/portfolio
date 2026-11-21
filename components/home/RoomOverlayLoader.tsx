"use client";

import dynamic from "next/dynamic";

// Loaded after hydration, so the room's hover layer stays out of first-load JS on `/` (§6).
const RoomOverlay = dynamic(
  () => import("./RoomOverlay").then((mod) => mod.RoomOverlay),
  { ssr: false },
);

/** Mounts the particle room's hover, tags and card layer (R.4) on Home. */
export function RoomOverlayLoader() {
  return <RoomOverlay />;
}
