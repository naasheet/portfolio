import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type MdCols = 1 | 2 | 3 | 4 | 5 | 6;
type LgCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Column spans, each counted in that breakpoint's own columns: phones have 1 column (always
 * full width), md has 6, lg has 12. A missing breakpoint is derived from the other one in
 * proportion (md 3 → lg 6, lg 4 → md 2); with neither, the item is full width.
 */
export type BentoCols = { md?: MdCols; lg?: LgCols };

/** Row spans per breakpoint. A missing breakpoint inherits from the one below. */
export type BentoRows = { base?: number; md?: number; lg?: number };

export type BentoItemProps = {
  col?: BentoCols;
  row?: BentoRows;
  as?: "div" | "li";
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

function resolveCols({ md, lg }: BentoCols): { md: number; lg: number } {
  return {
    md: md ?? (lg !== undefined ? Math.max(1, Math.round(lg / 2)) : 6),
    lg: lg ?? (md !== undefined ? md * 2 : 12),
  };
}

/** One cell of a BentoGrid. Spans go through CSS variables, so no class names are built. */
export function BentoItem({
  col = {},
  row = {},
  as = "div",
  className,
  style,
  children,
  ...rest
}: BentoItemProps) {
  const cols = resolveCols(col);
  const rowBase = row.base ?? 1;
  const rowMd = row.md ?? rowBase;
  const rowLg = row.lg ?? rowMd;

  const vars = {
    "--col-md": cols.md,
    "--col-lg": cols.lg,
    "--row-base": rowBase,
    "--row-md": rowMd,
    "--row-lg": rowLg,
  } as CSSProperties;

  const Tag = as as "div";
  return (
    <Tag
      {...rest}
      className={cn("bento-item min-w-0", className)}
      style={{ ...vars, ...style }}
    >
      {children}
    </Tag>
  );
}
