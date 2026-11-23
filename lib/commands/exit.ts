/*
 * exit (6.4): closes the terminal (the scrollback stays for next time). On the full-page
 * /terminal (6.6) it leaves the page: Back to where you came from, else Home.
 */
import { terminalCopy } from "@/content/terminal";
import { isBrowser } from "@/lib/browser";
import { leaveTerminal, TERMINAL_ROUTE } from "@/lib/shortcuts";
import type { Command } from "./types";

const t = terminalCopy.commands.exit;

export const exit: Command = {
  name: "exit",
  category: "shell",
  description: t.description,
  usage: t.usage,
  examples: ["exit"],
  run(_args, { print, store, router }) {
    print({ kind: "text", text: t.bye, tone: "muted" });
    store.getState().ui.setTerminalOpen(false);
    if (isBrowser && window.location.pathname === TERMINAL_ROUTE)
      leaveTerminal(router);
  },
};
