"use client";

import { m } from "framer-motion";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { OverlayHeader } from "./OverlayHeader";
import { OverlayRoot } from "./OverlayRoot";
import { usePanelMotion } from "./usePanelMotion";

/** Props every overlay shares. */
export type OverlayProps = {
  open: boolean;
  onClose: () => void;
  /** Visible heading; it also names the dialog. */
  title: string;
  /** Accessible name of the close button (copy comes from content/). */
  closeLabel: string;
  children?: ReactNode;
  className?: string;
};

export type ModalProps = OverlayProps & {
  /** One or two lines: what this dialog is for and what happens next. */
  description?: string;
  /** Actions, right-aligned (e.g. Cancel and Confirm). */
  footer?: ReactNode;
  /** A backdrop click closes it. Off by default: modals ask to confirm. Esc still closes. */
  dismissOnBackdrop?: boolean;
};

/**
 * A centred dialog, 440 wide, used rarely: confirmations only. Title, description, close
 * button and right-aligned actions. Scales 0.96 → 1 with a fade (fade only under reduced
 * motion). A backdrop click does nothing unless dismissOnBackdrop is set.
 */
export function Modal({
  open,
  onClose,
  title,
  closeLabel,
  description,
  footer,
  dismissOnBackdrop = false,
  children,
  className,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const motion = usePanelMotion(
    { opacity: 0, scale: 0.96 },
    { opacity: 1, scale: 1 },
  );

  return (
    <OverlayRoot
      open={open}
      onClose={onClose}
      dismissOnBackdrop={dismissOnBackdrop}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
        <m.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            "pointer-events-auto flex max-h-[85dvh] w-110 max-w-full flex-col gap-6 rounded-card border border-border-default bg-surface-solid p-6 shadow-overlay",
            className,
          )}
          {...motion}
        >
          <OverlayHeader
            title={title}
            titleId={titleId}
            description={description}
            descriptionId={descriptionId}
            closeLabel={closeLabel}
            onClose={onClose}
          />
          {children ? (
            <div
              data-lenis-prevent
              className="-mx-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2"
            >
              {children}
            </div>
          ) : null}
          {footer ? (
            <div className="flex flex-wrap justify-end gap-2">{footer}</div>
          ) : null}
        </m.div>
      </div>
    </OverlayRoot>
  );
}
