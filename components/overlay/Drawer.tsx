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
  children,
  className,
}: DrawerProps) {
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
          trailing={
            escHint ? (
              <span
                aria-hidden
                className="hidden items-center gap-2 text-footnote text-text-tertiary sm:flex"
              >
                {escHint}
                <Kbd>Esc</Kbd>
              </span>
            ) : null
          }
          className="border-b border-border-default px-6 py-2"
        />
        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4"
        >
          {children}
        </div>
        <span
          aria-hidden
          className="absolute bottom-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-chip bg-border-default"
        />
      </m.div>
    </OverlayRoot>
  );
}
