import type { Metadata } from "next";

// TEMPORARY type specimen for chunk 0.2. Delete in chunk 0.6, when /dev replaces it.
// Dev-only text below is specimen filler, not site copy, so it doesn't live in content/.

export const metadata: Metadata = {
  title: "Type specimen",
  robots: { index: false, follow: false },
};

type Token = {
  className: string;
  name: string;
  size: string;
  family: "Display" | "Text";
  tracking: string;
  weight?: string;
};

// Class names are written out in full so Tailwind's scanner picks them up.
const TOKENS: Token[] = [
  {
    className: "text-stat-1",
    name: "stat-1",
    size: "72/72",
    family: "Display",
    tracking: "−0.03em",
  },
  {
    className: "text-stat-2",
    name: "stat-2",
    size: "56/56",
    family: "Display",
    tracking: "−0.03em",
  },
  {
    className: "text-stat-3",
    name: "stat-3",
    size: "48/48",
    family: "Display",
    tracking: "−0.03em",
  },
  {
    className: "text-large-title",
    name: "large-title",
    size: "34/41",
    family: "Display",
    tracking: "−0.02em",
  },
  {
    className: "text-title-1",
    name: "title-1",
    size: "28/34",
    family: "Display",
    tracking: "−0.02em",
  },
  {
    className: "text-title-2",
    name: "title-2",
    size: "22/28",
    family: "Display",
    tracking: "−0.01em",
  },
  {
    className: "text-title-3",
    name: "title-3",
    size: "20/25",
    family: "Display",
    tracking: "−0.01em",
  },
  {
    className: "text-headline",
    name: "headline",
    size: "17/22",
    weight: "600",
    family: "Text",
    tracking: "−0.01em",
  },
  {
    className: "text-body",
    name: "body",
    size: "17/22",
    family: "Text",
    tracking: "−0.01em",
  },
  {
    className: "text-callout",
    name: "callout",
    size: "16/21",
    family: "Text",
    tracking: "0",
  },
  {
    className: "text-subhead",
    name: "subhead",
    size: "15/20",
    family: "Text",
    tracking: "0",
  },
  {
    className: "text-footnote",
    name: "footnote",
    size: "13/18",
    family: "Text",
    tracking: "0",
  },
  {
    className: "text-caption-1",
    name: "caption-1",
    size: "12/16",
    family: "Text",
    tracking: "+0.01em",
  },
  {
    className: "text-caption-2",
    name: "caption-2",
    size: "11/13",
    family: "Text",
    tracking: "+0.01em",
  },
];

const SAMPLE = "The quick brown fox jumps over the lazy dog";

export default function TypeSpecimenPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-large-title font-bold">Type specimen</h1>
        <p className="text-footnote">
          Temporary page for chunk 0.2 — removed in 0.6.
        </p>
      </header>

      <ul className="flex flex-col gap-8">
        {TOKENS.map((token) => (
          <li
            key={token.name}
            className="flex flex-col gap-2 border-t border-current/15 pt-4"
          >
            <p className="text-caption-1 font-mono tabular-nums">
              text-{token.name} · {token.size}px
              {token.weight ? ` · ${token.weight}` : ""} · {token.family} ·{" "}
              {token.tracking}
            </p>
            <p className={token.className}>
              {token.name.startsWith("stat") ? "1,234,567" : SAMPLE}
            </p>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-4 border-t border-current/15 pt-4">
        <p className="text-caption-1 font-mono">
          weights · Text 400 / 500 / 600 / 700
        </p>
        <p className="text-body font-normal">Regular 400 — {SAMPLE}</p>
        <p className="text-body font-medium">Medium 500 — {SAMPLE}</p>
        <p className="text-body font-semibold">Semibold 600 — {SAMPLE}</p>
        <p className="text-body font-bold">Bold 700 — {SAMPLE}</p>
      </section>

      <section className="flex flex-col gap-4 border-t border-current/15 pt-4">
        <p className="text-caption-1 font-mono">tabular-nums vs proportional</p>
        <p className="text-title-2 tabular-nums">1111111 · 0000000 · 9876543</p>
        <p className="text-title-2">1111111 · 0000000 · 9876543</p>
      </section>

      <section className="flex flex-col gap-4 border-t border-current/15 pt-4">
        <p className="text-caption-1 font-mono">mono · SF Mono 400 / 700</p>
        <p className="text-callout font-mono">
          nasheet@portfolio:~$ ls --all | grep work
        </p>
        <p className="text-callout font-mono font-bold">
          ┌──────┐ box drawing │ ok │ └──────┘
        </p>
      </section>
    </main>
  );
}
