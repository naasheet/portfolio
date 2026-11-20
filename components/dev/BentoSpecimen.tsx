import { BentoGrid } from "@/components/ui/BentoGrid";
import {
  BentoItem,
  type BentoCols,
  type BentoRows,
} from "@/components/ui/BentoItem";
import { Card, type CardVariant } from "@/components/ui/Card";

const ITEMS: {
  name: string;
  variant: CardVariant;
  interactive?: boolean;
  col: BentoCols;
  row?: BentoRows;
}[] = [
  {
    name: "A",
    variant: "glass",
    interactive: true,
    col: { md: 3, lg: 4 },
    row: { md: 2 },
  },
  { name: "B", variant: "glass", col: { md: 3, lg: 2 } },
  { name: "C", variant: "solid", col: { md: 3, lg: 6 } },
  { name: "D", variant: "media", col: { md: 3, lg: 3 } },
  { name: "E", variant: "glass", interactive: true, col: { md: 3, lg: 5 } },
  { name: "F", variant: "glass", col: { md: 2, lg: 3 } },
  { name: "G", variant: "media", interactive: true, col: { md: 2, lg: 3 } },
  { name: "H", variant: "solid", interactive: true, col: { md: 2, lg: 6 } },
];

function spanLabel(col: BentoCols, row?: BentoRows) {
  const r = row?.md ?? row?.base;
  return `md ${col.md}/6 · lg ${col.lg}/12${r ? ` · ${r} rows` : ""}`;
}

/** Eight placeholder cards in mixed sizes on the real grid. */
export function BentoSpecimen() {
  return (
    <BentoGrid>
      {ITEMS.map(({ name, variant, interactive, col, row }) => (
        <BentoItem key={name} col={col} row={row}>
          <Card variant={variant} interactive={interactive} className="h-full">
            {variant === "media" ? (
              <div className="flex h-full min-h-40 flex-col justify-end bg-linear-to-br from-accent-primary/40 to-accent-secondary/30 p-6">
                <span className="text-headline">{name} · media</span>
                <span className="text-footnote text-text-secondary">
                  {spanLabel(col, row)}
                </span>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between gap-4">
                <span className="text-headline">
                  {name} · {variant}
                  {interactive ? " · interactive" : ""}
                </span>
                <span className="text-footnote text-text-secondary">
                  {spanLabel(col, row)}
                </span>
              </div>
            )}
          </Card>
        </BentoItem>
      ))}
    </BentoGrid>
  );
}
