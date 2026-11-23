"use client";

import { ArrowLeft, Terminal as TerminalIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { terminalCopy } from "@/content/terminal";
import { IconButton } from "@/components/ui/IconButton";
import { lockScroll, unlockScroll } from "@/lib/motion/lenis";
import { leaveTerminal } from "@/lib/shortcuts";

// The shell and the commands load on demand (CLAUDE.md §5.7); the frame paints at once.
const Terminal = dynamic(() => import("./Terminal").then((m) => m.Terminal), {
  ssr: false,
});
const QuickChips = dynamic(
  () => import("./QuickChips").then((m) => m.QuickChips),
  { ssr: false },
);

const t = terminalCopy.terminal;

const noSubscribe = () => () => {};

/**
 * The full-page terminal (6.6), where phones open it (openTerminal in lib/shortcuts.ts). It covers
 * the nav and the Ask pill (z-overlay, portalled to <body>: <main> is its own stacking context
 * under the nav): a header with Back, the same Terminal as the drawer, and
 * the quick-command chips pinned at the bottom.
 *
 * The on-screen keyboard: the panel follows `visualViewport` (its height, and its offset when
 * iOS scrolls the layout viewport), written to the element's style through a ref, so the chips
 * and the input always sit just above the keyboard with no React render. The page underneath is
 * scroll-locked while it's open.
 */
export function TerminalPage() {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // Portalled once mounted (the server and hydration render nothing; the shell loads lazily anyway).
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    const el = panel.current;
    if (!vv || !el) return;
    const fit = () => {
      el.style.height = `${vv.height}px`;
      el.style.transform = `translateY(${vv.offsetTop}px)`;
      // With the keyboard up the home indicator is hidden: no safe-area gap under the chips.
      el.toggleAttribute("data-keyboard", window.innerHeight - vv.height > 120);
      // The keyboard came up (or went down): keep the newest line and the input in view.
      const s = scroller.current;
      if (s) s.scrollTop = s.scrollHeight;
    };
    fit();
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
    return () => {
      vv.removeEventListener("resize", fit);
      vv.removeEventListener("scroll", fit);
    };
  }, [mounted]);

  // Esc leaves (as it closes the drawer), unless an overlay is open over the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (document.querySelector("[data-overlay]")) return;
      leaveTerminal(router);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (!mounted) return null;
  return createPortal(
    <div
      ref={panel}
      data-terminal-page
      className="group fixed inset-x-0 top-0 z-overlay flex h-dvh flex-col bg-island-bg pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-island-text"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-island-border py-2 pr-2 pl-4">
        <TerminalIcon
          aria-hidden
          className="size-5 text-island-text-secondary"
        />
        <h1 className="flex-1 text-subhead font-semibold">{t.title}</h1>
        <IconButton
          aria-label={t.page.back}
          icon={<ArrowLeft />}
          onClick={() => leaveTerminal(router)}
          className="border-island-border bg-transparent text-island-text hover:border-island-text-secondary hover:bg-island-text/10"
        />
      </header>
      <div
        ref={scroller}
        data-lenis-prevent
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
      >
        <Terminal suggestions={false} />
      </div>
      <div className="shrink-0 pb-[env(safe-area-inset-bottom)] group-data-keyboard:pb-0">
        <QuickChips />
      </div>
    </div>,
    document.body,
  );
}
