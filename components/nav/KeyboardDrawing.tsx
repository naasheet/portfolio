import { cn } from "@/lib/utils";

/** A small keyboard: the keys the shortcut map uses are lit in teal. Decorative. */
const ROWS: readonly (readonly string[])[] = [
  ["Esc"],
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"],
  ["⇧", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "⇧"],
];

/** Rows step in like a real keyboard (in key widths of 28 px + 4 px gap). */
const INDENT = ["", "", "pl-4", "pl-6", ""];

export function KeyboardDrawing({ lit }: { lit: ReadonlySet<string> }) {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-1 rounded-control border border-border-default bg-bg-base p-3"
    >
      {ROWS.map((row, r) => (
        <div key={r} className={cn("flex gap-1", INDENT[r])}>
          {row.map((key, k) => (
            <span
              key={`${key}-${k}`}
              className={cn(
                "flex h-7 items-center justify-center rounded-key border text-caption-2 font-mono",
                key === "Esc" ? "w-10" : "w-7",
                lit.has(key)
                  ? "border-accent-primary bg-accent-primary text-accent-contrast"
                  : "border-border-default text-text-tertiary",
              )}
            >
              {key}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
