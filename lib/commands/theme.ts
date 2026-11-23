/*
 * theme (6.5): the same switch as T and the nav's theme button (toggleTheme: the reveal from
 * the button, the island's alert, saved).
 */
import { terminalCopy } from "@/content/terminal";
import { toggleTheme } from "@/lib/shortcuts";
import type { Command } from "./types";

const t = terminalCopy.commands.theme;
const CHOICES = ["dark", "light", "toggle"] as const;

export const theme: Command = {
  name: "theme",
  category: "site",
  description: t.description,
  usage: t.usage,
  examples: ["theme light", "theme toggle", "theme"],
  complete: () => [...CHOICES],
  run(args, ctx) {
    const mode = ctx.store.getState().theme.mode;
    const what = args._[0]?.toLowerCase();
    if (what === undefined) {
      ctx.print(t.state(mode));
      return;
    }
    if (!CHOICES.includes(what as (typeof CHOICES)[number])) {
      ctx.printError(terminalCopy.commands.oneOf("theme", what, CHOICES));
      return;
    }
    const want =
      what === "toggle" ? (mode === "dark" ? "light" : "dark") : what;
    if (want === mode) {
      ctx.print({ kind: "text", text: t.already(mode), tone: "muted" });
      return;
    }
    toggleTheme();
    ctx.print({ kind: "text", text: t.switched(want), tone: "accent" });
  },
};
