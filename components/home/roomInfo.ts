import { chapterNumber, chapters } from "@/content/chapters";
import { roomObjects, type RoomObjectId } from "@/content/room";

/** What the hover card, phone sheet and hidden links say about a room object (R.4, R.5). */
export type RoomInfo = {
  id: RoomObjectId;
  /** "03" for a page, the tag's prefix ("♪", "·", "T") otherwise. */
  number: string;
  name: string;
  /** The page's subtitle, or the object's action line. */
  line: string;
  keyHint: string | null;
  /** The page's route; null for objects that act in place. */
  route: string | null;
  noun: string;
};

export function roomInfo(id: RoomObjectId): RoomInfo | null {
  const o = roomObjects.find((x) => x.id === id);
  if (!o) return null;
  if (o.opens.kind === "page") {
    const pageId = o.opens.page;
    const index = chapters.findIndex((c) => c.id === pageId);
    const page = chapters[index];
    if (!page) return null;
    return {
      id,
      number: chapterNumber(index),
      name: page.name,
      line: page.subtitle,
      keyHint: o.key,
      route: page.route,
      noun: o.noun,
    };
  }
  return {
    id,
    number: o.tag?.prefix ?? "",
    name: o.label ?? "",
    line: o.action ?? "",
    keyHint: o.key,
    route: null,
    noun: o.noun,
  };
}
