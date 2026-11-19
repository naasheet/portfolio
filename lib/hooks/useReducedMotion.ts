import { useMediaQuery } from "./useMediaQuery";

/**
 * True when the visitor asks for reduced motion. Updates live when the setting changes.
 * Server and hydration render assume reduced motion: nothing starts moving until the browser
 * has answered, so motion is never started and then torn down on first load.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", true);
}
