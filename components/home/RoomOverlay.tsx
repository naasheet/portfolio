"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { chapterNumber, chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { roomObjects, roomTabOrder, type RoomObjectId } from "@/content/room";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { gsap } from "@/lib/motion/gsap";
import { navigate } from "@/lib/motion/pageTransition";
import { useStore } from "@/lib/store";
import { HoverCard } from "./HoverCard";

/** Hit areas are each object's projected box padded by this much (px). */
const PAD = 16;
/** Gap between the tag and its object, and between the card and its object (px). */
const TAG_GAP = 10;
const CARD_GAP = 40;
/** The room counts as on screen (interactive) once it has assembled this far. */
const SHOWN = 0.98;
/** Only these respond to hover and click in R.4 (R.5 adds the headphones, mug and lamp). */
const INTERACTIVE = new Set<RoomObjectId>(roomTabOrder);
/** Elements that keep the pointer (it isn't on the desk while over them). */
const UI = "a, button, input, textarea, select, [role='button'], #site-nav";

const indexOf = (id: RoomObjectId) => roomObjects.findIndex((o) => o.id === id);

function pageOf(id: RoomObjectId) {
  const opens = roomObjects.find((o) => o.id === id)?.opens;
  if (opens?.kind !== "page") return null;
  const index = chapters.findIndex((c) => c.id === opens.page);
  const page = chapters[index];
  return page ? { page, number: chapterNumber(index) } : null;
}

/**
 * The particle room's DOM layer on Home (R.4). The canvas projects every object's box to the
 * screen each frame (store room.view); this layer:
 * - hit-tests the pointer (from window; the canvas keeps pointer-events: none) against those
 *   boxes padded by 16 px, the nearest winning, and writes store room.hot;
 * - draws the faint tags under or over each object (not the plant);
 * - puts an invisible hit element over the hot object, which turns the Orbit cursor into the
 *   "Open ↗" pill and takes the click (router.push at once: the morph is the transition);
 * - shows the hover card above the hot object (also for keyboard focus, from RoomLinks).
 * Everything moves with transform from one gsap ticker; nothing re-renders per frame and
 * nothing on the page shifts. Mouse only (hover-capable, fine pointer, 768 px and up).
 */
export function RoomOverlay() {
  const router = useRouter();
  const hot = useStore((s) => s.room.hot);
  const pointer = useMediaQuery(
    "(hover: hover) and (pointer: fine) and (min-width: 48rem)",
  );
  // The card's object stays rendered while it fades out.
  const [cardId, setCardId] = useState<RoomObjectId | null>(null);
  if (hot && INTERACTIVE.has(hot) && hot !== cardId) setCardId(hot);

  const tags = useRef<(HTMLSpanElement | null)[]>([]);
  const hit = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);

  // Hit test on pointer moves.
  useEffect(() => {
    if (!pointer) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const { room } = useStore.getState();
      const target = e.target instanceof Element ? e.target : null;
      let best: RoomObjectId | null = null;
      if (room.view.shown >= SHOWN && !target?.closest(UI)) {
        let depth = Infinity;
        for (const id of INTERACTIVE) {
          const b = indexOf(id) * 5;
          const v = room.view.boxes;
          if (Number.isNaN(v[b]!)) continue;
          const inside =
            e.clientX >= v[b]! - PAD &&
            e.clientX <= v[b + 2]! + PAD &&
            e.clientY >= v[b + 1]! - PAD &&
            e.clientY <= v[b + 3]! + PAD;
          if (inside && v[b + 4]! < depth) {
            depth = v[b + 4]!;
            best = id;
          }
        }
      }
      room.setHot(best);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [pointer]);

  // Leaving Home (or the room hiding) clears the highlight.
  useEffect(() => () => useStore.getState().room.setHot(null), []);

  // Place the tags, the hit element and the card every frame.
  useEffect(() => {
    const place = () => {
      const { room } = useStore.getState();
      const { view, hot: current } = room;
      const v = view.boxes;
      const on = view.shown >= SHOWN;
      roomObjects.forEach((o, i) => {
        const el = tags.current[i];
        if (!el || !o.tag) return;
        const b = i * 5;
        if (!pointer || Number.isNaN(v[b]!)) {
          el.style.opacity = "0";
          return;
        }
        const x = (v[b]! + v[b + 2]!) / 2;
        const y = o.tag.place === "above" ? v[b + 1]! - TAG_GAP : v[b + 3]! + TAG_GAP;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, ${o.tag.place === "above" ? "-100%" : "0"})`;
        el.style.opacity = !on ? "0" : current ? (current === o.id ? "0" : "0.35") : "1";
      });

      const id = current && INTERACTIVE.has(current) ? current : null;
      const hitEl = hit.current;
      if (hitEl) {
        const b = id ? indexOf(id) * 5 : -1;
        if (id && pointer && on && !Number.isNaN(v[b]!)) {
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

      const cardEl = card.current;
      const lineEl = line.current;
      if (cardEl && lineEl) {
        const b = id ? indexOf(id) * 5 : -1;
        const visible = Boolean(id && on && !Number.isNaN(v[b]!));
        if (visible) cardEl.dataset.open = "";
        else delete cardEl.dataset.open;
        lineEl.style.opacity = visible ? "0.6" : "0";
        if (visible) {
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
          const lx = Math.min(
            Math.max(cx, x + 24, v[b]!),
            x + w - 24,
            v[b + 2]!,
          );
          lineEl.style.transform = `translate3d(${lx}px, ${y + h}px, 0) scaleY(${gap})`;
        }
      }
    };
    gsap.ticker.add(place);
    return () => gsap.ticker.remove(place);
  }, [pointer]);

  const open = () => {
    const id = useStore.getState().room.hot;
    const target = id ? pageOf(id) : null;
    if (target) navigate(router, target.page.route, { immediate: true });
  };

  const cardTarget = cardId ? pageOf(cardId) : null;
  const cardKey = cardId ? roomObjects.find((o) => o.id === cardId)?.key ?? null : null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
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
        {cardTarget ? (
          <HoverCard
            page={cardTarget.page}
            number={cardTarget.number}
            keyHint={cardKey}
          />
        ) : null}
      </div>
    </div>
  );
}
