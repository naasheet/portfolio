import { Card } from "@/components/ui/Card";
import { LevelDots } from "@/components/ui/LevelDots";
import { cn } from "@/lib/utils";
import { CardEyebrow } from "./CardEyebrow";

export type LegendCardProps = {
  eyebrow: string;
  /** Each meaning with its number of dots, e.g. "I could teach it" · 5. */
  rows: readonly { label: string; level: number }[];
  hoverable?: boolean;
  className?: string;
};

/**
 * What the skill dots mean (4.6, Skills frames: "How to read the dots"). A description list;
 * the dots are decorative here, since the label says it.
 */
export function LegendCard({
  eyebrow,
  rows,
  hoverable,
  className,
}: LegendCardProps) {
  return (
    <Card
      hoverable={hoverable}
      className={cn("flex flex-col gap-5", className)}
    >
      <CardEyebrow mono>{eyebrow}</CardEyebrow>
      <dl className="flex flex-col gap-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-4"
          >
            <dt className="text-subhead text-text-secondary">{r.label}</dt>
            <dd>
              <LevelDots level={r.level} decorative />
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
