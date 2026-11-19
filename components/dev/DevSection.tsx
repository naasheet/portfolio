import type { ReactNode } from "react";

/** A titled section of the /dev specimen page. */
export function DevSection({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-6">
      <header className="flex flex-col gap-1 border-b border-border-default pb-4">
        <h2 className="text-title-2 font-semibold">{title}</h2>
        {note ? (
          <p className="text-subhead text-text-secondary">{note}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
