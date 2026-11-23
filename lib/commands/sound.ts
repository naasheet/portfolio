/*
 * sound (6.5): the same switch as M and the nav's sound circle (toggleSound: music and UI
 * sounds, the island's alert). Enter is a user gesture, so turning it on may create the
 * AudioContext.
 */
import { terminalCopy } from "@/content/terminal";
import { toggleSound } from "@/lib/shortcuts";
import type { Command } from "./types";

const t = terminalCopy.commands.sound;
const CHOICES = ["on", "off", "toggle"] as const;

export const sound: Command = {
  name: "sound",
  category: "music",
  description: t.description,
  usage: t.usage,
  examples: ["sound on", "sound off", "sound"],
  complete: () => [...CHOICES],
  run(args, ctx) {
    const on = ctx.store.getState().ui.soundEnabled;
    const what = args._[0]?.toLowerCase();
    if (what === undefined) {
      ctx.print(t.state(on));
      return;
    }
    if (!CHOICES.includes(what as (typeof CHOICES)[number])) {
      ctx.printError(terminalCopy.commands.oneOf("sound", what, CHOICES));
      return;
    }
    const want = what === "toggle" ? !on : what === "on";
    if (want === on) {
      ctx.print({ kind: "text", text: t.already(on), tone: "muted" });
      return;
    }
    toggleSound();
    ctx.print({ kind: "text", text: t.state(want), tone: "accent" });
  },
};
