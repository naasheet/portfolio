import { Card } from "@/components/ui/Card";
import { LocalTime } from "@/components/ui/LocalTime";
import { cn } from "@/lib/utils";
import { CardEyebrow } from "./CardEyebrow";

export type TimeCardProps = {
  eyebrow: string;
  /** A short line beside the clock ("Night owl. Usually replies by noon."). */
  note?: string;
  hoverable?: boolean;
  className?: string;
};

/**
 * Nasheet's local time, big (4.7, Contact frames): "03:58 IST", updated on the minute
 * (LocalTime), with a note on the right.
 */
export function TimeCard({
  eyebrow,
  note,
  hoverable,
  className,
}: TimeCardProps) {
  return (
    <Card
      hoverable={hoverable}
      className={cn("flex flex-col justify-end gap-2", className)}
    >
      <CardEyebrow mono>{eyebrow}</CardEyebrow>
      <div className="flex items-end justify-between gap-6">
        <LocalTime
          className="text-stat-2 font-bold whitespace-nowrap tabular-nums [&>span:first-child]:min-w-0"
          zoneClassName="text-title-3 font-semibold text-text-tertiary"
        />
        {note ? (
          <p className="max-w-56 pb-1 text-right text-footnote text-text-secondary">
            {note}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
