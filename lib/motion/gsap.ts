import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/*
 * The one place GSAP plugins are registered. Import gsap, ScrollTrigger, SplitText and
 * useGSAP from here, never from "gsap" directly, so registration always happens first.
 * registerPlugin is idempotent, and it only runs in the browser.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
