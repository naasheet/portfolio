"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { handleShortcut, setShortcutRouter } from "@/lib/shortcuts";

/**
 * Mounts the one keyboard-shortcut listener (lib/shortcuts.ts) and hands it the router (for
 * Home's 2–6 page keys). Renders nothing.
 */
export function ShortcutsProvider() {
  const router = useRouter();
  useEffect(() => {
    setShortcutRouter(router);
    document.addEventListener("keydown", handleShortcut);
    return () => {
      document.removeEventListener("keydown", handleShortcut);
      setShortcutRouter(null);
    };
  }, [router]);
  return null;
}
