/*
 * ar (6.5): Hand mode on or off, through setHandMode like the A key and the nav's switch (8.1:
 * "on" opens the camera explainer). Until 8.2 tracks the hand, it also says that's on the way.
 */
import { terminalCopy } from "@/content/terminal";
import { setHandMode } from "@/lib/shortcuts";
import type { Command } from "./types";

const t = terminalCopy.commands.ar;
const CHOICES = ["on", "off"] as const;

export const ar: Command = {
  name: "ar",
  category: "site",
  description: t.description,
  usage: t.usage,
  examples: ["ar on", "ar off"],
  complete: () => [...CHOICES],
  run(args, ctx) {
    const on = ctx.store.getState().ar.enabled;
    const what = args._[0]?.toLowerCase();
    if (what === undefined) {
      ctx.print(t.state(on));
      return;
    }
    if (what !== "on" && what !== "off") {
      ctx.printError(terminalCopy.commands.oneOf("ar", what, CHOICES));
      return;
    }
    if (what === "on" && on) {
      ctx.print({ kind: "text", text: t.already, tone: "muted" });
      return;
    }
    // On: the explainer (or, once allowed, the camera); phones and camera-less devices get an
    // island alert instead (setHandMode, 8.1).
    setHandMode(what === "on");
    ctx.print({
      kind: "text",
      text: what === "on" ? t.on : t.off,
      tone: "accent",
    });
    // TODO(8.3): drop this line once the hand drives the cursor (8.2 only tracks it).
    if (what === "on")
      ctx.print({
        kind: "text",
        text: terminalCopy.commands.soon(t.feature, t.phase),
        tone: "muted",
      });
  },
};
