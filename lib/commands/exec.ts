/*
 * Running a command line (6.2): parse it, check every command exists, then run the pipe stages
 * left to right. Each stage's printed lines become the next stage's stdin as plain text; only the
 * last stage prints to the screen. Errors (printError) always go to the screen, as stderr does.
 * Ctrl+C aborts the whole line (ctx.signal).
 */
import { copy } from "@/content/copy";
import type { PushRouter } from "@/lib/motion/pageTransition";
import { useStore } from "@/lib/store";
import { session, getSession } from "@/lib/terminal/session";
import type { OutputLine } from "@/lib/terminal/types";
import { parse } from "./parser";
import { findCommand, suggest } from "./registry";
import type { CommandContext } from "./types";

/** What a stage's output looks like as text (for the next stage's stdin). */
export function toText(line: OutputLine): string[] {
  switch (line.kind) {
    case "input":
    case "text":
    case "error":
    case "link":
      return line.text.split("\n");
    case "ascii":
      return line.text.split("\n");
    case "table":
      return [
        ...(line.head ? [line.head.join("  ")] : []),
        ...line.rows.map((row) => row.join("  ")),
      ];
    case "node":
      return [];
  }
}

const normalise = (line: string | OutputLine | OutputLine[]): OutputLine[] =>
  typeof line === "string"
    ? [{ kind: "text", text: line }]
    : Array.isArray(line)
      ? line
      : [line];

function openUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function execute(
  line: string,
  env: { router: PushRouter; signal: AbortSignal },
): Promise<void> {
  const parsed = parse(line);
  if (!parsed.ok) {
    session.print({ kind: "error", text: copy.terminal.syntax(parsed.error) });
    return;
  }
  const stages = parsed.stages;
  if (stages.length === 0) return;

  const resolved = [];
  for (const stage of stages) {
    const command = findCommand(stage.name);
    if (!command) {
      session.print({
        kind: "error",
        text: copy.terminal.notFound(stage.name, suggest(stage.name)),
      });
      return;
    }
    resolved.push({ command, args: stage.args });
  }

  let stdin: string[] = [];
  for (let i = 0; i < resolved.length; i++) {
    const { command, args } = resolved[i]!;
    const last = i === resolved.length - 1;
    const captured: OutputLine[] = [];
    const ctx: CommandContext = {
      print: (l) => {
        if (env.signal.aborted) return;
        const lines = normalise(l);
        if (last) session.print(lines);
        else captured.push(...lines);
      },
      printError: (message) => {
        if (!env.signal.aborted)
          session.print({ kind: "error", text: message });
      },
      clear: session.clear,
      store: useStore,
      router: env.router,
      fs: null,
      cwd: getSession().cwd,
      setCwd: session.setCwd,
      prompt: (question) => session.ask(question, env.signal),
      signal: env.signal,
      stdin,
      piped: i > 0,
      openUrl,
    };
    await command.run(args, ctx);
    if (env.signal.aborted) throw new DOMException("Cancelled", "AbortError");
    stdin = captured.flatMap(toText);
  }
}
