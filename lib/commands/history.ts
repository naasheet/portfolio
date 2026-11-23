/* history (6.4): the saved commands (the last 50), numbered; -c forgets them. */
import { terminalCopy } from "@/content/terminal";
import { getHistory } from "@/lib/terminal/history";
import type { Command } from "./types";

const t = terminalCopy.commands.history;

export const history: Command = {
  name: "history",
  category: "shell",
  description: t.description,
  usage: t.usage,
  examples: ["history", "history | grep cd", "history -c"],
  run(args, { print }) {
    const saved = getHistory();
    if (args.flags.c === true) {
      saved.clear();
      print({ kind: "text", text: t.cleared, tone: "muted" });
      return;
    }
    const items = saved.all();
    if (items.length === 0) {
      print({ kind: "text", text: t.empty, tone: "muted" });
      return;
    }
    const width = String(items.length).length;
    print(
      items.map((command, i) => ({
        kind: "text" as const,
        text: `  ${String(i + 1).padStart(width)}  ${command}`,
      })),
    );
  },
};
