"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useStore } from "@/lib/store";

const TerminalDrawer = dynamic(() => import("./TerminalDrawer"), {
  ssr: false,
});

/**
 * Mount point for the terminal drawer (6.1), in the persistent layer. The drawer's code loads the
 * first time ui.terminalOpen turns true (CLAUDE.md §5.7), then stays mounted so it can animate
 * out and keep its state.
 */
export function TerminalDrawerSlot() {
  const open = useStore((s) => s.ui.terminalOpen);
  const [loaded, setLoaded] = useState(false);
  if (open && !loaded) setLoaded(true);
  return loaded ? <TerminalDrawer /> : null;
}
