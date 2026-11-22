import type { ReactNode } from "react";

/** A row of Metric cards: three across from tablets up, two on phones (4.5). */
export function Metrics({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{children}</div>
  );
}
