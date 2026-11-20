"use client";

import dynamic from "next/dynamic";

// Loaded after hydration, so the cursor costs nothing in first-load JS. It renders nothing on
// touch devices or with reduced motion.
const Cursor = dynamic(() => import("./Cursor").then((mod) => mod.Cursor), {
  ssr: false,
});

/** Mounts the custom cursor once in app/layout.tsx. */
export function CursorLoader() {
  return <Cursor />;
}
