/* clear (6.4): the same as Ctrl+L. */
import { terminalCopy } from "@/content/terminal";
import type { Command } from "./types";

const t = terminalCopy.commands.clear;

export const clear: Command = {
  name: "clear",
  category: "shell",
  description: t.description,
  usage: t.usage,
  examples: ["clear"],
  run(_args, ctx) {
    ctx.clear();
  },
};
