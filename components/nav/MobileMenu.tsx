"use client";

import { X } from "lucide-react";
import { m } from "framer-motion";
import { useRouter } from "next/navigation";
import { useId, type MouseEvent } from "react";
import { chapterNumber, chapters, type PageId } from "@/content/chapters";
import { copy } from "@/content/copy";
import { OverlayRoot } from "@/components/overlay/OverlayRoot";
import { usePanelMotion } from "@/components/overlay/usePanelMotion";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { focusRing } from "@/components/ui/controlStyles";
import { navigate } from "@/lib/motion/pageTransition";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ModeSwitch } from "./ModeSwitch";
import { NavCircles } from "./NavCircles";
import { SoundButton } from "./SoundButton";
import { LogoDots } from "./Wordmark";
import { navCircle } from "./navStyles";

/** 40 ms apart (Navigation board), after the panel has started to fade in. */
const STAGGER_S = 0.04;
const FIRST_DELAY_S = 0.08;

/**
 * The phone menu (Navigation board): a full-screen panel over the blurred particles. Numbered
 * chapter links in 34 px Display with a one-line subtitle each, staggered in; the current one
 * is a solid light pill. Then the Mouse | Hand switch with the terminal, theme and sound
 * circles, and "Get in touch". Opened by tapping the island (ui.menuOpen).
 */
export function MobileMenu() {
  const open = useStore((s) => s.ui.menuOpen);
  const page = useStore((s) => s.page.id);
  const setOpen = useStore((s) => s.ui.setMenuOpen);
  const router = useRouter();
  const titleId = useId();
  const motion = usePanelMotion({ opacity: 0 }, { opacity: 1 });

  const close = () => setOpen(false);

  // Each chapter is its own route (R.1): close the menu and leave with the page transition.
  // The current page just closes the menu.
  const go = (id: PageId, e?: MouseEvent) => {
    e?.preventDefault();
    close();
    if (id === page) return;
    const route = chapters.find((c) => c.id === id)?.route ?? "/";
    navigate(router, route);
  };

  return (
    <OverlayRoot open={open} onClose={close}>
      <m.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-lenis-prevent
        className="absolute inset-0 flex flex-col gap-6 overflow-y-auto overscroll-contain bg-bg-base/70 pt-(--nav-inset-top) pr-(--layer-inset-right) pb-(--layer-inset-bottom) pl-(--layer-inset-left) backdrop-blur-glass"
        {...motion}
      >
        <h2 id={titleId} className="sr-only">
          {copy.nav.menuTitle}
        </h2>
        <div className="flex items-center justify-between">
          <span className="flex h-11 items-center gap-2 rounded-chip glass px-4 text-headline">
            <LogoDots />
            {copy.nav.wordmark}
          </span>
          <IconButton
            aria-label={copy.nav.close}
            icon={<X />}
            onClick={close}
            className={navCircle}
          />
        </div>

        <nav aria-label={copy.nav.label} className="flex-1">
          <ol className="flex flex-col gap-1">
            {chapters.map((c, i) => {
              const current = c.id === page;
              return (
                <m.li
                  key={c.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: FIRST_DELAY_S + i * STAGGER_S,
                    type: "spring",
                    duration: 0.4,
                    bounce: 0,
                  }}
                >
                  <a
                    href={c.route}
                    aria-current={current ? "location" : undefined}
                    onClick={(e) => go(c.id, e)}
                    className={cn(
                      "flex items-baseline gap-3 rounded-card px-4 py-2 transition-colors duration-150 ease-out",
                      current
                        ? "bg-text-primary text-bg-base"
                        : "text-text-primary hover:bg-surface-glass",
                      focusRing,
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 shrink-0 text-caption-2 font-mono",
                        current ? "text-bg-base/70" : "text-text-tertiary",
                      )}
                    >
                      {chapterNumber(i)}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-large-title font-semibold">
                        {c.name}
                      </span>
                      <span
                        className={cn(
                          "text-footnote",
                          current ? "text-bg-base/70" : "text-text-secondary",
                        )}
                      >
                        {c.subtitle}
                      </span>
                    </span>
                  </a>
                </m.li>
              );
            })}
          </ol>
        </nav>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ModeSwitch compact />
            <NavCircles />
            <SoundButton />
          </div>
          <Button size="lg" className="w-full" onClick={() => go("contact")}>
            {copy.nav.getInTouch}
          </Button>
        </div>
      </m.div>
    </OverlayRoot>
  );
}
