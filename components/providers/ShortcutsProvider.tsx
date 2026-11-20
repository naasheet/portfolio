"use client";

import { useEffect } from "react";
import { handleShortcut } from "@/lib/shortcuts";

/** Mounts the one keyboard-shortcut listener (lib/shortcuts.ts). Renders nothing. */
export function ShortcutsProvider() {
  useEffect(() => {
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);
  return null;
}
