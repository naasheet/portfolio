"use client";

import { LazyMotion, m, useDragControls, type PanInfo } from "framer-motion";
import { useId, type PointerEvent } from "react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import type { OverlayProps } from "./Modal";
import { OverlayHeader } from "./OverlayHeader";
import { OverlayRoot } from "./OverlayRoot";

/** Drag further than this (px) or flick faster than DISMISS_VELOCITY (px/s) to dismiss. */
const DISMISS_OFFSET = 120;
const DISMISS_VELOCITY = 500;

const loadDrag = () => import("./sheetFeatures").then((mod) => mod.default);

/**
 * Desktop (768 px and up): a panel that slides in from the right. Phones: a bottom sheet that
 * can be dragged down by its handle to dismiss (Framer drag="y"; the drag feature loads only
 * when a sheet first opens). Content scrolls inside; the page behind stays locked.
 */
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  children,
  className,
}: OverlayProps) {
  const titleId = useId();
  const desktop = useMediaQuery("(min-width: 48rem)");
  const controls = useDragControls();

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) {
      onClose();
    }
  };

  const startDrag = (e: PointerEvent<HTMLDivElement>) => controls.start(e);

  const body = (
    <>
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
    </>
  );

  return (
    <OverlayRoot open={open} onClose={onClose}>
      {desktop ? (
        <m.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            "absolute inset-y-0 right-0 flex w-full max-w-md flex-col gap-4 rounded-l-card border-l border-border-default bg-surface-solid p-6 shadow-overlay",
            className,
          )}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={spring.soft}
        >
          {body}
        </m.div>
      ) : (
        <LazyMotion features={loadDrag}>
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col gap-4 rounded-t-card border-t border-border-default bg-surface-solid px-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-overlay",
              className,
            )}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring.soft}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            {/* The handle row is the drag area, so content can still scroll. */}
            <div
              aria-hidden
              onPointerDown={startDrag}
              className="flex h-6 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
            >
              <span className="h-1 w-10 rounded-chip bg-border-default" />
            </div>
            {body}
          </m.div>
        </LazyMotion>
      )}
    </OverlayRoot>
  );
}
