/*
 * Toast queue: call toast("Email copied") from anywhere (components, commands, plain functions).
 * The Toaster (components/overlay/Toast.tsx) subscribes with useSyncExternalStore.
 * At most three toasts show; a fourth pushes the oldest out. Each one leaves after 3 s; the
 * Toaster pauses the timers while the stack is hovered or focused.
 * Messages and action labels come from the caller (copy lives in content/).
 */

/** success (the default): something worked. info: a neutral note. error: something failed. */
export type ToastKind = "success" | "info" | "error";

/** An optional button on the toast, e.g. "Undo" or "Retry". Clicking it also dismisses the toast. */
export type ToastAction = { label: string; onClick: () => void };

export type ToastItem = {
  id: number;
  message: string;
  kind: ToastKind;
  action?: ToastAction;
  /** Milliseconds before it leaves on its own. */
  duration: number;
};

export type ToastOptions = {
  kind?: ToastKind;
  action?: ToastAction;
  duration?: number;
};

export const TOAST_LIMIT = 3;
export const TOAST_DURATION = 3000;

type Listener = () => void;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

/** Show a toast. Returns its id, for dismissToast(). */
export function toast(message: string, options: ToastOptions = {}): number {
  const item: ToastItem = {
    id: nextId++,
    message,
    kind: options.kind ?? "success",
    action: options.action,
    duration: options.duration ?? TOAST_DURATION,
  };
  items = [...items, item].slice(-TOAST_LIMIT);
  emit();
  return item.id;
}

export function dismissToast(id: number): void {
  const next = items.filter((t) => t.id !== id);
  if (next.length === items.length) return;
  items = next;
  emit();
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Oldest first. */
export function getToasts(): ToastItem[] {
  return items;
}

const EMPTY: ToastItem[] = [];
/** Server snapshot: no toasts during server rendering. */
export function getServerToasts(): ToastItem[] {
  return EMPTY;
}
