"use client";

import { useEffect, useState } from "react";
import { profile } from "@/content/profile";

function nowIn(timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date());
}

/**
 * "Indore · 22:06 IST": the local time where Nasheet is, updated on the minute. The time only
 * renders after mount (the server can't know it), so the slot keeps its width meanwhile.
 */
export function GateClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setTime(nowIn(profile.timeZone));
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return (
    <span className="text-footnote font-mono text-text-tertiary tabular-nums">
      {profile.city} ·{" "}
      <span className="inline-block min-w-[5ch]">{time ?? "--:--"}</span>{" "}
      {profile.zoneLabel}
    </span>
  );
}
