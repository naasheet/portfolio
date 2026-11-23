"use client";

import { m } from "framer-motion";
import { useId, useRef, type ReactNode } from "react";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/lib/utils";
import type { OverlayProps } from "./Modal";
import { OverlayHeader } from "./OverlayHeader";
import { OverlayRoot } from "./OverlayRoot";
import { useDrawerResize, type DrawerResize } from "./useDrawerResize";
import { usePanelMotion } from "./usePanelMotion";

export type DrawerProps = OverlayProps & {
  /** Icon before the title (the terminal's >_). */
  icon?: ReactNode;
  /** Word shown before the Esc key cap ("close"). Omit to hide the hint. */
  escHint?: string;
  /**
   * "solid" (default): surface/solid, following the theme. "island": the island's near-black
   * tokens in both themes (the terminal, 6.1).
   */
  surface?: "solid" | "island";
  /**
   * 6.6: the bottom handle resizes the drawer from md up (drag, or ↑ ↓ Home End when focused),
   * and the height is remembered. Without it the handle is decorative. `resizeLabel` names it.
   */
  resizable?: DrawerResize;
  resizeLabel?: string;
};

const ISLAND = {
  panel: "border-island-border bg-island-bg text-island-text",
  header: "border-island-border",
  leading: "text-island-text-secondary",
  close:
    "border-island-border bg-transparent text-island-text hover:border-island-text-secondary hover:bg-island-text/10",
  hint: "text-island-text-secondary",
  kbd: "border-island-border bg-island-bg text-island-text-secondary",
  handle: "bg-island-border",
  grip: "group-hover/handle:bg-island-text-secondary group-data-dragging/handle:bg-island-accent group-focus-visible/handle:bg-island-accent",
};

/**
 * Drops from the top: full width minus 12 px insets, 300 tall. With `resizable` (6.6) its bottom
 * handle resizes it on desktop. The terminal (6.1) is its only user.
 * Fades only under reduced motion.
 */
export function Drawer({
  open,
  onClose,
  title,
  closeLabel,
  icon,
  escHint,
  surface = "solid",
  resizable,
  resizeLabel,
  children,
  className,
}: DrawerProps) {
  const island = surface === "island";
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const resize = useDrawerResize(panel, handle, resizable, open);
  const motion = usePanelMotion({ y: "calc(-100% - 12px)" }, { y: 0 });

  return (
    <OverlayRoot open={open} onClose={onClose}>
      <m.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute inset-x-3 top-3 flex h-75 max-h-[calc(100dvh-24px)] flex-col overflow-hidden rounded-card border border-border-default bg-surface-solid shadow-overlay",
          island && ISLAND.panel,
          className,
        )}
        {...motion}
      >
        <OverlayHeader
          title={title}
          titleId={titleId}
          closeLabel={closeLabel}
          onClose={onClose}
          leading={icon}
          titleClassName="text-subhead"
          leadingClassName={island ? ISLAND.leading : undefined}
          closeClassName={island ? ISLAND.close : undefined}
          trailing={
            escHint ? (
              <span
                aria-hidden
                className={cn(
                  "hidden items-center gap-2 text-footnote text-text-tertiary sm:flex",
                  island && ISLAND.hint,
                )}
              >
                {escHint}
                <Kbd className={island ? ISLAND.kbd : undefined}>Esc</Kbd>
              </span>
            ) : null
          }
          className={cn(
            "border-b border-border-default px-6 py-2",
            island && ISLAND.header,
          )}
        />
        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4"
        >
          {children}
        </div>
        <span
          aria-hidden
          className={cn(
            "absolute bottom-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-chip bg-border-default",
            island && ISLAND.handle,
            resizable && "md:hidden",
          )}
        />
        {resizable ? (
          // A 24 px grab strip along the bottom edge, with the grip drawn in the middle.
          <div
            ref={handle}
            role="separator"
            aria-orientation="horizontal"
            aria-label={resizeLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            onPointerDown={resize.onPointerDown}
            onKeyDown={resize.onKeyDown}
            className={cn(
              "group/handle absolute inset-x-0 bottom-0 hidden h-6 cursor-ns-resize touch-none items-end justify-center pb-2 outline-none md:flex",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "h-1 w-10 rounded-chip bg-border-default transition-colors duration-150 ease-out group-hover/handle:bg-text-tertiary group-focus-visible/handle:bg-border-focus group-data-dragging/handle:bg-accent-primary",
                island && ISLAND.handle,
                island && ISLAND.grip,
              )}
            />
          </div>
        ) : null}
      </m.div>
    </OverlayRoot>
  );
}
