/*
 * A small Markdown → terminal renderer (6.3, `cat`). Block level only, as plain data (so `cat |
 * grep` keeps working): headings in teal, "•" bullets, quotes muted with a bar, a line that is
 * only a link becomes a clickable link line. Inline: **bold**, *em* and `code` lose their marks;
 * an inline [label](url) reads "label (url)".
 */
import type { OutputLine } from "./types";

const LINK_ONLY = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

export function inline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1 ($2)")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1");
}

export function renderMarkdown(source: string): OutputLine[] {
  const out: OutputLine[] = [];
  for (const raw of source.split("\n")) {
    const line = raw.trimEnd();
    let m: RegExpExecArray | null;
    if (line.trim() === "") {
      // A blank line keeps its height (an empty div would collapse).
      out.push({ kind: "text", text: " " });
    } else if ((m = /^#{1,6}\s+(.*)$/.exec(line))) {
      out.push({ kind: "text", text: inline(m[1]!), tone: "accent" });
    } else if ((m = /^\s*[-*]\s+(.*)$/.exec(line))) {
      const link = LINK_ONLY.exec(m[1]!);
      if (link)
        out.push({ kind: "link", text: `• ${link[1]}`, href: link[2]! });
      else out.push({ kind: "text", text: `  • ${inline(m[1]!)}` });
    } else if ((m = /^>\s?(.*)$/.exec(line))) {
      out.push({ kind: "text", text: `│ ${inline(m[1]!)}`, tone: "muted" });
    } else if ((m = LINK_ONLY.exec(line.trim()))) {
      out.push({ kind: "link", text: m[1]!, href: m[2]! });
    } else {
      out.push({ kind: "text", text: inline(line) });
    }
  }
  return out;
}
