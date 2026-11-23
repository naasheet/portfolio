/*
 * ar (6.5): Hand mode on or off, through setHandMode like the A key and the nav's switch (8.1:
 * "on" opens the camera explainer; 8.3: the hand then drives the cursor).
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
  },
};
