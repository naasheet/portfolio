/*
 * ask (6.5): a question for the chatbot. Until phase 7 builds it, a line saying it's on the way.
 * TODO(7.4): hand the question over through the store (open the chat with it) instead.
 */
import { terminalCopy } from "@/content/terminal";
import type { Command } from "./types";

const t = terminalCopy.commands.ask;

export const ask: Command = {
  name: "ask",
  category: "site",
  description: t.description,
  usage: t.usage,
  examples: ["ask what are you working on?"],
  run(args, ctx) {
    if (!args.raw.join(" ").trim()) {
      ctx.printError(t.missing);
      return;
    }
    ctx.print([
      {
        kind: "text",
        text: terminalCopy.commands.soon(t.feature, t.phase),
        tone: "muted",
      },
      { kind: "text", text: t.meanwhile, tone: "muted" },
    ]);
  },
};
