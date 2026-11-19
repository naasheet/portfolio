import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a CSS media query matches. Updates live.
 * `serverValue` is used on the server and during hydration; pick the safe default.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => serverValue;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
