/*
 * sudo (6.4): `sudo hire-me` runs a fake progress bar (redrawn in place, ctx.status) through some
 * funny steps, then opens the Contact page's message sheet (through ui.contactSheetOpen, so the
 * terminal never imports the page). Ctrl+C stops it. Anything else gets a playful refusal.
 */
import { chapters } from "@/content/chapters";
import { terminalCopy } from "@/content/terminal";
import { navigate } from "@/lib/motion/pageTransition";
import type { Command } from "./types";

const t = terminalCopy.commands.sudo;
const BAR = 10;
const STEP_MS = 420;

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

let refusal = 0;

export const sudo: Command = {
  name: "sudo",
  category: "fun",
  description: t.description,
  usage: t.usage,
  examples: ["sudo hire-me"],
  complete: () => ["hire-me"],
  async run(args, ctx) {
    const what = args._[0];
    if (what === undefined) {
      ctx.printError(t.missing);
      return;
    }
    if (what !== "hire-me") {
      // Cycle through the refusals, so asking twice gets a new one.
      ctx.printError(t.refusals[refusal++ % t.refusals.length]!);
      return;
    }
    const steps = t.steps;
    for (let i = 0; i < steps.length; i++) {
      const done = Math.round(((i + 1) / steps.length) * BAR);
      ctx.status({
        kind: "text",
        text: t.bar(done, BAR, steps[i]!),
        tone: "accent",
      });
      await wait(STEP_MS, ctx.signal);
    }
    ctx.print({ kind: "text", text: t.granted });
    await wait(STEP_MS, ctx.signal);

    const ui = ctx.store.getState().ui;
    ui.setContactSheetOpen(true);
    ui.setTerminalOpen(false);
    const contact =
      chapters.find((c) => c.id === "contact")?.route ?? "/contact";
    if (window.location.pathname !== contact) navigate(ctx.router, contact);
  },
};
