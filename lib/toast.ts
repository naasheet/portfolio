/*
 * Toast queue: call toast("Copied") from anywhere (components, commands, plain functions).
 * The Toaster (components/overlay/Toast.tsx) subscribes with useSyncExternalStore.
 * At most three toasts show; a fourth pushes the oldest out. Each one leaves after 3 s,
 * and the Toaster pauses that timer while a toast is hovered or focused.
 * Messages come from the caller (copy lives in content/).
 */

export type ToastTone = "neutral" | "success" | "danger";

export type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
  /** Milliseconds before it leaves on its own. */
  duration: number;
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
export function toast(
  message: string,
  options: { tone?: ToastTone; duration?: number } = {},
): number {
  const item: ToastItem = {
    id: nextId++,
    message,
    tone: options.tone ?? "neutral",
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

export function getToasts(): ToastItem[] {
  return items;
}

const EMPTY: ToastItem[] = [];
/** Server snapshot: no toasts during server rendering. */
export function getServerToasts(): ToastItem[] {
  return EMPTY;
}
