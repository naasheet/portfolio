"use client";

import { useEffect } from "react";
import { getIsland } from "@/lib/island";
import { isScrollLocked } from "@/lib/motion/lenis";
import { useStore } from "@/lib/store";

/** Hide only past this many px from the top (Navigation board). */
const HIDE_AFTER = 120;
/** Ignore tiny direction changes (trackpad jitter, Lenis settling). */
const MIN_DELTA = 4;

/**
 * Hides the nav row on scroll down after 120 px and brings it back on any scroll up. It only
 * toggles `data-hidden` on #site-nav; the CSS slide is a transform (a fade under reduced
 * motion). It never hides while the nav is hovered or holds focus (tooltips, the open island),
 * while the menu, the shortcuts or any overlay is open, or while the island shows an alert or
 * a card. Keyboard focus moving into a hidden nav shows it. Renders nothing.
 */
export function NavAutoHide() {
  useEffect(() => {
    const nav = document.getElementById("site-nav");
    if (!nav) return;
    let lastY = window.scrollY;

    const pinned = () => {
      const { ui } = useStore.getState();
      const { alert, expandedId } = getIsland();
      return (
        ui.menuOpen ||
        ui.shortcutsOpen ||
        isScrollLocked() ||
        alert !== null ||
        expandedId !== null ||
        nav.matches(":hover, :focus-within")
      );
    };

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) < MIN_DELTA) return;
      lastY = y;
      const hide = delta > 0 && y > HIDE_AFTER && !pinned();
      nav.toggleAttribute("data-hidden", hide);
    };
    const onFocusIn = () => nav.removeAttribute("data-hidden");

    window.addEventListener("scroll", onScroll, { passive: true });
    nav.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("scroll", onScroll);
      nav.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  return null;
}
