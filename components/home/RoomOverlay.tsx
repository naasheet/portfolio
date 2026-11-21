"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { copy } from "@/content/copy";
import { roomObjects, roomTabOrder, type RoomObjectId } from "@/content/room";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { gsap } from "@/lib/motion/gsap";
import { useStore } from "@/lib/store";
import { HoverCard } from "./HoverCard";
import { PhoneSheet } from "./PhoneSheet";
import { openRoomObject, waterPlant } from "./roomActions";
import { roomInfo } from "./roomInfo";

/** Hit areas are each object's projected box padded by this much (px). */
const PAD = 16;
/** Gap between the tag and its object, and between the card and its object (px). */
const TAG_GAP = 10;
const CARD_GAP = 40;
/** The room counts as on screen (interactive) once it has assembled this far. */
const SHOWN = 0.98;
/** Every object but the plant responds to hover, focus and taps. */
const INTERACTIVE = new Set<RoomObjectId>(roomTabOrder);
/** Elements that keep the pointer (it isn't on the desk while over them). */
const UI = "a, button, input, textarea, select, [role='button'], #site-nav, [data-room-sheet]";

const indexOf = (id: RoomObjectId) => roomObjects.findIndex((o) => o.id === id);

/** The object under (x, y): interactive ones first (nearest wins), then the plant. */
function hitTest(x: number, y: number): RoomObjectId | null {
  const v = useStore.getState().room.view;
  if (v.shown < SHOWN) return null;
  const depthAt = (id: RoomObjectId) => {
    const b = indexOf(id) * 5;
    const box = v.boxes;
    if (Number.isNaN(box[b]!)) return Infinity;
    const hit =
      x >= box[b]! - PAD &&
      x <= box[b + 2]! + PAD &&
      y >= box[b + 1]! - PAD &&
      y <= box[b + 3]! + PAD;
    return hit ? box[b + 4]! : Infinity;
  };
  let best: RoomObjectId | null = null;
  let depth = Infinity;
  for (const id of INTERACTIVE) {
    const d = depthAt(id);
    if (d < depth) {
      depth = d;
      best = id;
    }
  }
  if (best) return best;
  return depthAt("plant") < Infinity ? "plant" : null;
}

/**
 * The particle room's DOM layer on Home (R.4, R.5). The canvas projects every object's box to
 * the screen each frame (store room.view).
 *
 * Mouse (hover-capable, fine pointer, 768 px and up): hit-tests window pointer moves (padded
 * 16 px, nearest wins) into store room.hot; faint tags under or over each object; an invisible
 * hit element over the hot object turns the Orbit cursor into the "Open ↗" pill and takes the
 * click; the hover card sits above it. The plant has no tag or hover: a click waters it.
 *
 * Touch (no hover): the first tap selects (room.hot: the object lights up, a white pin tag, the
 * PhoneSheet slides up); a second tap on it, or the sheet's button, opens it; a tap on empty
 * space cancels. A tap on the plant waters it.
 *
 * Everything moves with transform from one gsap ticker; nothing re-renders per frame and nothing
 * on the page shifts.
 */
export function RoomOverlay() {
  const router = useRouter();
  const hot = useStore((s) => s.room.hot);
  const mouse = useMediaQuery("(hover: hover) and (pointer: fine) and (min-width: 48rem)");
  const touch = useMediaQuery("(hover: none), (pointer: coarse)");
  // The card's / sheet's object stays rendered while it fades or slides out.
  const [shownId, setShownId] = useState<RoomObjectId | null>(null);
  if (hot && INTERACTIVE.has(hot) && hot !== shownId) setShownId(hot);

  const tags = useRef<(HTMLSpanElement | null)[]>([]);
  const hit = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLSpanElement>(null);

  // Mouse: hover follows pointer moves; a click on the plant waters it.
  useEffect(() => {
    if (!mouse) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = e.target instanceof Element ? e.target : null;
      const id = target?.closest(UI) ? null : hitTest(e.clientX, e.clientY);
      useStore.getState().room.setHot(id && INTERACTIVE.has(id) ? id : null);
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest(UI) || useStore.getState().room.hot) return;
      if (hitTest(e.clientX, e.clientY) === "plant") waterPlant();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onClick);
    };
  }, [mouse]);

  // Touch: tap to select, tap again to open, tap empty space to cancel.
  useEffect(() => {
    if (!touch || mouse) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest(UI)) return;
      const { room } = useStore.getState();
      const id = hitTest(e.clientX, e.clientY);
      if (id === "plant") {
        room.setHot(null);
        waterPlant();
      } else if (id && id === room.hot) {
        room.setHot(null);
        openRoomObject(id, router);
      } else {
        room.setHot(id);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [touch, mouse, router]);

  // Leaving Home clears the highlight.
  useEffect(() => () => useStore.getState().room.setHot(null), []);

  // Place the tags, the hit element, the card and the pin every frame.
  useEffect(() => {
    const place = () => {
      const { view, hot: current } = useStore.getState().room;
      const v = view.boxes;
      const on = view.shown >= SHOWN;
      roomObjects.forEach((o, i) => {
        const el = tags.current[i];
        if (!el || !o.tag) return;
        const b = i * 5;
        if (!mouse || Number.isNaN(v[b]!)) {
          el.style.opacity = "0";
          return;
        }
        const x = (v[b]! + v[b + 2]!) / 2;
        const y = o.tag.place === "above" ? v[b + 1]! - TAG_GAP : v[b + 3]! + TAG_GAP;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, ${o.tag.place === "above" ? "-100%" : "0"})`;
        el.style.opacity = !on ? "0" : current ? (current === o.id ? "0" : "0.35") : "1";
      });

      const id = current && INTERACTIVE.has(current) ? current : null;
      const b = id ? indexOf(id) * 5 : -1;
      const visible = Boolean(id && on && !Number.isNaN(v[b]!));

      const hitEl = hit.current;
      if (hitEl) {
        if (visible && mouse) {
          const x0 = v[b]! - PAD,
            y0 = v[b + 1]! - PAD;
          const w = v[b + 2]! - v[b]! + PAD * 2,
            h = v[b + 3]! - v[b + 1]! + PAD * 2;
          // A 100 px square, scaled: transform only.
          hitEl.style.transform = `translate3d(${x0}px, ${y0}px, 0) scale(${w / 100}, ${h / 100})`;
          hitEl.style.visibility = "visible";
        } else {
          hitEl.style.visibility = "hidden";
        }
      }

      const pinEl = pin.current;
      if (pinEl) {
        const show = visible && !mouse;
        pinEl.style.opacity = show ? "1" : "0";
        if (show) {
          const x = (v[b]! + v[b + 2]!) / 2;
          pinEl.style.transform = `translate3d(${x}px, ${v[b + 1]! - 8}px, 0) translate(-50%, -100%)`;
        }
      }

      const cardEl = card.current;
      const lineEl = line.current;
      if (cardEl && lineEl) {
        const show = visible && mouse;
        if (show) cardEl.dataset.open = "";
        else delete cardEl.dataset.open;
        lineEl.style.opacity = show ? "0.6" : "0";
        if (show) {
          const top = v[b + 1]!;
          const cx = (v[b]! + v[b + 2]!) / 2;
          const w = cardEl.offsetWidth;
          const h = cardEl.offsetHeight;
          let x = Math.min(Math.max(cx - w / 2, 16), window.innerWidth - w - 16);
          const y = Math.max(top - CARD_GAP - h, 72);
          // Never over Home's intro text: slide right of it instead.
          const avoid = document.querySelector("[data-room-avoid]")?.getBoundingClientRect();
          if (avoid && y < avoid.bottom && y + h > avoid.top && x < avoid.right + 16) {
            x = Math.min(avoid.right + 16, window.innerWidth - w - 16);
          }
          cardEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          const gap = Math.max(top - (y + h), 0);
          // Straight down from the card into the object, wherever the card had to move.
          const lx = Math.min(Math.max(cx, x + 24, v[b]!), x + w - 24, v[b + 2]!);
          lineEl.style.transform = `translate3d(${lx}px, ${y + h}px, 0) scaleY(${gap})`;
        }
      }
    };
    gsap.ticker.add(place);
    return () => gsap.ticker.remove(place);
  }, [mouse]);

  const open = () => {
    const id = useStore.getState().room.hot;
    if (!id) return;
    if (!mouse) useStore.getState().room.setHot(null);
    openRoomObject(id, router);
  };

  const info = shownId ? roomInfo(shownId) : null;
  const sheetOpen = !mouse && touch && hot !== null && INTERACTIVE.has(hot);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* The tags and pin fade in with the intro text (R.6). */}
      <div aria-hidden data-intro-fade>
        {roomObjects.map((o, i) =>
          o.tag ? (
            <span
              key={o.id}
              ref={(el) => {
                tags.current[i] = el;
              }}
              className="room-tag absolute top-0 left-0 flex items-center gap-1 text-caption-1 whitespace-nowrap text-text-tertiary opacity-0"
            >
              <span className="font-mono">{o.tag.prefix}</span>
              {o.label}
            </span>
          ) : null,
        )}
        <div
          ref={hit}
          data-cursor="view"
          data-cursor-label={copy.home.room.open}
          onClick={open}
          className="pointer-events-auto invisible absolute top-0 left-0 size-[100px] origin-top-left cursor-pointer"
        />
        <div
          ref={line}
          className="absolute top-0 left-0 h-px w-0 origin-top border-l border-dashed border-text-tertiary opacity-0"
        />
        <div ref={card} className="room-card absolute top-0 left-0">
          {info && mouse ? <HoverCard info={info} /> : null}
        </div>
        <span
          ref={pin}
          className="room-tag absolute top-0 left-0 flex items-center gap-1 rounded-chip bg-text-primary px-3 py-1 text-footnote whitespace-nowrap text-bg-base opacity-0"
        >
          {info ? (
            <>
              <span className="font-mono text-caption-2 text-accent-primary">{info.number}</span>
              {info.name}
            </>
          ) : null}
        </span>
      </div>
      {touch && !mouse ? <PhoneSheet info={info} open={sheetOpen} onOpen={open} /> : null}
    </div>
  );
}
