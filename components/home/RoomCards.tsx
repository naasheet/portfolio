"use client";

import { Music } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { TransitionLink } from "@/components/nav/TransitionLink";
import { focusRing } from "@/components/ui/controlStyles";
import { copy } from "@/content/copy";
import type { RoomObjectId } from "@/content/room";
import { canvasEnabled } from "@/lib/quality";
import { openRoomObject } from "./roomActions";
import { roomInfo } from "./roomInfo";

/** The six things on the desk (Home states board, "No WebGL, or reduced data"), in its order. */
const CARDS: readonly RoomObjectId[] = ["about", "work", "skills", "arcade", "contact", "music"];

const subscribe = () => () => {};
const card = `glass flex h-full flex-col justify-between gap-4 rounded-card p-4 text-left transition-[border-color] duration-150 ease-out hover:border-text-tertiary md:p-6 ${focusRing}`;

/**
 * Home without the canvas (R.5): no WebGL, or Save-Data on. The room's objects as glass link
 * cards (pages through TransitionLink, the headphones as a button). While it shows,
 * html[data-room="cards"] hides what only makes sense over the room (hint row, phone chips).
 * Renders nothing when the canvas runs, and on the server.
 */
export function RoomCards() {
  const router = useRouter();
  const enabled = useSyncExternalStore<boolean | null>(subscribe, canvasEnabled, () => null);
  const cards = enabled === false;

  useEffect(() => {
    if (!cards) return;
    const root = document.documentElement;
    root.dataset.room = "cards";
    return () => {
      delete root.dataset.room;
    };
  }, [cards]);

  if (!cards) return null;
  return (
    <nav
      aria-label={copy.home.room.cardsLabel}
      className="absolute inset-x-0 bottom-[calc(var(--layer-inset-bottom)+72px)] px-6 md:bottom-auto md:top-1/2 md:px-12"
    >
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
        {CARDS.map((id) => {
          const info = roomInfo(id);
          if (!info) return null;
          const body = (
            <>
              <span className="flex items-center justify-between text-caption-1 font-mono text-text-tertiary">
                {info.number}
                {id === "music" ? <Music aria-hidden className="size-4" /> : null}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-headline text-text-primary">{info.name}</span>
                <span className="text-footnote text-text-secondary">
                  {id === "music" ? copy.home.room.musicCard : info.line}
                </span>
              </span>
            </>
          );
          return (
            <li key={id}>
              {info.route ? (
                <TransitionLink href={info.route} className={card}>
                  {body}
                </TransitionLink>
              ) : (
                <button type="button" className={`w-full ${card}`} onClick={() => openRoomObject(id, router)}>
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
