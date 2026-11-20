"use client";

import { AnimatePresence, m, useIsPresent } from "framer-motion";
import { Check, MessageCircle, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { focusRing } from "@/components/ui/controlStyles";
import { spring } from "@/lib/motion/tokens";
import {
  dismissToast,
  getServerToasts,
  getToasts,
  subscribeToasts,
  type ToastItem,
  type ToastKind,
} from "@/lib/toast";
import { cn } from "@/lib/utils";

const HEIGHT = 48; // px, Overlays board
const GAP = 8;

const ICON: Record<ToastKind, ReactNode> = {
  success: <Check className="size-4 text-status-success" />,
  info: <MessageCircle className="size-4 text-text-secondary" />,
  error: <X className="size-4 text-status-danger" />,
};

/**
 * Before a toast removes itself from under the focused button: move focus to the next toast's
 * first button, or blur, so the stack collapses and the timers resume. (A focused element that
 * is removed fires no blur in Chrome, which would leave the stack "focused" and paused.)
 */
function handOffFocus(e: MouseEvent<HTMLButtonElement>) {
  const li = e.currentTarget.closest("li");
  const sibling = li?.nextElementSibling ?? li?.previousElementSibling;
  const next = sibling?.querySelector<HTMLButtonElement>("button");
  if (next) next.focus();
  else e.currentTarget.blur();
}

/** Where a toast sits: 0 is the newest (front). Collapsed, older ones peek behind it. */
function place(index: number, expanded: boolean) {
  if (expanded) return { y: -index * (HEIGHT + GAP), scale: 1, opacity: 1 };
  return {
    y: -index * 10,
    scale: 1 - index * 0.05,
    opacity: index === 0 ? 1 : 0.5 - (index - 1) * 0.25,
  };
}

function ToastView({
  item,
  index,
  expanded,
  paused,
  dismissLabel,
}: {
  item: ToastItem;
  index: number;
  expanded: boolean;
  paused: boolean;
  dismissLabel: string;
}) {
  // Each toast keeps its own remaining time; refs only, so pausing never re-renders.
  const remaining = useRef(item.duration);
  const startedAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (paused) {
      if (timer.current === undefined) return;
      window.clearTimeout(timer.current);
      timer.current = undefined;
      remaining.current = Math.max(
        0,
        remaining.current - (performance.now() - startedAt.current),
      );
      return;
    }
    startedAt.current = performance.now();
    timer.current = window.setTimeout(
      () => dismissToast(item.id),
      remaining.current,
    );
  }, [paused, item.id]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // A leaving toast can't be clicked or focused while it animates out.
  const present = useIsPresent();

  return (
    <m.li
      inert={!present}
      initial={{ opacity: 0, y: 24, scale: 1 }}
      animate={place(index, expanded)}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={spring.soft}
      style={{ zIndex: 10 - index }}
      className="absolute inset-x-0 bottom-0 flex h-12 origin-bottom items-center gap-2 rounded-control border border-border-default bg-surface-solid pr-2 pl-4 text-subhead text-text-primary shadow-overlay"
    >
      <span aria-hidden className="inline-flex w-6 shrink-0">
        {ICON[item.kind]}
      </span>
      <span className="min-w-0 flex-1 truncate">{item.message}</span>
      {item.action ? (
        <button
          type="button"
          onClick={(e) => {
            handOffFocus(e);
            item.action?.onClick();
            dismissToast(item.id);
          }}
          className={cn(
            "h-8 shrink-0 cursor-pointer rounded-control px-2 text-subhead font-semibold text-accent-primary transition-colors duration-150 ease-out hover:text-accent-primary-hover",
            focusRing,
          )}
        >
          {item.action.label}
        </button>
      ) : null}
      <button
        type="button"
        onClick={(e) => {
          handOffFocus(e);
          dismissToast(item.id);
        }}
        aria-label={dismissLabel}
        className={cn(
          "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control text-text-secondary transition-colors duration-150 ease-out hover:bg-surface-glass hover:text-text-primary",
          focusRing,
        )}
      >
        <X aria-hidden className="size-4" />
      </button>
    </m.li>
  );
}

/**
 * The toast stack from lib/toast.ts, bottom-right (bottom-centre on phones), newest in front,
 * at most three. Collapsed, older toasts peek behind the newest; hovering or focusing the stack
 * spreads it into a column (so their actions are reachable) and pauses every timer.
 * The polite live region is always in the DOM. Mount once, through ToasterLoader.
 * Sits var(--toast-offset, 16px) above the bottom (2.3 sets it above the bottom pills) and
 * uses the persistent layer's safe-area side insets.
 */
export function Toaster({ dismissLabel }: { dismissLabel: string }) {
  const toasts = useSyncExternalStore(
    subscribeToasts,
    getToasts,
    getServerToasts,
  );
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expanded = (hovered || focused) && toasts.length > 1;
  const paused = hovered || focused;

  // Newest first: front of the stack and first in Tab order.
  const ordered = [...toasts].reverse();

  const onBlur = (e: FocusEvent<HTMLOListElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setFocused(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-(--layer-inset-right) bottom-[max(var(--toast-offset,16px),env(safe-area-inset-bottom))] left-(--layer-inset-left) z-toast flex justify-center md:left-auto md:w-90"
    >
      <ol
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={onBlur}
        className={cn(
          "relative w-full max-w-90",
          toasts.length > 0 && "pointer-events-auto",
        )}
        // Instant height (not animated): it only widens the hover area while spread out.
        style={{
          height: expanded
            ? toasts.length * HEIGHT + (toasts.length - 1) * GAP
            : HEIGHT,
        }}
      >
        <AnimatePresence initial={false}>
          {ordered.map((t, i) => (
            <ToastView
              key={t.id}
              item={t}
              index={i}
              expanded={expanded}
              paused={paused}
              dismissLabel={dismissLabel}
            />
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}
