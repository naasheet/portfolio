/* echo (6.2, minimal; 6.4 may add more): prints its arguments, flags included, as typed. */
import { copy } from "@/content/copy";
import type { Command } from "./types";

const t = copy.commands.echo;

export const echo: Command = {
  name: "echo",
  description: t.description,
  usage: t.usage,
  examples: ['echo "hello world"'],
  run(args, ctx) {
    ctx.print({ kind: "text", text: args.raw.join(" ") });
  },
};
