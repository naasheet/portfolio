"use client";

import { m } from "framer-motion";
import { useId, type ReactNode } from "react";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { OverlayHeader } from "./OverlayHeader";
import { OverlayRoot } from "./OverlayRoot";

export type OverlayProps = {
  open: boolean;
  onClose: () => void;
  /** Visible heading; it also names the dialog. */
  title: string;
  /** Accessible name of the close button (copy comes from content/). */
  closeLabel: string;
  children: ReactNode;
  className?: string;
};

/** A centred dialog on the solid surface. Scales in from 0.96 with the soft spring. */
export function Modal({
  open,
  onClose,
  title,
  closeLabel,
  children,
  className,
}: OverlayProps) {
  const titleId = useId();
  return (
    <OverlayRoot open={open} onClose={onClose}>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
        <m.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            "pointer-events-auto flex max-h-[85dvh] w-full max-w-lg flex-col gap-4 rounded-card border border-border-default bg-surface-solid p-6 shadow-overlay",
            className,
          )}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={spring.soft}
        >
          <OverlayHeader
            title={title}
            titleId={titleId}
            closeLabel={closeLabel}
            onClose={onClose}
          />
          <div
            data-lenis-prevent
            className="-mx-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2"
          >
            {children}
          </div>
        </m.div>
      </div>
    </OverlayRoot>
  );
}
