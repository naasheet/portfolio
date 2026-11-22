import { ArrowLeft } from "lucide-react";
import { TransitionLink } from "@/components/nav/TransitionLink";
import { colorTransition, focusRing } from "@/components/ui/controlStyles";
import { Kbd } from "@/components/ui/Kbd";
import { chapters } from "@/content/chapters";
import { copy } from "@/content/copy";

const t = copy.notFound;
const home = chapters.find((c) => c.id === "home")?.route ?? "/";

/**
 * The 404 (4.8): a mono "404", a playful line, "Back to the desk" (through the page transition)
 * and a terminal hint. The canvas already shows the faint scatter on any unknown route (R.2).
 *
 * A server component on purpose: Next mounts app/not-found.tsx inside the root layout's error
 * boundary on every page, so any client code here ships in first-load JS everywhere. (Built on
 * Button it cost +18 KB on `/`: Framer's motion component.) The link is TransitionLink styled like
 * a large primary Button (keep the classes in step with components/ui/Button.tsx).
 */
export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col justify-center px-4 py-32 md:px-12">
      <div className="flex max-w-2xl flex-col gap-6">
        <p className="text-footnote font-mono tracking-widest text-accent-primary">
          {t.code}
        </p>
        <h1 className="text-stat-3 font-bold md:text-stat-2">{t.title}</h1>
        <p className="text-body text-text-secondary md:text-title-3 md:font-normal">
          {t.body}
        </p>
        <div className="mt-2 flex flex-col gap-6 sm:flex-row sm:items-center">
          <TransitionLink
            href={home}
            data-cursor="orbit"
            className={`inline-flex h-13 shrink-0 items-center justify-center gap-2 self-start rounded-control border border-transparent bg-accent-primary px-6 text-body font-semibold whitespace-nowrap text-accent-contrast select-none hover:bg-accent-primary-hover [&_svg]:size-4.5 ${colorTransition} ${focusRing}`}
          >
            <ArrowLeft aria-hidden />
            {copy.errors.backHome}
          </TransitionLink>
          <p className="flex flex-wrap items-center gap-2 text-footnote text-text-tertiary">
            {t.hintBefore} <Kbd>`</Kbd> {t.hintAfter}
          </p>
        </div>
      </div>
    </div>
  );
}
