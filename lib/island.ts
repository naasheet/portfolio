/*
 * The island's store (2.4): the centre of the nav, and the site's live-activity centre.
 * Features push what they're doing here; components/nav/Island.tsx shows the winner.
 *
 *   island.push({ id, kind, lead, trail, expanded })   a live activity (music, AR, chat, game,
 *                                                      or the mug's Now card, R.5)
 *   island.remove(id)                                  it ended
 *   island.alert({ icon, text, detail })               a 2.5 s confirmation ("Light theme")
 *   island.expand(id) / island.collapse()              open an activity's expanded card
 *
 * Priority (Island board): alert › what the visitor expanded › live activities
 * (music › AR › chat › game) › the idle chapter view. Nav hover sits between expanded and live,
 * and lives in the component. Read it with useSyncExternalStore(subscribe, getSnapshot).
 */
import type { ReactNode } from "react";

export type ActivityKind = "music" | "ar" | "chat" | "game" | "now";

export type IslandActivity = {
  id: string;
  kind: ActivityKind;
  /** Lower wins. Defaults to the kind's order: music 0, AR 1, chat 2, game 3. */
  priority?: number;
  /** Leading slot (album art, the camera dot …). Click expands the activity. */
  lead?: ReactNode;
  /** Trailing slot (equalizer, score …). Click expands the activity. */
  trail?: ReactNode;
  /** The expanded card's content (the player). Without it the slots don't expand. */
  expanded?: ReactNode;
  /** Accessible name of the slot buttons ("Open the player"). */
  label: string;
};

/** Icons the island can show for an alert; the component maps them to lucide icons. */
export type AlertIcon =
  | "check"
  | "info"
  | "sun"
  | "moon"
  | "volume"
  | "mute"
  | "mouse"
  | "hand"
  | "star"
  | "music";

export type AlertTone = "teal" | "neutral" | "amber";

export type IslandAlert = {
  id: number;
  icon: AlertIcon;
  tone: AlertTone;
  text: string;
  detail?: string;
};

export type IslandState = {
  activities: IslandActivity[];
  alert: IslandAlert | null;
  expandedId: string | null;
};

export const ALERT_DURATION = 2500;

const KIND_ORDER: Record<ActivityKind, number> = {
  music: 0,
  ar: 1,
  chat: 2,
  game: 3,
  now: 4,
};

let state: IslandState = { activities: [], alert: null, expandedId: null };
let nextAlertId = 1;
let alertTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function set(partial: Partial<IslandState>) {
  state = { ...state, ...partial };
  for (const l of listeners) l();
}

const rank = (a: IslandActivity) => a.priority ?? KIND_ORDER[a.kind];

export const island = {
  /** Add or replace (same id) a live activity. */
  push(activity: IslandActivity): void {
    const rest = state.activities.filter((a) => a.id !== activity.id);
    set({
      activities: [...rest, activity].sort((a, b) => rank(a) - rank(b)),
    });
  },
  remove(id: string): void {
    set({
      activities: state.activities.filter((a) => a.id !== id),
      expandedId: state.expandedId === id ? null : state.expandedId,
    });
  },
  /** Show a confirmation for 2.5 s. A new alert replaces the current one. */
  alert(input: {
    icon?: AlertIcon;
    tone?: AlertTone;
    text: string;
    detail?: string;
  }): void {
    clearTimeout(alertTimer);
    set({
      alert: {
        id: nextAlertId++,
        icon: input.icon ?? "check",
        tone: input.tone ?? "teal",
        text: input.text,
        detail: input.detail,
      },
    });
    alertTimer = setTimeout(() => set({ alert: null }), ALERT_DURATION);
  },
  dismissAlert(): void {
    clearTimeout(alertTimer);
    if (state.alert) set({ alert: null });
  },
  /** Expand an activity that has an `expanded` card. */
  expand(id: string): void {
    const activity = state.activities.find((a) => a.id === id);
    if (activity?.expanded) set({ expandedId: id });
  },
  collapse(): void {
    if (state.expandedId) set({ expandedId: null });
  },
  isExpanded(): boolean {
    return state.expandedId !== null;
  },
};

export function subscribeIsland(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getIsland(): IslandState {
  return state;
}

const SERVER: IslandState = { activities: [], alert: null, expandedId: null };
export function getServerIsland(): IslandState {
  return SERVER;
}
