/* prev (6.5): the previous track (or the start of this one, past 3 s), with the crossfade. */
import { terminalCopy } from "@/content/terminal";
import { getMusic } from "@/lib/music";
import { currentTrack, soundOnQuietly } from "./helpers";
import type { Command } from "./types";

const t = terminalCopy.commands.prev;

export const prev: Command = {
  name: "prev",
  category: "music",
  description: t.description,
  usage: t.usage,
  examples: ["prev"],
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
    await engine.prev();
    const track = currentTrack(ctx);
    if (track)
      ctx.print({
        kind: "text",
        text: terminalCopy.commands.nowPlaying(track.title, track.artist),
        tone: "accent",
      });
  },
};
