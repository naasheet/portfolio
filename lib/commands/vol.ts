/*
 * vol (6.5): print or set the music volume, 0–100. With the engine running it sets it there
 * (saved, and written to the store); before that it saves the level the engine starts at.
 */
import { terminalCopy } from "@/content/terminal";
import { storage } from "@/lib/browser";
import { getMusic } from "@/lib/music";
import type { Command } from "./types";

const t = terminalCopy.commands.vol;
/** The engine's own key (lib/audio/engine.ts), read when it starts. */
const VOLUME_KEY = "volume";

export const vol: Command = {
  name: "vol",
  aliases: ["volume"],
  category: "music",
  description: t.description,
  usage: t.usage,
  examples: ["vol", "vol 40", "vol 0"],
  run(args, ctx) {
    const audio = ctx.store.getState().audio;
    const raw = args._[0]?.replace(/%$/, "");
    if (raw === undefined) {
      ctx.print(t.level(Math.round(audio.volume * 100)));
      return;
    }
    const n = Number(raw);
    if (raw === "" || !Number.isFinite(n) || n < 0 || n > 100) {
      ctx.printError(t.bad(args._[0]!));
      return;
    }
    const v = n / 100;
    const engine = getMusic();
    if (engine) engine.setVolume(v);
    else {
      audio.setVolume(v);
      storage.set(VOLUME_KEY, String(v));
    }
    ctx.print({ kind: "text", text: t.level(Math.round(n)), tone: "accent" });
  },
};
