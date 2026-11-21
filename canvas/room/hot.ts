import { roomObjects } from "@/content/room";
import { gsap } from "@/lib/motion/gsap";
import { useStore } from "@/lib/store";
import { requestFrame } from "../frame";

/** Highlight in over 180 ms, out over 240 ms (R.4, states board). */
const HOT_IN = 0.18;
const HOT_OUT = 0.24;

/** Per object (roomObjects order) 0–1: how highlighted it is. Copied into uHot every frame. */
export const liveHot: number[] = roomObjects.map(() => 0);

/**
 * Follow the store's room.hot (set by the DOM's hit test or keyboard focus) and tween each
 * object's highlight. Under reduced motion the change is instant and draws one frame.
 * Returns the cleanup.
 */
export function watchHot(): () => void {
  const tweens: (gsap.core.Tween | null)[] = liveHot.map(() => null);
  const apply = (hot: string | null) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    roomObjects.forEach((o, i) => {
      const target = o.id === hot ? 1 : 0;
      tweens[i]?.kill();
      tweens[i] = null;
      if (reduced) {
        liveHot[i] = target;
        return;
      }
      if (liveHot[i] === target) return;
      const proxy = { v: liveHot[i]! };
      tweens[i] = gsap.to(proxy, {
        v: target,
        duration: target ? HOT_IN : HOT_OUT,
        ease: "power2.out",
        onUpdate: () => {
          liveHot[i] = proxy.v;
        },
      });
    });
    if (reduced) requestFrame();
  };
  apply(useStore.getState().room.hot);
  const unsubscribe = useStore.subscribe((s) => s.room.hot, apply);
  return () => {
    unsubscribe();
    tweens.forEach((t) => t?.kill());
  };
}
