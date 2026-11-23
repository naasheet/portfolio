import {
  Check,
  Hand,
  Info,
  Moon,
  MousePointer2,
  Music,
  Star,
  Sun,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { focusRing } from "@/components/ui/controlStyles";
import { island, type AlertIcon, type IslandAlert } from "@/lib/island";
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
  music: Music,
};

/** The alert shape's content: an icon in a tinted circle, the text, an optional short detail. */
export function IslandAlertView({ alert }: { alert: IslandAlert }) {
  const Icon = ICONS[alert.icon];
  // A long alert (8.1, AR board "Camera's shy?"): the detail is a sentence under the text.
  if (alert.long) {
    return (
      <div className="flex h-full items-center gap-3 py-2 pr-5 pl-2">
        <AlertIconBadge alert={alert} Icon={Icon} />
        <span className="flex max-w-72 flex-col">
          <span className="text-subhead font-semibold text-island-text">
            {alert.text}
          </span>
          {alert.detail ? (
            <span className="text-footnote text-island-text-secondary">
              {alert.detail}
            </span>
          ) : null}
        </span>
        {alert.action ? <AlertAction action={alert.action} /> : null}
      </div>
    );
  }
  return (
    <div className="flex h-full items-center gap-3 pr-5 pl-2">
      <AlertIconBadge alert={alert} Icon={Icon} />
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

/**
 * 8.5: the alert's button (AR board, "Turn off"). Runs the action and closes the alert; the alert
 * waits while the pointer or focus is on it.
 */
function AlertAction({
  action,
}: {
  action: NonNullable<IslandAlert["action"]>;
}) {
  return (
    <button
      type="button"
      data-cursor="orbit"
      onClick={() => {
        action.onClick();
        island.dismissAlert();
      }}
      onPointerEnter={() => island.holdAlert(true)}
      onPointerLeave={() => island.holdAlert(false)}
      onFocus={() => island.holdAlert(true)}
      onBlur={() => island.holdAlert(false)}
      className={cn(
        "flex h-8 shrink-0 cursor-pointer items-center rounded-chip bg-island-accent px-4 text-footnote font-semibold text-island-bg transition-opacity duration-150 ease-out hover:opacity-90 active:scale-[0.97]",
        focusRing,
      )}
    >
      {action.label}
    </button>
  );
}

/** The icon in its tinted circle. */
function AlertIconBadge({
  alert,
  Icon,
}: {
  alert: IslandAlert;
  Icon: LucideIcon;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-chip [&_svg]:size-4",
        alert.tone === "teal" && "bg-island-accent/15 text-island-accent",
        alert.tone === "amber" &&
          "bg-accent-secondary/15 text-accent-secondary",
        alert.tone === "neutral" && "bg-island-text/10 text-island-text",
        alert.tone === "danger" && "bg-island-danger/15 text-island-danger",
      )}
    >
      <Icon />
    </span>
  );
}
