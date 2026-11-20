"use client";

import { AnimatePresence, m, useIsPresent } from "framer-motion";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { isTopmostTrap, useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { durationS, easeOutPoints } from "@/lib/motion/tokens";
import { lockScroll, unlockScroll } from "@/lib/motion/lenis";

const noop = () => () => {};

/** False on the server and during hydration, true after: portals need document.body. */
function useMounted(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

export type OverlayRootProps = {
  open: boolean;
  onClose: () => void;
  /** Close on a backdrop click (default). The Modal turns it off: it asks to confirm. */
  dismissOnBackdrop?: boolean;
  /** The panel: an m.* element with its own initial / animate / exit. */
  children: ReactNode;
};

function OverlayLayer({
  onClose,
  dismissOnBackdrop,
  children,
}: {
  onClose: () => void;
  dismissOnBackdrop: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  // Declared before the trap, so it records the opener before focus moves inside.
  // The page stays locked until the overlay has fully left. Safety net: if focus fell to
  // <body> meanwhile (e.g. the closing panel was clicked), give it back to the opener.
  useEffect(() => {
    const active = document.activeElement;
    opener.current = active instanceof HTMLElement ? active : null;
    lockScroll();
    return () => {
      unlockScroll();
      const now = document.activeElement;
      if ((!now || now === document.body) && opener.current?.isConnected) {
        opener.current.focus({ preventScroll: true });
      }
    };
  }, []);

  // While the exit animation plays, the overlay is already "closed": release the trap at once,
  // so focus goes back to the trigger immediately, and make the leaving layer inert so it
  // can't take focus or clicks.
  const present = useIsPresent();
  useFocusTrap(ref, present);

  useEffect(() => {
    if (!present) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !isTopmostTrap(ref.current)) return;
      e.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [present, onClose]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      data-overlay
      inert={!present}
      className="fixed inset-0 z-overlay outline-none"
    >
      <m.div
        aria-hidden
        className="absolute inset-0 bg-overlay-scrim/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: durationS.base, ease: easeOutPoints }}
        onClick={dismissOnBackdrop ? onClose : undefined}
      />
      {children}
    </div>
  );
}

/**
 * Shared plumbing for Sheet, Modal and Drawer: a portal into <body>, a 40% black backdrop that
 * closes on click (unless dismissOnBackdrop is false), a focus trap that returns focus on close, Esc for the topmost overlay only,
 * and lockScroll() while it's on screen. Each overlay supplies its own animated panel.
 */
export function OverlayRoot({
  open,
  onClose,
  dismissOnBackdrop = true,
  children,
}: OverlayRootProps) {
  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <OverlayLayer
          key="overlay"
          onClose={onClose}
          dismissOnBackdrop={dismissOnBackdrop}
        >
          {children}
        </OverlayLayer>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
