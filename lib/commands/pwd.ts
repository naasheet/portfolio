/* pwd (6.3): the current directory as an absolute path ("~" is /home/nasheet). */
import { terminalCopy } from "@/content/terminal";
import type { Command } from "./types";

const t = terminalCopy.commands.pwd;

export const pwd: Command = {
  name: "pwd",
  description: t.description,
  usage: t.usage,
  run(_args, { cwd, print }) {
    print({ kind: "text", text: terminalCopy.fs.home + cwd.slice(1) });
  },
};
