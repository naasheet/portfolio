import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";

export type ProfileCardProps = {
  name: string;
  title: string;
  /** One more line, e.g. what you're studying. */
  line?: string;
  /** A photo; without one, the initials show in its place. */
  photo?: { src: string; alt: string };
  initials: string;
  status: { text: string; tone?: StatusTone };
  className?: string;
};

/** Who I am at a glance: photo, name, title, a line, and a status chip. */
export function ProfileCard({
  name,
  title,
  line,
  photo,
  initials,
  status,
  className,
}: ProfileCardProps) {
  return (
    <Card className={className}>
      <div className="flex h-full flex-col justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="relative inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-chip border border-border-default bg-surface-solid text-title-3 text-accent-primary">
            {photo ? (
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <span aria-hidden>{initials}</span>
            )}
          </span>
          <div className="flex min-w-0 flex-col">
            <h3 className="text-title-2 font-semibold">{name}</h3>
            <p className="text-subhead text-text-secondary">{title}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-4">
          {line ? (
            <p className="text-footnote text-text-tertiary">{line}</p>
          ) : null}
          <StatusChip tone={status.tone}>{status.text}</StatusChip>
        </div>
      </div>
    </Card>
  );
}
