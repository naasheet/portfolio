/*
 * goto (6.5): close the terminal and go to a page, by id, name, number or route ("work", "3",
 * "/work"), optionally with a section ("work#contact-me"). Another page opens with the page
 * transition; the page you're on glides (Lenis) to the top or the section once the drawer has
 * let go of the scroll lock.
 */
import { chapters } from "@/content/chapters";
import { terminalCopy } from "@/content/terminal";
import { scrollTo, whenUnlocked } from "@/lib/motion/lenis";
import { navigate } from "@/lib/motion/pageTransition";
import { findPage, pageNames, pageNumber } from "./helpers";
import type { Command } from "./types";

const t = terminalCopy.commands.goto;

export const goto: Command = {
  name: "goto",
  category: "navigate",
  description: t.description,
  usage: t.usage,
  examples: ["goto work", "goto 6", "goto about"],
  complete: () => chapters.map((c) => c.id),
  run(args, ctx) {
    const target = args._[0];
    if (target === undefined) {
      ctx.printError(t.missing(pageNames()));
      return;
    }
    const [word = "", hash] = target.split("#");
    const page = findPage(word);
    if (!page) {
      ctx.printError(t.unknown(word, pageNames()));
      return;
    }
    const section = hash ? `#${hash}` : "";
    ctx.store.getState().ui.setTerminalOpen(false);
    if (window.location.pathname === page.route) {
      ctx.print({ kind: "text", text: t.here(page.name), tone: "muted" });
      whenUnlocked(() => scrollTo(section || 0));
      return;
    }
    ctx.print({
      kind: "text",
      text: t.going(pageNumber(page.id), page.name),
      tone: "muted",
    });
    navigate(ctx.router, page.route + section);
  },
};
