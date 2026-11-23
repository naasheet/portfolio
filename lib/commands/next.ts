/* next (6.5): the next track in this visit's order, with the crossfade. */
import { terminalCopy } from "@/content/terminal";
import { getMusic } from "@/lib/music";
import { currentTrack, soundOnQuietly } from "./helpers";
import type { Command } from "./types";

const t = terminalCopy.commands.next;

export const next: Command = {
  name: "next",
  category: "music",
  description: t.description,
  usage: t.usage,
  examples: ["next"],
  async run(_args, ctx) {
    const engine = getMusic();
    if (!engine) {
      ctx.print({
        kind: "text",
        text: terminalCopy.commands.noMusic,
        tone: "muted",
      });
      return;
    }
    soundOnQuietly(ctx);
    await engine.next();
    const track = currentTrack(ctx);
    if (track)
      ctx.print({
        kind: "text",
        text: terminalCopy.commands.nowPlaying(track.title, track.artist),
        tone: "accent",
      });
  },
};
