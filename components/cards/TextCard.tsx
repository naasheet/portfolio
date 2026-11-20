import { Card } from "@/components/ui/Card";
import { CardEyebrow } from "./CardEyebrow";

export type TextCardProps = {
  eyebrow: string;
  heading: string;
  /** One or more paragraphs. */
  body: string | string[];
  className?: string;
};

/** A heading and a few lines of body copy, for the bio. */
export function TextCard({ eyebrow, heading, body, className }: TextCardProps) {
  const paragraphs = Array.isArray(body) ? body : [body];
  return (
    <Card className={className}>
      <div className="flex h-full flex-col gap-4">
        <CardEyebrow>{eyebrow}</CardEyebrow>
        <h3 className="text-title-2 font-semibold">{heading}</h3>
        {paragraphs.map((p) => (
          <p key={p} className="text-subhead text-text-secondary">
            {p}
          </p>
        ))}
      </div>
    </Card>
  );
}
