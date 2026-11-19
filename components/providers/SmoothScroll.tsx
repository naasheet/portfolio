"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { scrollTo, setLenis } from "@/lib/motion/lenis";

/**
 * Same-page hash links glide through scrollTo(). Lenis's own `anchors` option is not used:
 * it never cancels the browser's native jump, so the page flashes to the target for a frame
 * and then glides from where it was.
 */
function onAnchorClick(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!(event.target instanceof Element)) return;

  const link = event.target.closest("a[href*='#']");
  if (
    !(link instanceof HTMLAnchorElement) ||
    (link.target && link.target !== "_self")
  )
    return;

  const url = new URL(link.href);
  const here = window.location;
  if (
    url.origin !== here.origin ||
    url.pathname !== here.pathname ||
    url.search !== here.search
  ) {
    return;
  }

  const id = decodeURIComponent(url.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  if (id && !target) return; // unknown id: leave it to the browser

  event.preventDefault();
  window.history.pushState(window.history.state, "", url.hash || here.pathname);
  scrollTo(target ?? 0);
}

/**
 * Smooth scrolling on the shared clock: gsap.ticker drives Lenis, and every Lenis scroll
 * updates ScrollTrigger on the same frame. With reduced motion, Lenis never starts and the
 * page scrolls natively. Mounted once in app/layout.tsx; renders nothing.
 */
export function SmoothScroll() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
    setLenis(lenis);

    const offScroll = lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    // Never let GSAP jump the clock after a long frame; Lenis and the scene stay in step.
    gsap.ticker.lagSmoothing(0);
    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33); // GSAP's default
      offScroll();
      setLenis(null);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return null;
}
