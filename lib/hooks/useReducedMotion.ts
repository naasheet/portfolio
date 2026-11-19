import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const getSnapshot = (): boolean => window.matchMedia(QUERY).matches;

// Server and hydration render assume reduced motion: nothing starts moving until the browser
// has answered, so motion is never started and then torn down on first load.
const getServerSnapshot = (): boolean => true;

/** True when the visitor asks for reduced motion. Updates live when the setting changes. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
