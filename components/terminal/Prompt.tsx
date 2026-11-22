import { copy } from "@/content/copy";

const t = copy.terminal;

/** `nasheet@portfolio:~$`, teal as on the Overlays board's drawer, with the path in the accent. */
export function Prompt() {
  return (
    <span aria-hidden className="shrink-0 whitespace-pre select-none">
      <span className="text-island-accent">
        {t.user}@{t.host}
      </span>
      <span className="text-island-text-secondary">:</span>
      <span className="text-island-accent">{t.path}</span>
      <span className="text-island-text-secondary">$ </span>
    </span>
  );
}
