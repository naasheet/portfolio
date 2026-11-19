import { useMediaQuery } from "./useMediaQuery";

/**
 * True when the main input is touch (no hover, coarse pointer): phones and most tablets.
 * A touch laptop with a trackpad counts as not touch. False on the server.
 */
export function useIsTouch(): boolean {
  return useMediaQuery("(hover: none) and (pointer: coarse)");
}
