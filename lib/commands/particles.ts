/*
 * particles (6.5): reshape the canvas from the terminal, through the store's `particles` slice
 * (the canvas reads it; nothing here imports canvas/). A shape holds while you stay on this
 * page; --reset puts the page's own back; --explode is a big push plus a scatter, then the
 * shape re-forms. Page names work as shapes too ("particles work" = the laptop).
 */
import { chapters } from "@/content/chapters";
import { terminalCopy } from "@/content/terminal";
import type { Command } from "./types";

const t = terminalCopy.commands.particles;
const SHAPES: Record<string, string> = t.shapes;
const names = Object.keys(SHAPES);

/** "laptop", "work" or "3" → the registry id. */
function shapeId(word: string): string | undefined {
  const w = word.toLowerCase();
  if (SHAPES[w]) return SHAPES[w];
  const n = Number(w);
  return chapters.find((c, i) => c.id === w || n === i + 1)?.id;
}

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const particles: Command = {
  name: "particles",
  category: "site",
  description: t.description,
  usage: t.usage,
  examples: [
    "particles --explode",
    "particles controller",
    "particles --reset",
  ],
  complete: () => [...names, "--explode", "--reset"],
  run(args, ctx) {
    const slice = ctx.store.getState().particles;
    if (args.flags.explode) {
      if (reducedMotion()) {
        ctx.print({ kind: "text", text: t.still, tone: "muted" });
        return;
      }
      slice.explode();
      ctx.print({ kind: "text", text: t.exploded, tone: "accent" });
      return;
    }
    if (args.flags.reset) {
      slice.setShape(null);
      ctx.print({ kind: "text", text: t.reset, tone: "muted" });
      return;
    }
    const word = args._[0];
    if (word === undefined) {
      ctx.printError(t.missing(names.join(", ")));
      return;
    }
    const id = shapeId(word);
    if (!id) {
      ctx.printError(terminalCopy.commands.oneOf("particles", word, names));
      return;
    }
    slice.setShape(id, window.location.pathname);
    ctx.print({
      kind: "text",
      text: t.shaped(word.toLowerCase()),
      tone: "accent",
    });
  },
};
