/*
 * play (6.5): no argument starts or resumes the music (turning sound on, like M); a track
 * number, id or title starts that track; `play slice` / `play stack` open a game once phase 9
 * exists (until then, a line saying so).
 */
import { tracks } from "@/content/music";
import { terminalCopy } from "@/content/terminal";
import { getMusic, startMusic } from "@/lib/music";
import { toggleSound } from "@/lib/shortcuts";
import { findTrack, soundOnQuietly } from "./helpers";
import type { Command } from "./types";

const t = terminalCopy.commands.play;
const GAMES = ["slice", "stack"] as const;

export const play: Command = {
  name: "play",
  category: "music",
  description: t.description,
  usage: t.usage,
  examples: ["play", "play 2", "play gehra", "play slice"],
  complete: () => [...GAMES, ...tracks.map((track) => track.id)],
  async run(args, ctx) {
    const what = args._.join(" ").trim();
    const game = GAMES.find((g) => g === what.toLowerCase());
    if (game) {
      // TODO(9.x): hand off to the game (navigate to /arcade/<game>).
      ctx.print({
        kind: "text",
        text: terminalCopy.commands.soon(
          t.game(game[0]!.toUpperCase() + game.slice(1)),
          t.games,
        ),
        tone: "muted",
      });
      return;
    }
    if (!what) {
      const ui = ctx.store.getState().ui;
      ctx.print({ kind: "text", text: t.resuming, tone: "accent" });
      // Sound off: the same switch as M (sound on, music starts, the island says so).
      if (!ui.soundEnabled) toggleSound();
      else if (!ctx.store.getState().audio.playing) {
        const engine = getMusic();
        if (engine) await engine.play();
        else await startMusic();
      }
      return;
    }
    const index = findTrack(what);
    const track = tracks[index];
    if (!track) {
      ctx.printError(t.unknown(what));
      return;
    }
    soundOnQuietly(ctx);
    ctx.print({
      kind: "text",
      text: t.playing(track.title, track.artist),
      tone: "accent",
    });
    await startMusic({ track: index });
  },
};
