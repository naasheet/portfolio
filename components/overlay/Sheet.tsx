"use client";

import { m, useDragControls, type PanInfo } from "framer-motion";
import { useId, type PointerEvent, type ReactNode } from "react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import type { OverlayProps } from "./Modal";
import { OverlayHeader } from "./OverlayHeader";
import { OverlayRoot } from "./OverlayRoot";
import { usePanelMotion } from "./usePanelMotion";

/** Drag further than this (px) or flick faster than DISMISS_VELOCITY (px/s) to dismiss. */
const DISMISS_OFFSET = 120;
const DISMISS_VELOCITY = 500;

export type SheetProps = OverlayProps & {
  /** Small label above the title ("Case study"). */
  eyebrow?: string;
  /** Sticky footer actions (e.g. Close and a primary action). Full width on phones. */
  footer?: ReactNode;
  /** Restyle the eyebrow (the queue's mono caption, 5.3). */
  eyebrowClassName?: string;
  titleClassName?: string;
};

const PANEL =
  "flex flex-col overflow-hidden border border-border-default bg-surface-solid shadow-overlay";

/**
 * For longer content (case studies). A header with an optional eyebrow, a scrolling body and a
 * sticky footer. Desktop (768 px and up): 480 wide, inset 12 from the edges, slides in from the
 * right. Phones: a bottom sheet (90% max height) dragged down by its handle to dismiss (Framer
 * drag="y"; the drag feature loads only when a phone sheet first opens). Fades only under
 * reduced motion.
 */
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  eyebrow,
  footer,
  eyebrowClassName,
  titleClassName,
  children,
  className,
}: SheetProps) {
  const titleId = useId();
  const desktop = useMediaQuery("(min-width: 48rem)");
  const controls = useDragControls();
  const side = usePanelMotion({ x: "calc(100% + 12px)" }, { x: 0 });
  const bottom = usePanelMotion({ y: "100%" }, { y: 0 });

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) {
      onClose();
    }
  };

  const startDrag = (e: PointerEvent<HTMLDivElement>) => controls.start(e);

  const sections = (phone: boolean) => (
    <>
      <OverlayHeader
        title={title}
        titleId={titleId}
        eyebrow={eyebrow}
        eyebrowClassName={eyebrowClassName}
        titleClassName={titleClassName}
        closeLabel={closeLabel}
        onClose={onClose}
        className={cn(
          "border-b border-border-default px-6 pb-4",
          phone ? "pt-2" : "pt-6",
        )}
      />
      <div
        data-lenis-prevent
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6"
      >
        {children}
      </div>
      {footer ? (
        <div
          className={cn(
            "flex gap-2 border-t border-border-default px-6 pt-4",
            phone
              ? "pb-[max(16px,env(safe-area-inset-bottom))] [&>*]:flex-1"
              : "justify-end pb-4",
          )}
        >
          {footer}
        </div>
      ) : null}
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
            PANEL,
            "absolute top-3 right-3 bottom-3 w-120 max-w-[calc(100vw-24px)] rounded-card",
            className,
          )}
          {...side}
        >
          {sections(false)}
        </m.div>
      ) : (
        <m.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            PANEL,
            "absolute inset-x-0 bottom-0 max-h-[90dvh] rounded-t-card border-b-0",
            className,
          )}
          {...bottom}
          drag="y"
          dragListener={false}
          dragControls={controls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={onDragEnd}
        >
          {/* The handle row is the drag area, so the body can still scroll. */}
          <div
            aria-hidden
            onPointerDown={startDrag}
            className="flex h-6 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          >
            <span className="h-1 w-10 rounded-chip bg-border-default" />
          </div>
          {sections(true)}
        </m.div>
      )}
    </OverlayRoot>
  );
}
