"use client";

import dynamic from "next/dynamic";

// Client only and loaded after hydration (CLAUDE.md §5.7): the canvas never renders on the server.
const CanvasRoot = dynamic(
  () => import("@/canvas/CanvasRoot").then((mod) => mod.CanvasRoot),
  { ssr: false },
);

/** Mounts the canvas once in app/layout.tsx. */
export function CanvasLoader() {
  return <CanvasRoot />;
}
