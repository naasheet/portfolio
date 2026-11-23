"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";
import { pageFromPath } from "@/content/chapters";
import { useStore } from "@/lib/store";

/** This page's scroll, 0–1 (0 when it doesn't scroll). Lenis moves the native scroll, so this
 * reads the same with or without it. */
function pageProgress(): number {
  // clientHeight, not innerHeight: the visible viewport the browser scrolls (see SmoothScroll).
  const root = document.documentElement;
  const max = root.scrollHeight - root.clientHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

/**
 * Sets the store's `page` from the URL (R.1), the only writer of it: /work/[slug] counts as
 * Work, /arcade/* as Arcade, anything else as none. It also keeps html[data-page] (set before
 * paint by ThemeScript from the same route table) in step on client navigation, so the CSS
 * and React never disagree. And (R.2) it's the only writer of `scroll.progress`: the current
 * page's own scroll, which the canvas uses for uScroll and parallax. Mounted once in the
 * persistent layer; renders nothing.
 */
export function RouteWatcher() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    const id = pageFromPath(pathname);
    useStore.getState().page.set(id);
    document.documentElement.dataset.page = id ?? "none";
    // Runs after the template placed the new page (it's earlier in the tree).
    useStore.getState().scroll.setProgress(pageProgress());
  }, [pathname]);

  useEffect(() => {
    const update = () => useStore.getState().scroll.setProgress(pageProgress());
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return null;
}
