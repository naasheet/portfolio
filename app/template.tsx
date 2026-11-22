"use client";

import { usePathname } from "next/navigation";
import {
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  endLeaving,
  isLeaving,
  subscribeLeaving,
  takeSharedNav,
  takePushed,
} from "@/lib/motion/pageTransition";
import {
  placeNewPage,
  setScrollPath,
  startScrollMemory,
} from "@/lib/motion/scrollMemory";

// The first page of a visit doesn't animate in (the gate or the first paint covers it).
let firstPage = true;

const serverLeaving = () => false;

/**
 * Page transitions (2.5). Next mounts a new template for every route. The motion is CSS
 * (`.page` in globals.css: opacity and transform, 300 ms), not Framer: an `m.div` here would
 * put Framer's motion component into first-load JS on `/` (+5.8 KB).
 * - Enter: the page starts at `data-page="from"` (transparent, 12 px down) and moves to "in"
 *   on the next frame.
 * - Exit: while TransitionLink's `leaving` flag is set, `data-page="leave"` (fade, 12 px up).
 * Before the first paint it places the page: Back / Forward restores the saved position, a
 * #hash goes to its section, anything else starts at the top. Reduced motion: no transition.
 * This runs on every pathname change, since nested routes (/work → /work/[slug]) share one
 * template instance.
 */
export default function Template({ children }: { children: ReactNode }) {
  const leaving = useSyncExternalStore(
    subscribeLeaving,
    isLeaving,
    serverLeaving,
  );
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useLayoutEffect(() => {
    startScrollMemory();
    setScrollPath(pathname);
    const pushed = takePushed();
    const shared = takeSharedNav();
    endLeaving();
    if (firstPage) {
      firstPage = false;
      return;
    }
    placeNewPage(pathname, !pushed);
    // A shared-element navigation (4.5): the View Transition is the animation, so no CSS enter.
    if (shared) return;
    const el = ref.current;
    if (!el) return;
    el.dataset.page = "from";
    const frame = requestAnimationFrame(() => {
      // Read layout once so "from" is applied before the transition to "in" starts.
      void el.offsetHeight;
      el.dataset.page = "in";
    });
    return () => cancelAnimationFrame(frame);
    // Per pathname, not per mount: Next keys this root template by the first segment only, so
    // /work → /work/[slug] (4.5) keeps the same instance and must still place and enter the page.
    // Query-only changes (Work's ?stack= filter) don't change the pathname, so they never get here.
  }, [pathname]);

  return (
    <div ref={ref} className="page" data-leaving={leaving ? "" : undefined}>
      {children}
    </div>
  );
}
