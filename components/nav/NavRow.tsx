import type { ReactNode } from "react";
import { copy } from "@/content/copy";

/**
 * The nav row's layout, shared by the static shell (server HTML) and the live nav, so the swap
 * after hydration doesn't move anything. Left and right groups at the edges, the island
 * centred on the row. `*Desktop` slots show from lg; the plain ones always show.
 */
export function NavRow({
  left,
  leftDesktop,
  centre,
  rightDesktop,
  right,
}: {
  left: ReactNode;
  leftDesktop: ReactNode;
  centre: ReactNode;
  rightDesktop: ReactNode;
  right: ReactNode;
}) {
  return (
    <nav
      aria-label={copy.nav.label}
      className="relative flex items-center justify-between gap-2 pt-(--nav-inset-top) pr-(--layer-inset-right) pl-(--layer-inset-left)"
    >
      <div className="pointer-events-auto flex items-center gap-2">
        <span className="lg:hidden">{left}</span>
        <span className="hidden lg:flex lg:items-center lg:gap-2">
          {leftDesktop}
        </span>
      </div>
      <div className="pointer-events-auto absolute top-(--nav-inset-top) left-1/2 z-10 flex max-w-[calc(100vw-128px)] -translate-x-1/2 justify-center">
        {centre}
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        <span className="hidden lg:flex lg:items-center lg:gap-2">
          {rightDesktop}
        </span>
        {right}
      </div>
    </nav>
  );
}
