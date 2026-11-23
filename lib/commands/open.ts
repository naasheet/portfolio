/*
 * open (6.3; project slugs 6.5): a page opens with the page transition (the terminal closes so you see it), a link or
 * the PDF opens in a new tab, a track plays (turning sound on if it was off: Enter is a user
 * gesture, so the browser allows the AudioContext).
 */
import { terminalCopy } from "@/content/terminal";
import { tracks } from "@/content/music";
import { projects } from "@/content/projects";
import { navigate } from "@/lib/motion/pageTransition";
import { startMusic } from "@/lib/music";
import { initSfx } from "@/lib/sfx";
import type { Command } from "./types";

const t = terminalCopy.commands.open;

export const open: Command = {
  name: "open",
  category: "navigate",
  description: t.description,
  usage: t.usage,
  examples: ["open resume.pdf", "open filmly", "open music/gehra.mp3"],
  complete: (args, { fs, cwd }) => {
    const word = args[args.length - 1] ?? "";
    return [
      ...fs.completePath(word, cwd),
      ...(word.includes("/") ? [] : projects.map((p) => p.slug)),
    ];
  },
  async run(args, ctx) {
    const target = args._[0];
    if (target === undefined) {
      ctx.printError(t.missing);
      return;
    }
    const node = ctx.fs.get(ctx.fs.resolve(ctx.cwd, target));
    // A project's slug (6.5): its case study, else its live site, else its repository.
    const project = node ? undefined : projects.find((p) => p.slug === target);
    if (project) {
      const href = project.hasCaseStudy
        ? `/work/${project.slug}`
        : (project.links.live ?? project.links.repo);
      if (!href) {
        ctx.printError(t.noPage(target));
        return;
      }
      ctx.print({ kind: "text", text: t.opening(href), tone: "muted" });
      if (href.startsWith("/")) {
        ctx.store.getState().ui.setTerminalOpen(false);
        navigate(ctx.router, href);
      } else ctx.openUrl(href);
      return;
    }
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
