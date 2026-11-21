import { Card } from "@/components/ui/Card";
import { ScrubText } from "@/components/motion/ScrubText";
import { CardEyebrow } from "./CardEyebrow";

export type TextCardProps = {
  eyebrow: string;
  heading?: string;
  /** One or more paragraphs. */
  body: string | string[];
  /**
   * "lead" (4.3, About's short version): the body set large, its words fading from grey to full as
   * it scrolls in (ScrubText). "callout": the body at callout size (About's off-screen card).
   */
  tone?: "default" | "lead" | "callout";
  /** A small mono line at the bottom, e.g. where the text lives ("content/profile.ts · bio"). */
  footnote?: string;
  /** The eyebrow in small uppercase mono (About frame). */
  monoEyebrow?: boolean;
  /** The card hover look without being clickable (4.3; Card `hoverable`). */
  hoverable?: boolean;
  className?: string;
};

/** An eyebrow, an optional heading and a few lines of body copy, for the bio. */
export function TextCard({
  eyebrow,
  heading,
  body,
  tone = "default",
  footnote,
  monoEyebrow = false,
  hoverable = false,
  className,
}: TextCardProps) {
  const paragraphs = Array.isArray(body) ? body : [body];
  return (
    <Card hoverable={hoverable} className={className}>
      <div className="flex h-full flex-col gap-4">
        <CardEyebrow mono={monoEyebrow}>{eyebrow}</CardEyebrow>
        {heading ? <h3 className="text-title-2 font-semibold">{heading}</h3> : null}
        {paragraphs.map((p) =>
          tone === "lead" ? (
            <ScrubText key={p} text={p} className="text-title-3 font-semibold md:text-title-2" />
          ) : (
            <p
              key={p}
              className={
                tone === "callout" ? "text-callout text-text-primary" : "text-subhead text-text-secondary"
              }
            >
              {p}
            </p>
          ),
        )}
        {footnote ? (
          <p className="mt-auto pt-4 text-caption-2 font-mono text-text-tertiary">{footnote}</p>
        ) : null}
      </div>
    </Card>
  );
}
