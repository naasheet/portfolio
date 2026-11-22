/*
 * Open the island's music player from somewhere else on the site (5.2: the headphones on the
 * desk; 5.5: the About page's now-playing card). The island's expanded card is the only player.
 *
 *   sound off            → turn it on (toggleSound(): the AudioContext is created right here, in
 *                          the click, and track 1 fades in over 2 s), then open the player
 *   on, paused           → resume, then open (the activity may have left the island after 30 s)
 *   playing              → open at once
 *
 * Call it inside the click handler (iOS only unlocks audio in the gesture itself). The nav comes
 * back by itself if it auto-hid (NavAutoHide shows it while the island holds a card).
 */
import { getIsland, island, subscribeIsland } from "@/lib/island";
import { MUSIC_ACTIVITY, startMusic } from "@/lib/music";
import { toggleSound } from "@/lib/shortcuts";
import { useStore } from "@/lib/store";

/** Give up waiting for the activity (a track that fails to load) after this long. */
const WAIT_MS = 5000;

let pending: (() => void) | null = null;

export function openMusic(options?: { focus?: boolean }): void {
  const s = useStore.getState();
  if (!s.ui.soundEnabled) toggleSound();
  else if (!s.audio.playing) void startMusic();

  const shown = () =>
    getIsland().activities.some((a) => a.id === MUSIC_ACTIVITY);
  pending?.();
  if (shown()) {
    island.expand(MUSIC_ACTIVITY, options);
    return;
  }
  const stop = () => {
    off();
    clearTimeout(giveUp);
    pending = null;
  };
  const off = subscribeIsland(() => {
    if (!shown()) return;
    stop(); // before expanding: expand() notifies listeners again
    island.expand(MUSIC_ACTIVITY, options);
  });
  const giveUp = setTimeout(stop, WAIT_MS);
  pending = stop;
}
