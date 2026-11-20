"use client";

import dynamic from "next/dynamic";

// The shortcut map and its actions load right after hydration (keys can't matter before).
const ShortcutsProvider = dynamic(
  () => import("./ShortcutsProvider").then((mod) => mod.ShortcutsProvider),
  { ssr: false },
);

/** Mounts the one keyboard-shortcut listener (lib/shortcuts.ts) once in app/layout.tsx. */
export function ShortcutsLoader() {
  return <ShortcutsProvider />;
}
