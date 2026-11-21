/*
 * What each object in the particle room does (R.4, R.5), shared by the hover click, the hidden
 * keyboard links, the phone sheet and the no-WebGL cards: open a page (pushed at once; the
 * canvas's morph is the transition), switch the theme from the lamp's bulb, open the Now card
 * in the island, the music placeholder, or water the plant (a secret).
 */
import { createElement } from "react";
import { chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { roomObjects, type RoomObjectId } from "@/content/room";
import { island, subscribeIsland, getIsland } from "@/lib/island";
import { navigate, type PushRouter } from "@/lib/motion/pageTransition";
import { findSecret } from "@/lib/secrets";
import { toggleTheme } from "@/lib/shortcuts";
import { useStore } from "@/lib/store";
import { NowCard } from "./NowCard";

/** The lamp's bulb on screen, or null (no lamp in this layout). */
function bulbOrigin() {
  const [x, y] = useStore.getState().room.view.bulb;
  return x === undefined || Number.isNaN(x) || y === undefined ? null : { x, y };
}

let nowWatch: (() => void) | null = null;

/** The mug: the Now card as the island's expanded shape; it leaves when the card closes. */
export function openNow(): void {
  island.push({
    id: "now",
    kind: "now",
    label: copy.home.now.label,
    expanded: createElement(NowCard),
  });
  island.expand("now");
  nowWatch?.();
  nowWatch = subscribeIsland(() => {
    if (getIsland().expandedId === "now") return;
    nowWatch?.();
    nowWatch = null;
    island.remove("now");
  });
}

/** The plant: grow the leaf; the first time, an island achievement. */
export function waterPlant(): void {
  useStore.getState().room.setLeaf(true);
  const found = findSecret("plant");
  if (found === null) return;
  const s = copy.home.secrets;
  island.alert({
    icon: "star",
    tone: "amber",
    text: s.plant,
    detail: s.count(found, s.total),
  });
}

export function openRoomObject(id: RoomObjectId, router: PushRouter): void {
  const opens = roomObjects.find((o) => o.id === id)?.opens;
  if (!opens) return;
  switch (opens.kind) {
    case "page": {
      const route = chapters.find((c) => c.id === opens.page)?.route;
      if (route) navigate(router, route, { immediate: true });
      return;
    }
    case "theme":
      toggleTheme(bulbOrigin());
      return;
    case "now":
      openNow();
      return;
    case "music":
      // Phase 5 opens the island's music activity here.
      island.alert({
        icon: "music",
        tone: "teal",
        text: copy.home.room.musicSoon,
        detail: copy.home.room.musicSoonDetail,
      });
      return;
    case "plant":
      waterPlant();
      return;
  }
}
