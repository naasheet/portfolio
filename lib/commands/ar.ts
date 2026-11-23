/*
 * ar (6.5): Hand mode on or off, the same store flag as the A key and the nav's switch
 * (setHandMode). Until phase 8 builds the camera and gestures, it also says they're on the way.
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
    setHandMode(what === "on");
    ctx.print({
      kind: "text",
      text: what === "on" ? t.on : t.off,
      tone: "accent",
    });
    // TODO(8.x): drop this line once the camera and gestures exist.
    if (what === "on")
      ctx.print({
        kind: "text",
        text: terminalCopy.commands.soon(t.feature, t.phase),
        tone: "muted",
      });
  },
};
