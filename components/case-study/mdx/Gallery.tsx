import type { ReactNode } from "react";

export type GalleryProps = {
  /** Figures. */
  children: ReactNode;
};

/** Several figures side by side: two columns from tablets up, one on phones (4.5). */
export function Gallery({ children }: GalleryProps) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}
