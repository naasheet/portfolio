import { terminalCopy } from "@/content/terminal";

const t = terminalCopy.terminal;

/**
 * `nasheet@portfolio:~/projects$`, teal as on the Overlays board's drawer, with the directory
 * (6.3) in the accent.
 */
export function Prompt({ cwd = t.path }: { cwd?: string }) {
  return (
    <span aria-hidden className="shrink-0 whitespace-pre select-none">
      <span className="text-island-accent">
        {t.user}@{t.host}
      </span>
      <span className="text-island-text-secondary">:</span>
      <span className="text-island-accent">{cwd}</span>
      <span className="text-island-text-secondary">$ </span>
    </span>
  );
}
