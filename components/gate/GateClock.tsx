import { LocalTime } from "@/components/ui/LocalTime";
import { profile } from "@/content/profile";

/** "Indore · 22:06 IST": the local time where Nasheet is (LocalTime), on the loading screen. */
export function GateClock() {
  return (
    <span className="text-footnote font-mono text-text-tertiary tabular-nums">
      {profile.location.city} · <LocalTime />
    </span>
  );
}
