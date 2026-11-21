"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FocusEvent, KeyboardEvent, MouseEvent } from "react";
import { copy } from "@/content/copy";
import { roomTabOrder, type RoomObjectId } from "@/content/room";
import { useStore } from "@/lib/store";
import { roomInfo } from "./roomInfo";

/**
 * The particle room for the keyboard and screen readers (R.4, R.5): a visually hidden list of
 * the same objects, in the room's left-to-right order (not the plant). Pages are links; the
 * headphones, mug and lamp are buttons. These are the Tab stops: focusing one lights its object
 * exactly like a hover (store room.hot), Enter opens it, Esc clears. The canvas stays
 * aria-hidden.
 */
export function RoomLinks() {
  const router = useRouter();
  const setHot = useStore((s) => s.room.setHot);

  const focus = (id: RoomObjectId) => () => setHot(id);
  const blur = (id: RoomObjectId) => (e: FocusEvent) => {
    void e;
    if (useStore.getState().room.hot === id) setHot(null);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Escape") return;
    e.currentTarget.blur();
    setHot(null);
  };
  const open = (id: RoomObjectId) => (e: MouseEvent<HTMLElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    // Loaded on first use: the actions (Now card, theme reveal, secrets) stay out of first-load JS.
    void import("./roomActions").then((m) => m.openRoomObject(id, router));
  };

  return (
    <nav aria-label={copy.home.room.links} className="sr-only">
      <ul>
        {roomTabOrder.map((id) => {
          const info = roomInfo(id);
          if (!info) return null;
          const name = `${info.number} ${info.name}: ${info.line}`;
          const handlers = {
            onFocus: focus(id),
            onBlur: blur(id),
            onKeyDown,
            onClick: open(id),
          };
          return (
            <li key={id}>
              {info.route ? (
                <Link href={info.route} {...handlers}>
                  {name}
                </Link>
              ) : (
                <button type="button" {...handlers}>
                  {name}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
