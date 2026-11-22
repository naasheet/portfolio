/*
 * Media Session (5.3): the phone's lock screen, the notification shade and the keyboard's media
 * keys control the music, and show the track's title, artist and cover.
 *
 * Set up once by lib/music.ts after the engine exists. Metadata follows audio.trackIndex, the
 * playback state follows audio.playing, and the position state is refreshed whenever the engine
 * reports a jump (track loaded, seeked, played, paused); the browser extrapolates in between.
 * Every call is guarded: some browsers lack the API or throw on actions they don't support.
 */
import { tracks } from "@/content/music";
import { useStore } from "@/lib/store";
import type { AudioEngine } from "./engine";

/** seekbackward / seekforward without an offset (lock-screen ±10 s buttons). */
const SKIP_S = 10;

let initialised = false;

function session(): MediaSession | null {
  return typeof navigator !== "undefined" && "mediaSession" in navigator
    ? navigator.mediaSession
    : null;
}

function setHandler(
  ms: MediaSession,
  action: MediaSessionAction,
  handler: MediaSessionActionHandler,
) {
  try {
    ms.setActionHandler(action, handler);
  } catch {
    // Not supported here (e.g. "seekto" on older Safari): the rest still work.
  }
}

export function initMediaSession(engine: AudioEngine): void {
  const ms = session();
  if (!ms || initialised) return;
  initialised = true;

  const updateMetadata = (index: number) => {
    const track = tracks[index];
    if (!track || typeof MediaMetadata === "undefined") return;
    try {
      ms.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        artwork: [
          {
            src: new URL(track.cover, window.location.origin).href,
            type: "image/jpeg",
          },
        ],
      });
    } catch {
      // A malformed artwork entry throws; the lock screen just shows no cover.
    }
  };

  const updatePosition = () => {
    const duration = engine.getDuration();
    if (!("setPositionState" in ms)) return;
    try {
      if (duration > 0)
        ms.setPositionState({
          duration,
          playbackRate: 1,
          position: Math.min(engine.getTime(), duration),
        });
      else ms.setPositionState();
    } catch {
      // position > duration for a moment during a switch: the next event corrects it.
    }
  };

  const updateState = (playing: boolean) => {
    ms.playbackState = playing ? "playing" : "paused";
    updatePosition();
  };

  setHandler(ms, "play", () => {
    const ui = useStore.getState().ui;
    // Sound off (M) paused the music: turning it on resumes it (lib/music.ts).
    if (!ui.soundEnabled) ui.setSoundEnabled(true);
    else void engine.play();
  });
  setHandler(ms, "pause", () => engine.pause());
  setHandler(ms, "nexttrack", () => void engine.next());
  setHandler(ms, "previoustrack", () => void engine.prev());
  setHandler(ms, "seekto", (details) => {
    if (typeof details.seekTime === "number") engine.seek(details.seekTime);
  });
  setHandler(ms, "seekbackward", (details) =>
    engine.seek(engine.getTime() - (details.seekOffset ?? SKIP_S)),
  );
  setHandler(ms, "seekforward", (details) =>
    engine.seek(engine.getTime() + (details.seekOffset ?? SKIP_S)),
  );

  const state = useStore.getState().audio;
  updateMetadata(state.trackIndex);
  updateState(state.playing);
  useStore.subscribe((s) => s.audio.trackIndex, updateMetadata);
  useStore.subscribe((s) => s.audio.playing, updateState);
  engine.onMedia(updatePosition);
}
