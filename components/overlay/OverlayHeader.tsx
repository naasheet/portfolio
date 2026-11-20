"use client";

import { X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

/** Title (which names the dialog through titleId) and the close button. */
export function OverlayHeader({
  title,
  titleId,
  closeLabel,
  onClose,
}: {
  title: string;
  titleId: string;
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 id={titleId} className="text-title-3 font-semibold">
        {title}
      </h2>
      <IconButton aria-label={closeLabel} icon={<X />} onClick={onClose} />
    </div>
  );
}
