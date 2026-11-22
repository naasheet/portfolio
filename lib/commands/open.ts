/*
 * open (6.3): a page opens with the page transition (the terminal closes so you see it), a link or
 * the PDF opens in a new tab, a track plays (turning sound on if it was off: Enter is a user
 * gesture, so the browser allows the AudioContext).
 */
import { terminalCopy } from "@/content/terminal";
import { tracks } from "@/content/music";
import { navigate } from "@/lib/motion/pageTransition";
import { startMusic } from "@/lib/music";
import { initSfx } from "@/lib/sfx";
import type { Command } from "./types";

const t = terminalCopy.commands.open;

export const open: Command = {
  name: "open",
  description: t.description,
  usage: t.usage,
  examples: ["open resume.pdf", "open projects/project-1.md", "open music/"],
  complete: (args, { fs, cwd }) =>
    fs.completePath(args[args.length - 1] ?? "", cwd),
  async run(args, ctx) {
    const target = args._[0];
    if (target === undefined) {
      ctx.printError(t.missing);
      return;
    }
    const node = ctx.fs.get(ctx.fs.resolve(ctx.cwd, target));
    if (!node) {
      ctx.printError(terminalCopy.commands.notFound("open", target));
      return;
    }
    const opener = node.open;
    if (!opener) {
      ctx.printError(t.cannot(target));
      return;
    }
    if (opener.kind === "route") {
      ctx.print({ kind: "text", text: t.opening(opener.href), tone: "muted" });
      ctx.store.getState().ui.setTerminalOpen(false);
      navigate(ctx.router, opener.href);
    } else if (opener.kind === "url") {
      ctx.print({ kind: "text", text: t.opening(opener.href), tone: "muted" });
      ctx.openUrl(opener.href);
    } else {
      const track = tracks[opener.index];
      if (!track) return;
      const ui = ctx.store.getState().ui;
      if (!ui.soundEnabled) {
        ui.setSoundEnabled(true);
        void initSfx();
      }
      ctx.print({
        kind: "text",
        text: t.playing(track.title, track.artist),
        tone: "accent",
      });
      await startMusic({ track: opener.index });
    }
  },
};
