import {
  Check,
  Hand,
  Info,
  Moon,
  MousePointer2,
  Star,
  Sun,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import type { AlertIcon, IslandAlert } from "@/lib/island";
import { cn } from "@/lib/utils";

const ICONS: Record<AlertIcon, LucideIcon> = {
  check: Check,
  info: Info,
  sun: Sun,
  moon: Moon,
  volume: Volume2,
  mute: VolumeX,
  mouse: MousePointer2,
  hand: Hand,
  star: Star,
};

/** The alert shape's content: an icon in a tinted circle, the text, an optional short detail. */
export function IslandAlertView({ alert }: { alert: IslandAlert }) {
  const Icon = ICONS[alert.icon];
  return (
    <div className="flex h-full items-center gap-3 pr-5 pl-2">
      <span
        aria-hidden
        className={cn(
          "flex size-9 items-center justify-center rounded-chip [&_svg]:size-4",
          alert.tone === "teal" && "bg-island-accent/15 text-island-accent",
          alert.tone === "amber" &&
            "bg-accent-secondary/15 text-accent-secondary",
          alert.tone === "neutral" && "bg-island-text/10 text-island-text",
        )}
      >
        <Icon />
      </span>
      <span className="text-subhead font-semibold whitespace-nowrap text-island-text">
        {alert.text}
      </span>
      {alert.detail ? (
        <span className="text-footnote whitespace-nowrap text-island-text-secondary">
          {alert.detail}
        </span>
      ) : null}
    </div>
  );
}
