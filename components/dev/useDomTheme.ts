import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

const getSnapshot = (): string =>
  document.documentElement.dataset.theme ?? "dark";
const getServerSnapshot = (): null => null;

/**
 * The theme currently on <html>, or null on the server and during hydration.
 * Watches the attribute itself, so it also catches a console setTheme() that skips the store.
 * Dev only: specimens use it to re-read computed token values when the theme changes.
 */
export function useDomTheme(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
