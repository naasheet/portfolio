/* exit (6.4): closes the terminal (the scrollback stays for next time). */
import { terminalCopy } from "@/content/terminal";
import type { Command } from "./types";

const t = terminalCopy.commands.exit;

export const exit: Command = {
  name: "exit",
  category: "shell",
  description: t.description,
  usage: t.usage,
  examples: ["exit"],
  run(_args, { print, store }) {
    print({ kind: "text", text: t.bye, tone: "muted" });
    store.getState().ui.setTerminalOpen(false);
  },
};
