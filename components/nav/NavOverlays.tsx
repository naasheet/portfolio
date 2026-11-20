"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";

// Loaded the first time each one opens, so neither counts against first-load JS.
const MobileMenu = dynamic(
  () => import("./MobileMenu").then((mod) => mod.MobileMenu),
  { ssr: false },
);
const ShortcutsOverlay = dynamic(
  () => import("./ShortcutsOverlay").then((mod) => mod.ShortcutsOverlay),
  { ssr: false },
);

/** Mounts the phone menu and the ? overlay once they've been asked for (they keep their exit). */
export function NavOverlays() {
  const menu = useStore((s) => s.ui.menuOpen);
  const shortcuts = useStore((s) => s.ui.shortcutsOpen);
  return (
    <>
      <Lazy when={menu}>
        <MobileMenu />
      </Lazy>
      <Lazy when={shortcuts}>
        <ShortcutsOverlay />
      </Lazy>
    </>
  );
}

/** Renders children from the first time `when` is true, and keeps them mounted after. */
function Lazy({ when, children }: { when: boolean; children: ReactNode }) {
  const [seen, setSeen] = useState(when);
  if (when && !seen) setSeen(true);
  return seen ? children : null;
}
