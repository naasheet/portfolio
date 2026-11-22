/*
 * A stand-in runner for 6.1 (real commands are 6.2+): `echo …` echoes, `sleep <s>` waits (so
 * Ctrl+C has something to cancel), anything else is "command not found". 6.2 replaces it with the
 * registry and parser in lib/commands/.
 */
import { copy } from "@/content/copy";
import type { Runner } from "./types";

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Cancelled", "AbortError"));
      },
      { once: true },
    );
  });

export const runStub: Runner = async (input, { print, signal }) => {
  const [command = "", ...args] = input.trim().split(/\s+/);
  if (command === "echo") {
    print({ kind: "text", text: args.join(" ") });
    return;
  }
  if (command === "sleep") {
    const seconds = Math.min(60, Math.max(0, Number(args[0]) || 1));
    await wait(seconds * 1000, signal);
    return;
  }
  print({ kind: "error", text: copy.terminal.notFound(command) });
};
