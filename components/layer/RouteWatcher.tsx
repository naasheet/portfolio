"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { pageFromPath } from "@/content/chapters";
import { useStore } from "@/lib/store";

/**
 * Sets the store's `page` from the URL (R.1), the only writer of it: /work/[slug] counts as
 * Work, /arcade/* as Arcade, anything else as none. It also keeps html[data-page] (set before
 * paint by ThemeScript from the same route table) in step on client navigation, so the CSS
 * and React never disagree. Mounted once in the persistent layer; renders nothing.
 */
export function RouteWatcher() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    const id = pageFromPath(pathname);
    useStore.getState().page.set(id);
    document.documentElement.dataset.page = id ?? "none";
  }, [pathname]);
  return null;
}
