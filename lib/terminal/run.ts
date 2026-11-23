/*
 * Running one line the way the prompt does (6.6, moved out of Terminal.tsx): echo it, file it in
 * the history, run it through lib/commands with a fresh signal, print ^C or the error, end. The
 * prompt's Enter, the Welcome chips and the /terminal page's quick chips all come through here,
 * so a tap and a typed line behave the same. Terminal.tsx re-focuses the input when it ends.
 */
import { execute } from "@/lib/commands/exec";
import type { PushRouter } from "@/lib/motion/pageTransition";
import { getHistory } from "./history";
import { getSession, session } from "./session";

export async function runLine(raw: string, router: PushRouter): Promise<void> {
  session.print({ kind: "input", text: raw, cwd: getSession().cwd });
  getHistory().push(raw);
  if (!raw.trim()) return;
  const signal = session.begin();
  try {
    await execute(raw, { router, signal });
  } catch (error) {
    if (signal.aborted)
      session.print({ kind: "text", text: "^C", tone: "muted" });
    else
      session.print({
        kind: "error",
        text: error instanceof Error ? error.message : String(error),
      });
  } finally {
    session.end();
  }
}
