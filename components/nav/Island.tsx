"use client";

import { AnimatePresence, LayoutGroup, m } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { chapterNumber, chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { focusRing } from "@/components/ui/controlStyles";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import {
  getIsland,
  getServerIsland,
  island,
  subscribeIsland,
  type IslandActivity,
} from "@/lib/island";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChapterLink } from "./ChapterLink";
import { EqBars } from "./EqBars";
import { IslandAlertView } from "./IslandAlert";

/** Retract the links this long after the pointer leaves (Navigation board). */
const RETRACT_MS = 400;

type Shape = "idle" | "live" | "nav" | "alert" | "expanded";

/** Corner radius per shape: half the height for pills, 28 for the card (Island board). */
const RADIUS: Record<Shape, number> = {
  idle: 22,
  live: 22,
  nav: 24,
  alert: 26,
  expanded: 28,
};

/** Desktop hover-to-open: a fine pointer and the full nav row (lg, 64rem). */
const desktopHover = () =>
  window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 64rem)")
    .matches;
const desktopWidth = () => window.matchMedia("(min-width: 64rem)").matches;

/**
 * The centre of the nav and the site's live-activity centre (Island board). One near-black
 * shape that morphs (Framer layout, 350 ms soft spring; a 150 ms fade under reduced motion)
 * between: idle (where you are), nav (the six links, on hover or keyboard focus, desktop only),
 * live (an activity's leading and trailing slots), split (plus a circle for a second
 * activity), alert (2.5 s confirmations) and expanded (an activity's card).
 * On phones and touch screens, the centre opens the menu instead of the links.
 */
export function Island() {
  const state = useSyncExternalStore(
    subscribeIsland,
    getIsland,
    getServerIsland,
  );
  const chapter = useStore((s) => s.scroll.chapter);
  const playing = useStore((s) => s.audio.playing);
  const menuOpen = useStore((s) => s.ui.menuOpen);
  const reduced = useReducedMotion();

  const [navOpen, setNavOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const retract = useRef<number | undefined>(undefined);
  const focusCurrentLink = useRef(false);

  const expanded = state.expandedId
    ? state.activities.find((a) => a.id === state.expandedId)
    : undefined;
  const [primary, secondary] = state.activities;
  const shape: Shape = state.alert
    ? "alert"
    : expanded
      ? "expanded"
      : navOpen
        ? "nav"
        : primary
          ? "live"
          : "idle";

  const current =
    chapters[Math.min(chapter, chapters.length - 1)] ?? chapters[0];
  const number = chapterNumber(chapters.indexOf(current));

  useEffect(() => () => window.clearTimeout(retract.current), []);

  // Opened from the keyboard: move focus onto the current link once the links exist.
  useEffect(() => {
    if (shape !== "nav" || !focusCurrentLink.current) return;
    focusCurrentLink.current = false;
    root.current
      ?.querySelector<HTMLElement>("[aria-current='location']")
      ?.focus();
  }, [shape]);

  // An expanded card closes on Esc or a click outside the island.
  useEffect(() => {
    if (!expanded) return;
    const onDown = (e: globalThis.PointerEvent) => {
      if (e.target instanceof Node && !root.current?.contains(e.target))
        island.collapse();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector("[data-overlay]"))
        return;
      e.preventDefault();
      island.collapse();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const open = () => {
    window.clearTimeout(retract.current);
    setNavOpen(true);
  };

  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && desktopHover()) open();
  };

  const onPointerLeave = () => {
    window.clearTimeout(retract.current);
    retract.current = window.setTimeout(() => {
      // Never retract while the links hold keyboard focus.
      if (root.current?.contains(document.activeElement)) return;
      setNavOpen(false);
    }, RETRACT_MS);
  };

  const onFocus = (e: FocusEvent) => {
    if (!desktopWidth() || navOpen) return;
    if (!(e.target instanceof Element) || !e.target.matches(":focus-visible"))
      return;
    if (e.target.hasAttribute("data-island-centre")) {
      focusCurrentLink.current = true;
      open();
    }
  };

  const onBlur = (e: FocusEvent) => {
    const next = e.relatedTarget;
    if (next instanceof Node && root.current?.contains(next)) return;
    if (root.current?.matches(":hover")) return;
    setNavOpen(false);
  };

  const onCentreClick = () => {
    if (desktopWidth() && desktopHover()) open();
    else useStore.getState().ui.setMenuOpen(true);
  };

  const layoutTransition = reduced
    ? { duration: 0 }
    : { type: "spring" as const, duration: 0.35, bounce: 0.15 };
  const fade = { duration: reduced ? 0.15 : 0.2 };

  const centre = (small: boolean) => (
    <button
      type="button"
      data-island-centre
      data-cursor="orbit"
      aria-label={`${copy.nav.island}: ${number} ${current.name}`}
      aria-expanded={navOpen || menuOpen}
      onClick={onCentreClick}
      className={cn(
        "flex h-full cursor-pointer items-center gap-2 rounded-chip px-4",
        focusRing,
      )}
    >
      <span className="text-caption-2 font-mono text-island-accent">
        {number}
      </span>
      <span
        className={cn(
          "text-island-text",
          small ? "text-footnote" : "text-subhead font-semibold",
        )}
      >
        {current.name}
      </span>
      {small ? null : <ChapterDots current={chapters.indexOf(current)} />}
      {small || !playing ? null : (
        <EqBars className="ml-1 text-island-accent" />
      )}
    </button>
  );

  const slot = (activity: IslandActivity, content: ReactNode, key: string) => (
    <button
      key={key}
      type="button"
      data-cursor="orbit"
      aria-label={activity.label}
      onClick={() => island.expand(activity.id)}
      className={cn(
        "flex h-full shrink-0 cursor-pointer items-center justify-center rounded-chip px-2",
        focusRing,
      )}
    >
      {content}
    </button>
  );

  let content: ReactNode;
  if (shape === "alert" && state.alert) {
    content = <IslandAlertView alert={state.alert} />;
  } else if (shape === "expanded" && expanded) {
    content = (
      <div className="w-90 max-w-[calc(100vw-32px)] p-4">
        {expanded.expanded}
      </div>
    );
  } else if (shape === "nav") {
    content = (
      <ul className="flex h-full items-center gap-1 px-1">
        {chapters.map((c, i) => {
          const isCurrent = c === current;
          return (
            <li key={c.id} className="relative h-10">
              {isCurrent ? (
                <m.span
                  aria-hidden
                  layoutId="island-current"
                  className="absolute inset-0 rounded-chip bg-island-text"
                  transition={layoutTransition}
                />
              ) : null}
              <ChapterLink
                chapter={c.id}
                aria-current={isCurrent ? "location" : undefined}
                className={cn(
                  "relative flex h-full items-center rounded-chip px-4 text-subhead transition-colors duration-150 ease-out",
                  isCurrent
                    ? "text-island-bg"
                    : "text-island-text-secondary hover:text-island-text",
                  focusRing,
                )}
              >
                <span className="sr-only">{chapterNumber(i)} </span>
                {c.name}
              </ChapterLink>
            </li>
          );
        })}
      </ul>
    );
  } else if (shape === "live" && primary) {
    content = (
      <div className="flex h-full items-center pr-1 pl-1">
        {primary.lead ? slot(primary, primary.lead, "lead") : null}
        {centre(true)}
        {primary.trail ? slot(primary, primary.trail, "trail") : null}
      </div>
    );
  } else {
    content = centre(false);
  }

  const height =
    shape === "nav"
      ? "h-12"
      : shape === "alert"
        ? "h-13"
        : shape === "expanded"
          ? ""
          : "h-11";

  return (
    <div
      ref={root}
      className="flex items-center gap-2"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <LayoutGroup>
        <m.div
          layout
          data-island={shape}
          className={cn(
            "relative flex items-center overflow-hidden border border-island-border bg-island-bg text-island-text shadow-lift",
            height,
          )}
          style={{ borderRadius: RADIUS[shape] }}
          transition={{ layout: layoutTransition }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <m.div
              key={shape === "alert" ? `alert-${state.alert?.id}` : shape}
              layout="position"
              className="flex h-full items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ...fade, layout: layoutTransition }}
            >
              {content}
            </m.div>
          </AnimatePresence>
        </m.div>
        <AnimatePresence initial={false}>
          {secondary && shape === "live" ? (
            <m.button
              key={secondary.id}
              layout
              type="button"
              data-cursor="orbit"
              aria-label={secondary.label}
              onClick={() => island.expand(secondary.id)}
              className={cn(
                "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-chip border border-island-border bg-island-bg text-island-text shadow-lift",
                focusRing,
              )}
              initial={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
              transition={{ ...fade, layout: layoutTransition }}
            >
              {secondary.lead}
            </m.button>
          ) : null}
        </AnimatePresence>
      </LayoutGroup>
      <p aria-live="polite" className="sr-only">
        {state.alert
          ? [state.alert.text, state.alert.detail].filter(Boolean).join(". ")
          : ""}
      </p>
    </div>
  );
}

/** Six dots, the current one stretched into a teal dash (moved with layout = transform). */
function ChapterDots({ current }: { current: number }) {
  return (
    <span aria-hidden className="flex items-center gap-1">
      {chapters.map((c, i) => (
        <m.span
          key={c.id}
          layout
          transition={{ type: "spring", duration: 0.35, bounce: 0 }}
          className={cn(
            "h-1 rounded-chip",
            i === current
              ? "w-4 bg-island-accent"
              : "w-1 bg-island-text-secondary/50",
          )}
        />
      ))}
    </span>
  );
}
