/*
 * The command contract (CLAUDE.md §9.4, 6.2). One file per command in lib/commands/, each
 * exporting a Command, registered by hand in registry.ts. Every command must appear in `help`.
 */
import type { PushRouter } from "@/lib/motion/pageTransition";
import type { useStore } from "@/lib/store";
import type { OutputLine } from "@/lib/terminal/types";

/** One parsed command: `grep -i "now playing" --max=3` → name grep, _ ["now playing"], flags. */
export type Args = {
  /** Positional arguments, in order (quotes removed). */
  _: string[];
  /** `--name=value` → "value"; `--flag` and `-f` → true. `-abc` sets a, b and c. */
  flags: Record<string, string | true>;
  /** Every token after the command name, as typed (quotes removed), flags included. */
  raw: string[];
};

/** The virtual filesystem (6.3). Null until then. */
export type FileSystem = null;

export type CommandContext = {
  print: (line: string | OutputLine | OutputLine[]) => void;
  printError: (message: string) => void;
  clear: () => void;
  store: typeof useStore;
  router: PushRouter;
  fs: FileSystem;
  cwd: string;
  setCwd: (path: string) => void;
  /** Ask a question; resolves with the next line the visitor enters (rejects on Ctrl+C). */
  prompt: (question: string) => Promise<string>;
  /** Aborted by Ctrl+C: long-running commands should check it or pass it on. */
  signal: AbortSignal;
  /** Lines from the command on the left of a pipe; empty when there's no pipe. */
  stdin: string[];
  /** Whether this command's input is a pipe (stdin can be legitimately empty). */
  piped: boolean;
  openUrl: (url: string) => void;
};

export type Command = {
  name: string;
  aliases?: string[];
  /** One line, shown by `help`. */
  description: string;
  /** e.g. "grep [-i] [-v] [-n] <pattern>" */
  usage: string;
  examples?: string[];
  /** Tab completion of arguments: candidates for the word being typed. */
  complete?: (
    args: string[],
    ctx: Pick<CommandContext, "store" | "fs" | "cwd">,
  ) => string[];
  run: (args: Args, ctx: CommandContext) => void | Promise<void>;
};
