import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SplitText as SplitTextType } from "gsap/SplitText";

/*
 * The one place GSAP plugins are registered. Import gsap, ScrollTrigger and useGSAP from here,
 * never from "gsap" directly, so registration always happens first. registerPlugin is
 * idempotent, and it only runs in the browser.
 *
 * SplitText is not in this bundle: it loads on first use through loadSplitText() (2.2, to keep
 * first-load JS on `/` under budget; about -6 KB). Only RevealText needs it.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

let splitText: Promise<typeof SplitTextType> | null = null;

/** Load and register SplitText once; resolves to the plugin. Browser only. */
export function loadSplitText(): Promise<typeof SplitTextType> {
  splitText ??= import("gsap/SplitText").then(({ SplitText }) => {
    gsap.registerPlugin(SplitText);
    return SplitText;
  });
  return splitText;
}

export { gsap, ScrollTrigger, useGSAP };
