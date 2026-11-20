"use client";

import { m } from "framer-motion";
import { useId } from "react";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import type { OverlayProps } from "./Modal";
import { OverlayHeader } from "./OverlayHeader";
import { OverlayRoot } from "./OverlayRoot";

/** Slides down from the top, full width. The terminal lives in one from chunk 6.1. */
export function Drawer({
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
      <m.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute inset-x-0 top-0 flex max-h-[70dvh] flex-col gap-4 rounded-b-card border-b border-border-default bg-surface-solid p-6 shadow-overlay",
          className,
        )}
        initial={{ y: "-100%" }}
        animate={{ y: 0 }}
        exit={{ y: "-100%" }}
        transition={spring.soft}
      >
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4">
          <OverlayHeader
            title={title}
            titleId={titleId}
            closeLabel={closeLabel}
            onClose={onClose}
          />
          <div
            data-lenis-prevent
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            {children}
          </div>
        </div>
      </m.div>
    </OverlayRoot>
  );
}
