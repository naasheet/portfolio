"use client";

import { m } from "framer-motion";
import { useId, type ReactNode } from "react";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/lib/utils";
import type { OverlayProps } from "./Modal";
import { OverlayHeader } from "./OverlayHeader";
import { OverlayRoot } from "./OverlayRoot";
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
};

/**
 * Drops from the top: full width minus 12 px insets, 300 tall (resizable later; the handle
 * at the bottom is decorative for now). The terminal (6.1) is its only user.
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
  children,
  className,
}: DrawerProps) {
  const island = surface === "island";
  const titleId = useId();
  const motion = usePanelMotion({ y: "calc(-100% - 12px)" }, { y: 0 });

  return (
    <OverlayRoot open={open} onClose={onClose}>
      <m.div
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
          )}
        />
      </m.div>
    </OverlayRoot>
  );
}
