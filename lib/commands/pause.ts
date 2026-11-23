/* pause (6.5): pause the music (sound stays on; `play` resumes). */
import { terminalCopy } from "@/content/terminal";
import { getMusic } from "@/lib/music";
import type { Command } from "./types";

const t = terminalCopy.commands.pause;

export const pause: Command = {
  name: "pause",
  category: "music",
  description: t.description,
  usage: t.usage,
  examples: ["pause"],
  run(_args, ctx) {
    const engine = getMusic();
    if (!engine || !ctx.store.getState().audio.playing) {
      ctx.print({ kind: "text", text: t.nothing, tone: "muted" });
      return;
    }
    engine.pause();
    ctx.print({ kind: "text", text: t.paused, tone: "muted" });
  },
};
