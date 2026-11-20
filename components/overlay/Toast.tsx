"use client";

import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  dismissToast,
  getServerToasts,
  getToasts,
  subscribeToasts,
  type ToastItem,
  type ToastTone,
} from "@/lib/toast";
import { focusRing } from "@/components/ui/controlStyles";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

const DOT: Record<ToastTone, string> = {
  neutral: "bg-text-tertiary",
  success: "bg-status-success",
  danger: "bg-status-danger",
};

function ToastView({
  item,
  dismissLabel,
}: {
  item: ToastItem;
  dismissLabel: string;
}) {
  // The timer pauses while the toast is hovered or focused; no React state is involved.
  const remaining = useRef(item.duration);
  const startedAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  const start = () => {
    window.clearTimeout(timer.current);
    startedAt.current = performance.now();
    timer.current = window.setTimeout(
      () => dismissToast(item.id),
      remaining.current,
    );
  };
  const pause = () => {
    if (timer.current === undefined) return;
    window.clearTimeout(timer.current);
    timer.current = undefined;
    remaining.current = Math.max(
      0,
      remaining.current - (performance.now() - startedAt.current),
    );
  };

  useEffect(() => {
    start();
    return () => window.clearTimeout(timer.current);
    // Start once per toast; start() only reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <m.li
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={spring.soft}
      onPointerEnter={pause}
      onPointerLeave={start}
      onFocus={pause}
      onBlur={start}
      className="pointer-events-auto flex h-11 items-center gap-2 rounded-chip border border-border-default bg-surface-solid pr-1 pl-4 text-subhead text-text-primary shadow-overlay"
    >
      <span aria-hidden className={cn("size-2 rounded-chip", DOT[item.tone])} />
      <span>{item.message}</span>
      <button
        type="button"
        onClick={() => dismissToast(item.id)}
        aria-label={dismissLabel}
        className={cn(
          "ml-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-chip text-text-secondary transition-colors duration-150 ease-out hover:bg-surface-glass hover:text-text-primary",
          focusRing,
        )}
      >
        <X aria-hidden className="size-4" />
      </button>
    </m.li>
  );
}

/**
 * Renders the toast queue from lib/toast.ts. Mount once (app/layout.tsx, through
 * ToasterLoader). The polite live region is always in the DOM, so screen readers
 * announce each new message.
 */
export function Toaster({ dismissLabel }: { dismissLabel: string }) {
  const toasts = useSyncExternalStore(
    subscribeToasts,
    getToasts,
    getServerToasts,
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-toast flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))]"
    >
      <ol className="flex flex-col items-center gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {toasts.map((t) => (
            <ToastView key={t.id} item={t} dismissLabel={dismissLabel} />
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}
