"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";

export type OverlayHeaderProps = {
  title: string;
  /** Names the dialog (aria-labelledby). */
  titleId: string;
  closeLabel: string;
  onClose: () => void;
  /** Small label above the title ("Case study"). */
  eyebrow?: string;
  eyebrowClassName?: string;
  /** One or two lines under the title (Modal). */
  description?: string;
  descriptionId?: string;
  /** Icon before the title (Drawer). */
  leading?: ReactNode;
  /** Extra content before the close button (Drawer's "close Esc" hint). */
  trailing?: ReactNode;
  titleClassName?: string;
  /** Restyle the leading icon and the close button (the Drawer's island surface, 6.1). */
  leadingClassName?: string;
  closeClassName?: string;
  className?: string;
};

/** Title block and close button, shared by Sheet, Modal and Drawer. */
export function OverlayHeader({
  title,
  titleId,
  closeLabel,
  onClose,
  eyebrow,
  eyebrowClassName,
  description,
  descriptionId,
  leading,
  trailing,
  titleClassName,
  leadingClassName,
  closeClassName,
  className,
}: OverlayHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 items-center gap-2 self-center">
        {leading ? (
          <span
            aria-hidden
            className={cn(
              "inline-flex text-text-secondary [&_svg]:size-4",
              leadingClassName,
            )}
          >
            {leading}
          </span>
        ) : null}
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow ? (
            <span
              className={cn(
                "text-footnote text-text-secondary",
                eyebrowClassName,
              )}
            >
              {eyebrow}
            </span>
          ) : null}
          <h2
            id={titleId}
            className={cn("text-title-3 font-semibold", titleClassName)}
          >
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="text-subhead text-text-secondary">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {trailing}
        <IconButton
          aria-label={closeLabel}
          icon={<X />}
          onClick={onClose}
          className={closeClassName}
        />
      </div>
    </div>
  );
}
