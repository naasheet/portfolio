"use client";

import { ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { copy } from "@/content/copy";
import type { RoomInfo } from "./roomInfo";

/**
 * The phone's selection sheet (R.5, "Home — phone 390", first tap): slides up from the bottom
 * with the object's number, name and line, an Open button and "Or tap the envelope again".
 * Not modal (no scrim, no focus trap): tapping the object again, the button, or empty space
 * decides. Above the Ask pill (z-overlay), padded clear of the home indicator. The slide is a
 * transform; the last object stays rendered while it slides away.
 */
export function PhoneSheet({
  info,
  open,
  onOpen,
}: {
  info: RoomInfo | null;
  open: boolean;
  onOpen: () => void;
}) {
  const t = copy.home.room;
  return createPortal(
    <section
      aria-label={t.sheetLabel}
      aria-hidden={!open}
      inert={!open}
      data-open={open ? "" : undefined}
      data-room-sheet
      className="phone-sheet fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-overlay rounded-card border border-border-default bg-surface-solid p-6 shadow-overlay"
    >
      <div aria-hidden className="mx-auto -mt-3 mb-4 h-1 w-10 rounded-chip bg-border-default" />
      {info ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="flex items-baseline gap-2">
              <span className="text-caption-1 font-mono text-accent-primary">{info.number}</span>
              <span className="text-title-3 font-semibold text-text-primary">{info.name}</span>
            </p>
            <p className="text-subhead text-text-secondary">{info.line}</p>
          </div>
          <Button size="lg" className="w-full" onClick={onOpen}>
            {t.openPage(info.name)}
            <ArrowRight aria-hidden className="size-4" />
          </Button>
          <p className="text-center text-footnote text-text-tertiary">{t.tapAgain(info.noun)}</p>
        </div>
      ) : null}
    </section>,
    document.body,
  );
}
