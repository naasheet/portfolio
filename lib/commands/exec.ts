/*
 * Running a command line (6.2; && and ; 6.3): parse it, check every command exists, then run the pipe stages
 * left to right. Each stage's printed lines become the next stage's stdin as plain text; only the
 * last stage prints to the screen. Errors (printError) always go to the screen, as stderr does.
 * Ctrl+C aborts the whole line (ctx.signal).
 */
import { terminalCopy } from "@/content/terminal";
import type { PushRouter } from "@/lib/motion/pageTransition";
import { useStore } from "@/lib/store";
import { session, getSession } from "@/lib/terminal/session";
import type { OutputLine } from "@/lib/terminal/types";
import { getFs } from "@/lib/fs";
import { parse, type Stage } from "./parser";
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

/**
 * Run a line: groups joined by `&&` (only if the previous group succeeded) or `;` (anyway).
 * A group fails when a command isn't found, prints an error, or throws. Ctrl+C stops the line.
 */
export async function execute(
  line: string,
  env: { router: PushRouter; signal: AbortSignal },
): Promise<void> {
  const parsed = parse(line);
  if (!parsed.ok) {
    session.print({
      kind: "error",
      text: terminalCopy.terminal.syntax(parsed.error),
    });
    return;
  }
  let ok = true;
  for (const group of parsed.groups) {
    if (group.op === "&&" && !ok) continue;
    ok = await runPipeline(group.stages, env);
  }
}

/** One pipeline: every command must exist; then left to right, stdout piped. True on success. */
async function runPipeline(
  stages: Stage[],
  env: { router: PushRouter; signal: AbortSignal },
): Promise<boolean> {
  const resolved = [];
  for (const stage of stages) {
    const command = findCommand(stage.name);
    if (!command) {
      session.print({
        kind: "error",
        text: terminalCopy.terminal.notFound(stage.name, suggest(stage.name)),
      });
      return false;
    }
    resolved.push({ command, args: stage.args });
  }

  let failed = false;
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
        failed = true;
        if (!env.signal.aborted)
          session.print({ kind: "error", text: message });
      },
      clear: session.clear,
      store: useStore,
      router: env.router,
      fs: getFs(),
      // Read now, not when the line started: `cd projects && ls` lists projects/.
      cwd: getSession().cwd,
      setCwd: session.setCwd,
      prompt: (question) => session.ask(question, env.signal),
      signal: env.signal,
      stdin,
      piped: i > 0,
      openUrl,
    };
    try {
      await command.run(args, ctx);
    } catch (error) {
      if (env.signal.aborted) throw error;
      session.print({
        kind: "error",
        text: `${command.name}: ${error instanceof Error ? error.message : String(error)}`,
      });
      return false;
    }
    if (env.signal.aborted) throw new DOMException("Cancelled", "AbortError");
    stdin = captured.flatMap(toText);
  }
  return !failed;
}
