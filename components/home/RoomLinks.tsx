"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";
import { chapterNumber, chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { roomObjects, roomTabOrder, type RoomObjectId } from "@/content/room";
import { navigate } from "@/lib/motion/pageTransition";
import { useStore } from "@/lib/store";

/** The page an object opens, with its number. */
function pageOf(id: RoomObjectId) {
  const opens = roomObjects.find((o) => o.id === id)?.opens;
  if (opens?.kind !== "page") return null;
  const index = chapters.findIndex((c) => c.id === opens.page);
  const page = chapters[index];
  return page ? { page, number: chapterNumber(index) } : null;
}

/**
 * The particle room for the keyboard and screen readers (R.4): a visually hidden list of the
 * same links, in the room's left-to-right order. These are the Tab stops: focusing one lights
 * its object exactly like a hover (store room.hot), Enter opens it (pushed at once; the canvas's
 * morph is the transition), Esc clears. The canvas itself stays aria-hidden.
 */
export function RoomLinks() {
  const router = useRouter();
  const setHot = useStore((s) => s.room.setHot);

  const open = (e: MouseEvent<HTMLAnchorElement>, route: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(router, route, { immediate: true });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key !== "Escape") return;
    e.currentTarget.blur();
    setHot(null);
  };

  return (
    <nav aria-label={copy.home.room.links} className="sr-only">
      <ul>
        {roomTabOrder.map((id) => {
          const target = pageOf(id);
          if (!target) return null;
          const { page, number } = target;
          return (
            <li key={id}>
              <Link
                href={page.route}
                onFocus={() => setHot(id)}
                onBlur={() => {
                  if (useStore.getState().room.hot === id) setHot(null);
                }}
                onKeyDown={onKeyDown}
                onClick={(e) => open(e, page.route)}
              >
                {`${number} ${page.name}: ${page.subtitle}`}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
