import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

const getSnapshot = (): boolean => document.visibilityState === "visible";
const getServerSnapshot = (): boolean => true;

/** False while the tab is hidden (games and loops pause on it). True on the server. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
