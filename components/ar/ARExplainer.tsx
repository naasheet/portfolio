"use client";

import { Check, Hand, LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { arCopy } from "@/content/ar";
import { Modal } from "@/components/overlay/Modal";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { useStore } from "@/lib/store";
import { HandSkeleton } from "./HandSkeleton";

const t = arCopy.explainer;

const close = () => useStore.getState().ar.setExplainerOpen(false);

/**
 * Asking for the camera (8.1; AR board, "Explainer"): the 1.5 Modal at 520 wide over the dimmed
 * page. What Hand mode does, the three gestures, that video never leaves the device, and Allow
 * camera / Not now. Opened by setHandMode(true) (the switch, A, the About card, `ar on`) through
 * ar.explainerOpen, until the camera has been allowed once.
 *
 * After Allow it stays open with "Starting camera…" while the browser asks; it closes when the
 * camera is live (ready), or when it was refused or failed (ARLayer raises the alert and switches
 * back to Mouse). Not now, Esc, the close button and the backdrop leave Hand off.
 */
export default function ARExplainer() {
  const open = useStore((s) => s.ar.explainerOpen);
  const enabled = useStore((s) => s.ar.enabled);
  const status = useStore((s) => s.ar.status);
  const starting = enabled && status === "loading";
  // Set by Allow: from then on, the camera's answer closes the explainer. (ar.status may still
  // say "denied" from an earlier try when it opens, so the status alone can't decide.)
  const asked = useRef(false);

  /** Allow: Hand on. ARLayer opens the camera (the browser asks) and moves ar.status. */
  const allow = () => {
    asked.current = true;
    useStore.getState().ar.setEnabled(true);
  };

  // Live, or refused / failed (ARLayer switches Hand back off and raises the alert): done.
  useEffect(() => {
    if (!open || !asked.current) return;
    if (status === "ready" || !enabled) {
      asked.current = false;
      close();
    }
  }, [open, status, enabled]);

  const onClose = () => {
    close();
    // Closing while the browser's prompt is up cancels Hand: never leave the camera asking.
    if (useStore.getState().ar.enabled && status === "loading")
      useStore.getState().ar.setEnabled(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.title}
      closeLabel={t.close}
      description={t.body}
      dismissOnBackdrop
      className="w-130"
      titleClassName="text-title-1 font-bold"
      icon={
        <span className="flex size-12 items-center justify-center rounded-control bg-accent-secondary/15 text-accent-secondary [&_svg]:size-6">
          <Hand />
        </span>
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-footnote text-text-tertiary">
            {t.toggleHint} <Kbd>A</Kbd>
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              {t.notNow}
            </Button>
            <Button
              variant="primary"
              data-autofocus
              aria-busy={starting || undefined}
              leadingIcon={
                starting ? (
                  <LoaderCircle className="animate-spin motion-reduce:animate-none" />
                ) : undefined
              }
              onClick={starting ? undefined : allow}
            >
              {starting ? t.starting : t.allow}
            </Button>
          </div>
        </div>
      }
    >
      <ul className="grid grid-cols-3 gap-3">
        {t.gestures.map((g) => (
          <li
            key={g.pose}
            className="flex flex-col items-center gap-2 text-center"
          >
            <span className="flex aspect-[4/3] w-full items-center justify-center rounded-control border border-island-border bg-island-bg p-2">
              <HandSkeleton pose={g.pose} className="max-h-24" />
            </span>
            <span className="flex flex-col">
              <span className="text-subhead font-semibold">{g.name}</span>
              <span className="text-caption-1 text-text-secondary">
                {g.hint}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex gap-3 rounded-control border border-accent-primary/25 bg-accent-primary/8 p-4 text-footnote text-text-primary">
        <Check
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-accent-primary"
        />
        {t.privacy}
      </p>
    </Modal>
  );
}
